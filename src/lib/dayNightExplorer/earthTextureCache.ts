import {
  EARTH_TEXTURE_HEIGHT,
  EARTH_TEXTURE_WIDTH,
  renderEarthTexture,
  type EarthTextureWorkerResponse,
} from './earthTextureRenderer'

const TEXTURE_LOAD_TIMEOUT_MS = 15000

export type CachedEarthTexture = {
  pixels: Uint8Array
  generateMipmaps: boolean
}

// One 8 MiB pixel buffer (and one in-flight build) per application session.
// A new app bundle/session invalidates it along with the versioned map source.
// Consumers may upload these pixels, but must not mutate or transfer the buffer.
let pixelsPromise: Promise<CachedEarthTexture> | undefined

export const loadEarthTexturePixels = (): Promise<CachedEarthTexture> => {
  if (!pixelsPromise) {
    pixelsPromise = buildEarthTexturePixels().catch((error: unknown) => {
      pixelsPromise = undefined
      throw error
    })
  }
  return pixelsPromise
}

const buildEarthTexturePixels = async () => {
  if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    try {
      return { pixels: await buildInWorker(), generateMipmaps: false }
    } catch {
      // WebViews may expose the APIs but reject worker or canvas creation.
    }
  }
  // Preserve the previous CanvasTexture fallback's linear/mipmap sampling.
  return { pixels: await buildOnMainThread(), generateMipmaps: true }
}

const buildInWorker = () =>
  new Promise<Uint8Array>((resolve, reject) => {
    const worker = new Worker(
      new URL(
        '../../components/dayNightExplorer/earthTexture.worker.ts',
        import.meta.url
      ),
      { type: 'module' }
    )
    const finish = () => {
      clearTimeout(timeout)
      worker.onmessage = null
      worker.onerror = null
      worker.terminate()
    }
    const timeout = setTimeout(() => {
      finish()
      reject(new Error('Earth texture worker timed out'))
    }, TEXTURE_LOAD_TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent<EarthTextureWorkerResponse>) => {
      finish()
      if (event.data.type === 'error') {
        reject(new Error(event.data.message))
      } else {
        resolve(new Uint8Array(event.data.pixels))
      }
    }
    worker.onerror = () => {
      finish()
      reject(new Error('Earth texture worker failed'))
    }
  })

const waitForIdle = () =>
  new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout: 1500 })
    } else {
      setTimeout(resolve, 0)
    }
  })

const buildOnMainThread = async () => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TEXTURE_LOAD_TIMEOUT_MS)
  let worldData: unknown
  try {
    const response = await fetch('/data/world-50m-2024.json', {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`Map data request failed with ${response.status}`)
    }
    worldData = await response.json()
  } finally {
    clearTimeout(timeout)
  }

  await waitForIdle()
  const canvas = document.createElement('canvas')
  canvas.width = EARTH_TEXTURE_WIDTH
  canvas.height = EARTH_TEXTURE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D canvas is unavailable')

  try {
    renderEarthTexture(context, canvas.width, canvas.height, worldData)
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
    return new Uint8Array(data.buffer)
  } finally {
    // Release the temporary canvas backing store; only the pixel cache remains.
    canvas.width = 0
    canvas.height = 0
  }
}
