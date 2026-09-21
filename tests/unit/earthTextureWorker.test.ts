import { afterEach, expect, it, vi } from 'vitest'

vi.mock('../../src/features/dayNightExplorer/earthTextureRenderer', () => ({
  EARTH_TEXTURE_WIDTH: 2,
  EARTH_TEXTURE_HEIGHT: 1,
  renderEarthTexture: vi.fn(),
}))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

it('reports failed map requests through the typed error response', async () => {
  const postMessage = vi.fn()
  vi.stubGlobal('self', { postMessage })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
  await import('../../src/features/dayNightExplorer/earthTexture.worker')
  await vi.waitFor(() =>
    expect(postMessage).toHaveBeenCalledWith(
      { type: 'error', message: 'Map data request failed with 503' },
      []
    )
  )
})
