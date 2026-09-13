// Asset preparation only: key generated green-backed masters into real alpha
// layers. The app consumes exported WebP files directly.
const characters = new Map<string, Promise<HTMLCanvasElement>>()

export function loadWeatherCharacter(
  source: string
): Promise<HTMLCanvasElement> {
  const cached = characters.get(source)
  if (cached) return cached
  const pending = new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(
          1,
          768 / Math.max(image.naturalWidth, image.naturalHeight)
        )
        canvas.width = Math.round(image.naturalWidth * scale)
        canvas.height = Math.round(image.naturalHeight * scale)
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) throw new Error('Canvas is unavailable')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
        const rgba = pixels.data
        let left = canvas.width,
          top = canvas.height,
          right = 0,
          bottom = 0
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4
            const red = rgba[index]!,
              green = rgba[index + 1]!,
              blue = rgba[index + 2]!
            const dominance = green - Math.max(red, blue)
            // Smooth edge transition; non-green subject pixels remain opaque.
            const key = Math.max(0, Math.min(1, (dominance - 18) / 65))
            const alpha = 1 - key * key * (3 - 2 * key)
            rgba[index + 3] = Math.round(rgba[index + 3]! * alpha)
            if (key > 0)
              rgba[index + 1] = Math.min(green, Math.max(red, blue) + 12)
            if (rgba[index + 3]! > 16) {
              left = Math.min(left, x)
              top = Math.min(top, y)
              right = Math.max(right, x)
              bottom = Math.max(bottom, y)
            }
          }
        }
        if (right <= left || bottom <= top)
          throw new Error('Character is empty')
        context.putImageData(pixels, 0, 0)
        const cutout = document.createElement('canvas')
        cutout.width = right - left + 1
        cutout.height = bottom - top + 1
        const cutoutContext = cutout.getContext('2d')
        if (!cutoutContext) throw new Error('Canvas is unavailable')
        cutoutContext.drawImage(
          canvas,
          left,
          top,
          cutout.width,
          cutout.height,
          0,
          0,
          cutout.width,
          cutout.height
        )
        resolve(cutout)
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = () => reject(new Error('Character image could not load'))
    image.src = source
  })
  characters.set(source, pending)
  pending.catch(() => characters.delete(source))
  return pending
}
