import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const renderEarthTexture = vi.hoisted(() => vi.fn())
vi.mock('../../../src/features/dayNightExplorer/earthTextureRenderer', () => ({
  EARTH_TEXTURE_WIDTH: 2048,
  EARTH_TEXTURE_HEIGHT: 1024,
  renderEarthTexture,
}))

class TextureWorker {
  static instances: TextureWorker[] = []
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  terminate = vi.fn()

  constructor() {
    TextureWorker.instances.push(this)
  }
}

describe('Earth texture session cache', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    TextureWorker.instances = []
    renderEarthTexture.mockClear()
    vi.stubGlobal('Worker', TextureWorker)
    vi.stubGlobal('OffscreenCanvas', class {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('terminates a failed worker and allows a later visit to retry a failed load', async () => {
    const fetchMap = vi.fn().mockRejectedValue(new Error('Offline'))
    vi.stubGlobal('fetch', fetchMap)
    const { loadEarthTexturePixels } =
      await import('../../../src/features/dayNightExplorer/earthTextureCache')
    const first = loadEarthTexturePixels()
    const rejection = expect(first).rejects.toThrow('Offline')
    TextureWorker.instances[0]!.onerror!()
    await rejection
    expect(TextureWorker.instances[0]!.terminate).toHaveBeenCalledOnce()

    const retry = loadEarthTexturePixels()
    expect(TextureWorker.instances).toHaveLength(2)
    TextureWorker.instances[1]!.onmessage!(
      new MessageEvent('message', {
        data: { type: 'ready', pixels: new ArrayBuffer(16) },
      })
    )
    expect((await retry).pixels).toBeInstanceOf(Uint8Array)
    expect(vi.getTimerCount()).toBe(0)
  })
})
