const MAX_PRELOADED_IMAGES = 8
const preloadedImages = new Map<string, HTMLImageElement>()

export const preloadImage = (src: string) => {
  if (!src || typeof Image === 'undefined') return

  const cached = preloadedImages.get(src)
  if (cached) {
    preloadedImages.delete(src)
    preloadedImages.set(src, cached)
    return
  }

  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = 'low'
  preloadedImages.set(src, image)
  if (preloadedImages.size > MAX_PRELOADED_IMAGES) {
    const oldest = preloadedImages.keys().next().value
    if (oldest) preloadedImages.delete(oldest)
  }
  const forgetFailedImage = () => {
    if (preloadedImages.get(src) === image) preloadedImages.delete(src)
  }
  image.onerror = forgetFailedImage
  image.src = src
  void image.decode?.().catch(forgetFailedImage)
}
