import { afterEach, beforeEach, expect, it, vi } from 'vitest'

class PreloadedImage {
  static instances: PreloadedImage[] = []
  src = ''
  decoding = ''
  fetchPriority = ''
  onerror: (() => void) | null = null
  decode = vi.fn().mockResolvedValue(undefined)

  constructor() {
    PreloadedImage.instances.push(this)
  }
}

beforeEach(() => {
  vi.resetModules()
  PreloadedImage.instances = []
  vi.stubGlobal('Image', PreloadedImage)
})
afterEach(() => vi.unstubAllGlobals())

it('allows failed images to be retried', async () => {
  const { preloadImage } = await import('../../../src/lib/imageLoading')
  preloadImage('/retry.webp')
  PreloadedImage.instances[0]!.onerror!()
  preloadImage('/retry.webp')
  expect(PreloadedImage.instances).toHaveLength(2)
})
