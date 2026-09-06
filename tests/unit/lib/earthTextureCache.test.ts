import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const renderEarthTexture = vi.hoisted(() => vi.fn())
vi.mock('../../../src/lib/dayNightExplorer/earthTextureRenderer', () => ({
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

  it('shares one build and the same buffer across concurrent and later visits', async () => {
    const { loadEarthTexturePixels } =
      await import('../../../src/lib/dayNightExplorer/earthTextureCache')
    const first = loadEarthTexturePixels()
    const overlappingVisit = loadEarthTexturePixels()
    expect(overlappingVisit).toBe(first)
    expect(TextureWorker.instances).toHaveLength(1)

    const buffer = new ArrayBuffer(16)
    const worker = TextureWorker.instances[0]!
    worker.onmessage!(
      new MessageEvent('message', {
        data: { type: 'ready', pixels: buffer },
      })
    )

    const pixels = await first
    expect(pixels.pixels.buffer).toBe(buffer)
    expect(pixels.generateMipmaps).toBe(false)
    for (let visit = 0; visit < 10; visit += 1) {
      expect(await loadEarthTexturePixels()).toBe(pixels)
    }
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    expect(TextureWorker.instances).toHaveLength(1)
  })

  it('shares the full-resolution fallback result when workers are unavailable', async () => {
    vi.stubGlobal('Worker', undefined)
    const buffer = new ArrayBuffer(16)
    const getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(buffer) }))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getImageData,
    } as unknown as CanvasRenderingContext2D)
    const fetchMap = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ map: 'fixture' }),
    })
    vi.stubGlobal('fetch', fetchMap)
    const { loadEarthTexturePixels } =
      await import('../../../src/lib/dayNightExplorer/earthTextureCache')
    const first = loadEarthTexturePixels()
    const second = loadEarthTexturePixels()
    await vi.runAllTimersAsync()

    expect(await second).toBe(await first)
    expect(await loadEarthTexturePixels()).toBe(await first)
    expect(fetchMap).toHaveBeenCalledOnce()
    expect(renderEarthTexture).toHaveBeenCalledWith(
      expect.anything(),
      2048,
      1024,
      { map: 'fixture' }
    )
    expect(getImageData).toHaveBeenCalledWith(0, 0, 2048, 1024)
    expect((await first).pixels.buffer).toBe(buffer)
    expect((await first).generateMipmaps).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('terminates a failed worker and allows a later visit to retry a failed load', async () => {
    const fetchMap = vi.fn().mockRejectedValue(new Error('Offline'))
    vi.stubGlobal('fetch', fetchMap)
    const { loadEarthTexturePixels } =
      await import('../../../src/lib/dayNightExplorer/earthTextureCache')
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

  it('terminates a stalled worker before trying the fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')))
    const { loadEarthTexturePixels } =
      await import('../../../src/lib/dayNightExplorer/earthTextureCache')
    const rejection = expect(loadEarthTexturePixels()).rejects.toThrow(
      'Offline'
    )
    await vi.advanceTimersByTimeAsync(15000)
    await rejection
    expect(TextureWorker.instances[0]!.terminate).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
