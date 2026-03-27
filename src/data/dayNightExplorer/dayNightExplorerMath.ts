import type { SunPosition } from '../../lib/solar'
import { clockGeometry, explorerUi } from './dayNightExplorer.constants'
import type { ExplorerRenderMode } from './dayNightExplorerOptions'

export type ExplorerRenderScene = {
  viewLongitude: number
  viewLatitude: number
  overlayCenterLongitude: number
  overlayCenterLatitude: number
}

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

const dotProduct = (
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
) => {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

const latLonToVector = (latDegrees: number, lonDegrees: number) => {
  const lat = (latDegrees * Math.PI) / 180
  const lon = (lonDegrees * Math.PI) / 180
  const cosLat = Math.cos(lat)

  return {
    x: cosLat * Math.cos(lon),
    y: cosLat * Math.sin(lon),
    z: Math.sin(lat),
  }
}

export const drawNightOverlay = (options: {
  context: CanvasRenderingContext2D
  centerX: number
  centerY: number
  radius: number
  centerLongitude: number
  centerLatitude: number
  sunLongitude: number
  sunLatitude: number
}) => {
  const {
    context,
    centerX,
    centerY,
    radius,
    centerLongitude,
    centerLatitude,
    sunLongitude,
    sunLatitude,
  } = options

  const sunVectorWorld = latLonToVector(sunLatitude, sunLongitude)
  const centerLon = (centerLongitude * Math.PI) / 180
  const centerLat = (centerLatitude * Math.PI) / 180
  const centerCosLat = Math.cos(centerLat)
  const centerSinLat = Math.sin(centerLat)
  const centerCosLon = Math.cos(centerLon)
  const centerSinLon = Math.sin(centerLon)

  const east = {
    x: -centerSinLon,
    y: centerCosLon,
    z: 0,
  }
  const north = {
    x: -centerSinLat * centerCosLon,
    y: -centerSinLat * centerSinLon,
    z: centerCosLat,
  }
  const outward = {
    x: centerCosLat * centerCosLon,
    y: centerCosLat * centerSinLon,
    z: centerSinLat,
  }

  const sunVectorView = {
    x: dotProduct(sunVectorWorld, east),
    y: dotProduct(sunVectorWorld, north),
    z: dotProduct(sunVectorWorld, outward),
  }

  context.save()
  context.beginPath()
  context.arc(centerX, centerY, radius, 0, Math.PI * 2)
  context.clip()

  const angle = Math.atan2(-sunVectorView.y, -sunVectorView.x)
  const gradStartX = centerX + Math.cos(angle) * radius
  const gradStartY = centerY + Math.sin(angle) * radius
  const gradEndX = centerX - Math.cos(angle) * radius
  const gradEndY = centerY - Math.sin(angle) * radius

  const gradient = context.createLinearGradient(
    gradStartX,
    gradStartY,
    gradEndX,
    gradEndY
  )

  gradient.addColorStop(0, 'rgba(0, 5, 25, 0.9)')
  gradient.addColorStop(0.4, 'rgba(0, 5, 25, 0.85)')
  gradient.addColorStop(0.6, 'rgba(0, 5, 25, 0)')
  gradient.addColorStop(1, 'rgba(0, 5, 25, 0)')

  context.fillStyle = gradient
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
      viewLongitude: observerLongitude,
      viewLatitude: observerLatitude,
      overlayCenterLongitude: observerLongitude,
      overlayCenterLatitude: observerLatitude,
    }
  }

  return {
    viewLongitude: sunPosition.longitude + 90,
    viewLatitude: observerLatitude,
    overlayCenterLongitude: sunPosition.longitude + 90,
    overlayCenterLatitude: observerLatitude,
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
