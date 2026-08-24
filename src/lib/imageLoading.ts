export const preloadImage = (src: string) => {
  if (!src || typeof Image === 'undefined') return

  const image = new Image()
  image.decoding = 'async'
  image.src = src
  void image.decode?.().catch(() => undefined)
}
