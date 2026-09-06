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

it('deduplicates and decodes recent images without retaining the whole catalog', async () => {
  const { preloadImage } = await import('../../../src/lib/imageLoading')
  preloadImage('/first.webp')
  preloadImage('/first.webp')
  expect(PreloadedImage.instances).toHaveLength(1)
  expect(PreloadedImage.instances[0]!.decode).toHaveBeenCalledOnce()
  expect(PreloadedImage.instances[0]!.fetchPriority).toBe('low')
  for (let index = 0; index < 8; index += 1) preloadImage(`/${index}.webp`)
  preloadImage('/7.webp')
  expect(PreloadedImage.instances).toHaveLength(9)
  preloadImage('/first.webp')
  expect(PreloadedImage.instances).toHaveLength(10)
})

it('allows failed images to be retried', async () => {
  const { preloadImage } = await import('../../../src/lib/imageLoading')
  preloadImage('/retry.webp')
  PreloadedImage.instances[0]!.onerror!()
  preloadImage('/retry.webp')
  expect(PreloadedImage.instances).toHaveLength(2)
})
