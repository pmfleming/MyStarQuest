import type { SunPosition } from '../solar'
import { clockGeometry } from './dayNightExplorer.constants'
import { explorerUi } from './dayNightExplorer.constants'
import type { ExplorerRenderMode } from './dayNightExplorerOptions'

export type ExplorerRenderScene = {
  rotation: [number, number, number]
}

type GeoPathRenderer = (shape: unknown) => void

export const normalizeMinutes = (totalMinutes: number) => {
  return (
    ((totalMinutes % explorerUi.totalMinutes) + explorerUi.totalMinutes) %
    explorerUi.totalMinutes
  )
}

export const normalizeExactTime = (
  totalMinutes: number,
  totalSeconds: number
) => {
  let normalizedMinutes = totalMinutes
  let normalizedSeconds = totalSeconds

  if (normalizedSeconds >= 60 || normalizedSeconds < 0) {
    const minuteCarry = Math.floor(normalizedSeconds / 60)
    normalizedMinutes += minuteCarry
    normalizedSeconds -= minuteCarry * 60

    if (normalizedSeconds < 0) {
      normalizedMinutes -= 1
      normalizedSeconds += 60
    }
  }

  return {
    minutes: normalizedMinutes,
    seconds: normalizedSeconds,
  }
}

export const formatTime = (totalMinutes: number) => {
  const normalizedMinutes = Math.floor(normalizeMinutes(totalMinutes))
  const h24 = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60
  const h12 = h24 % 12 || 12

  return {
    h: String(h12).padStart(2, '0'),
    m: String(minutes).padStart(2, '0'),
    ampm: h24 < 12 ? 'AM' : 'PM',
  }
}

export const drawNightOverlay = (options: {
  context: CanvasRenderingContext2D
  path: GeoPathRenderer
  sunLongitude: number
  sunLatitude: number
}) => {
  const { context, path, sunLongitude, sunLatitude } = options

  // The night hemisphere is centered at the antipodal point of the sun
  const nightCenterLongitude =
    sunLongitude > 0 ? sunLongitude - 180 : sunLongitude + 180
  const nightCenterLatitude = -sunLatitude

  // D3 v7 syntax
  const circle = window.d3
    .geoCircle()
    .center([nightCenterLongitude, nightCenterLatitude])
    .radius(90)
  const nightGeoJson = circle()

  context.save()
  context.beginPath()
  path(nightGeoJson)

  // Use a very dark, nearly opaque fill for night
  context.fillStyle = 'rgba(0, 5, 20, 0.85)'
  context.fill()

  context.restore()
}

export const getExplorerRenderScene = (options: {
  renderMode: ExplorerRenderMode
  observerLatitude: number
  observerLongitude: number
  sunPosition: SunPosition
}): ExplorerRenderScene => {
  const { renderMode, observerLatitude, observerLongitude, sunPosition } =
    options

  if (renderMode === 'moving-terminator') {
    return {
      rotation: [-observerLongitude, -observerLatitude, 0],
    }
  }

  return {
    rotation: [-(sunPosition.longitude + 90), -observerLatitude, 0],
  }
}

export const roundedRectPerimeterPoint = (
  t: number,
  width: number,
  height: number,
  radius: number
) => {
  const turns = ((t % 1) + 1) % 1
  const theta = turns * Math.PI * 2
  const dx = Math.sin(theta)
  const dy = -Math.cos(theta)
  const halfWidth = width / 2
  const halfHeight = height / 2
  const roundedRadius = Math.min(radius, halfWidth, halfHeight)
  const straightHalfWidth = halfWidth - roundedRadius
  const straightHalfHeight = halfHeight - roundedRadius
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const signX = Math.sign(dx) || 1
  const signY = Math.sign(dy) || 1
  const epsilon = 1e-6

  if (absDx < epsilon) {
    return { x: clockGeometry.cx, y: clockGeometry.cy + signY * halfHeight }
  }

  if (absDy < epsilon) {
    return { x: clockGeometry.cx + signX * halfWidth, y: clockGeometry.cy }
  }

  const verticalScale = halfWidth / absDx
  const verticalY = absDy * verticalScale
  if (verticalY <= straightHalfHeight + epsilon) {
    return {
      x: clockGeometry.cx + signX * halfWidth,
      y: clockGeometry.cy + signY * verticalY,
    }
  }

  const horizontalScale = halfHeight / absDy
  const horizontalX = absDx * horizontalScale
  if (horizontalX <= straightHalfWidth + epsilon) {
    return {
      x: clockGeometry.cx + signX * horizontalX,
      y: clockGeometry.cy + signY * halfHeight,
    }
  }

  const arcCenterX = straightHalfWidth
  const arcCenterY = straightHalfHeight
  const quadraticB = -2 * (absDx * arcCenterX + absDy * arcCenterY)
  const quadraticC =
    arcCenterX * arcCenterX +
    arcCenterY * arcCenterY -
    roundedRadius * roundedRadius
  const discriminant = Math.max(quadraticB * quadraticB - 4 * quadraticC, 0)
  const scale = (-quadraticB + Math.sqrt(discriminant)) / 2

  return {
    x: clockGeometry.cx + signX * absDx * scale,
    y: clockGeometry.cy + signY * absDy * scale,
  }
}

export const lerpPoint = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  amount: number
) => {
  return {
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
  }
}

export const getClockAngles = (minutes: number, seconds: number) => {
  return {
    minuteAngle: (minutes / 60) * 360,
    hourAngle: (minutes / 720) * 360,
    secondAngle: (seconds / 60) * 360,
  }
}
