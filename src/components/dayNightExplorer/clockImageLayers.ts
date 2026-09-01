export type ClockImageLayer = {
  key: 'base' | 'overlay'
  image: string
  opacity: number
  zIndex: number
}

const BASE_IMAGE_OPACITY = 0.5

const clampOpacity = (opacity: number) => Math.max(0, Math.min(opacity, 1))

export const getClockImageLayers = (
  baseImage: string | null,
  overlayImage: string | null,
  overlayOpacity: number
): ClockImageLayer[] => {
  const resolvedOverlayOpacity = clampOpacity(overlayOpacity) * 0.5

  if (baseImage && baseImage === overlayImage) {
    const combinedOpacity =
      1 - (1 - BASE_IMAGE_OPACITY) * (1 - resolvedOverlayOpacity)

    return [
      {
        key: 'base',
        image: baseImage,
        opacity: combinedOpacity,
        zIndex: 3,
      },
    ]
  }

  const layers: ClockImageLayer[] = []
  if (baseImage) {
    layers.push({
      key: 'base',
      image: baseImage,
      opacity: BASE_IMAGE_OPACITY,
      zIndex: 3,
    })
  }
  if (overlayImage && resolvedOverlayOpacity > 0) {
    layers.push({
      key: 'overlay',
      image: overlayImage,
      opacity: resolvedOverlayOpacity,
      zIndex: 4,
    })
  }

  return layers
}
