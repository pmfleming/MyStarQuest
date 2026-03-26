import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from 'react'
import type {
  Theme,
  ThemeExplorerBackgroundImages,
} from '../contexts/ThemeContext'
import {
  useSelectedDate,
  useSelectedDateSolarTimes,
} from '../contexts/SelectedDateContext'
import { getSolarDeclinationDegrees } from '../lib/solar'
import { getSeason, type Season } from '../lib/seasons'
import { uiTokens } from '../ui/tokens'
import StepperButton from './StepperButton'
import hourHandSvg from '../assets/clock/hourhand.svg'
import minuteHandSvg from '../assets/clock/minutehand.svg'
import pivotSvg from '../assets/clock/pivot.svg'
import secondHandSvg from '../assets/clock/secondhand.svg'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface DayNightExplorerProps {
  theme: Theme
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    d3: any
    topojson: any
    planetaryjs: any
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_MINUTES = 1440

/* Globe & Cities */
const GLOBE_CANVAS_SIZE = Math.round(uiTokens.contentMaxWidth * 0.6470588235)
const CLOCK_SIZE = GLOBE_CANVAS_SIZE
const CX = CLOCK_SIZE / 2
const CY = CLOCK_SIZE / 2
const CLOCK_FACE_WIDTH = uiTokens.contentMaxWidth
const CLOCK_FACE_HEIGHT = GLOBE_CANVAS_SIZE
const CLOCK_FACE_RADIUS = uiTokens.listItemRadius
const AMSTERDAM_LAT = 52.37
const CLOCK_EDGE_INSET = CLOCK_SIZE * 0.0545454545
const CLOCK_FACE_RADIUS_INSET = CLOCK_SIZE * 0.0090909091
const CLOCK_NUMBER_INSET = CLOCK_SIZE * 0.1909090909
const CLOCK_NUMBER_RADIUS_INSET = CLOCK_SIZE * 0.0454545455
const CLOCK_NUMBER_LERP = 0.1
const CLOCK_HOUR_TICK_LERP = 0.11
const CLOCK_MINUTE_TICK_LERP = 0.06
const CLOCK_HOUR_TICK_STROKE = CLOCK_SIZE * 0.0136363636
const CLOCK_MINUTE_TICK_STROKE = CLOCK_SIZE * 0.0068181818
const CLOCK_NUMBER_FONT_SIZE = CLOCK_SIZE * 0.0909090909
const CLOCK_PIVOT_SIZE = CLOCK_SIZE * 0.2
const CLOCK_HAND_HIT_HOUR = CLOCK_SIZE * 0.1272727273
const CLOCK_HAND_HIT_MINUTE = CLOCK_SIZE * 0.1
const CLOCK_HAND_HIT_SECOND = CLOCK_SIZE * 0.0681818182
const CLOCK_SECOND_HAND_BASE_OFFSET = CLOCK_SIZE * 0.0545454545
const HAND_SHADOW_OFFSET_Y = CLOCK_SIZE * 0.0090909091
const HAND_SHADOW_BLUR = CLOCK_SIZE * 0.0136363636
const HAND_SHADOW = `drop-shadow(0 ${HAND_SHADOW_OFFSET_Y}px ${HAND_SHADOW_BLUR}px rgba(0,0,0,0.28))`
const HAND_SVG_VIEWBOX_WIDTH = 1024
const HAND_SVG_VIEWBOX_HEIGHT = 1536
const HOUR_HAND_HEIGHT = CLOCK_SIZE * 0.32
const MINUTE_HAND_HEIGHT = CLOCK_SIZE * 0.4236363636
const SECOND_HAND_HEIGHT = CLOCK_SIZE * 0.4236363636
const HOUR_HAND_WIDTH =
  (HAND_SVG_VIEWBOX_WIDTH / HAND_SVG_VIEWBOX_HEIGHT) * HOUR_HAND_HEIGHT
const MINUTE_HAND_WIDTH =
  (HAND_SVG_VIEWBOX_WIDTH / HAND_SVG_VIEWBOX_HEIGHT) * MINUTE_HAND_HEIGHT
const SECOND_HAND_WIDTH = MINUTE_HAND_WIDTH
const HOUR_HAND_BASE_ROTATION =
  (-Math.atan(HOUR_HAND_WIDTH / HOUR_HAND_HEIGHT) * 180) / Math.PI
const MINUTE_HAND_BASE_ROTATION =
  (-Math.atan(MINUTE_HAND_WIDTH / MINUTE_HAND_HEIGHT) * 180) / Math.PI
const SECOND_HAND_BASE_ROTATION =
  (-Math.atan(SECOND_HAND_WIDTH / SECOND_HAND_HEIGHT) * 180) / Math.PI
const ACTIVITY_IMAGE_WIDTH = CLOCK_SIZE * 0.8545454545
const DIGITAL_CLOCK_TIME_FONT_SIZE = CLOCK_SIZE * 0.1636363636
const DIGITAL_CLOCK_SEPARATOR_FONT_SIZE = CLOCK_SIZE * 0.0818181818
const DIGITAL_CLOCK_AMPM_FONT_SIZE = CLOCK_SIZE * 0.0909090909
const DIGITAL_CLOCK_TEXT_GAP = uiTokens.sectionGap * 3
const DIGITAL_CLOCK_AMPM_MARGIN = uiTokens.sectionGap * 2
const GLOBE_PROJECTION_SCALE = CLOCK_SIZE * 0.4909090909

const CITIES = [
  {
    name: 'Amsterdam',
    lat: 52.37,
    lng: 4.9,
    color: '#ff8c00',
    angle: 20,
    ttl: 3200,
    strokeWidth: 4,
  },
  {
    name: 'Dublin',
    lat: 53.35,
    lng: -6.26,
    color: '#00aaff',
    angle: 16,
    ttl: 2600,
    strokeWidth: 3,
  },
  {
    name: 'Taipei',
    lat: 25.03,
    lng: 121.56,
    color: '#ff3b30',
    angle: 16,
    ttl: 2600,
    strokeWidth: 3,
  },
]

const SCRIPTS = [
  'https://d3js.org/d3.v3.min.js',
  'https://d3js.org/topojson.v1.min.js',
  'https://unpkg.com/planetary.js@1.1.2/dist/planetaryjs.min.js',
] as const

/* ------------------------------------------------------------------ */
/* Helpers & Script Caching                                           */
/* ------------------------------------------------------------------ */

const scriptPromises: Record<string, Promise<void> | undefined> = {}

function loadScript(src: string): Promise<void> {
  const cached = scriptPromises[src]
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = false
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })

  scriptPromises[src] = promise
  return promise
}

async function ensureGlobeScripts() {
  for (const src of SCRIPTS) await loadScript(src)
}

function normalizeMinutes(totalMinutes: number) {
  return ((totalMinutes % TOTAL_MINUTES) + TOTAL_MINUTES) % TOTAL_MINUTES
}

function formatTime(totalMinutes: number) {
  const normMins = Math.floor(normalizeMinutes(totalMinutes))
  const h24 = Math.floor(normMins / 60)
  const m = normMins % 60
  const h12 = h24 % 12 || 12
  return {
    h: String(h12).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    ampm: h24 < 12 ? 'AM' : 'PM',
  }
}

function getImageForTime(minutes: number, theme: Theme) {
  const activityImages = theme.activityImages
  if (!activityImages) return null

  const normMins = Math.floor(normalizeMinutes(minutes))
  if (normMins >= 1261 || normMins <= 450) return activityImages.bedtime
  if (normMins <= 480) return activityImages.eatingBreakfast
  if (normMins <= 495) return activityImages.washingTeeth
  if (normMins <= 525) return activityImages.commute
  if (normMins <= 885) return activityImages.schooltime
  if (normMins <= 915) return activityImages.commute
  if (normMins <= 1080) return activityImages.playing
  if (normMins <= 1140) return activityImages.cooking
  if (normMins <= 1170) return activityImages.eatingDinner
  if (normMins <= 1215) return activityImages.computergames
  if (normMins <= 1244) return activityImages.bathtime
  if (normMins <= 1260) return activityImages.washingTeeth
  return activityImages.bedtime
}

function dotProduct(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function latLonToVector(latDegrees: number, lonDegrees: number) {
  const lat = (latDegrees * Math.PI) / 180
  const lon = (lonDegrees * Math.PI) / 180
  const cosLat = Math.cos(lat)

  return {
    x: cosLat * Math.cos(lon),
    y: cosLat * Math.sin(lon),
    z: Math.sin(lat),
  }
}

function drawNightOverlay(options: {
  context: CanvasRenderingContext2D
  centerX: number
  centerY: number
  radius: number
  centerLongitude: number
  centerLatitude: number
  sunLongitude: number
  sunLatitude: number
}) {
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

  const left = Math.floor(centerX - radius)
  const top = Math.floor(centerY - radius)
  const size = Math.ceil(radius * 2)
  const imageData = context.createImageData(size, size)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offsetX = (left + x + 0.5 - centerX) / radius
      const offsetY = (centerY - (top + y + 0.5)) / radius
      const radialDistanceSquared = offsetX * offsetX + offsetY * offsetY

      if (radialDistanceSquared > 1) continue

      const pointVector = {
        x: offsetX,
        y: offsetY,
        z: Math.sqrt(1 - radialDistanceSquared),
      }
      const illumination = dotProduct(pointVector, sunVectorView)
      const normalizedDarkness = Math.min(
        1,
        Math.max(0, (-illumination + 0.02) / 0.35)
      )
      const alpha = Math.round(normalizedDarkness * 255)
      const pixelIndex = (y * size + x) * 4

      imageData.data[pixelIndex] = 0
      imageData.data[pixelIndex + 1] = 5
      imageData.data[pixelIndex + 2] = 25
      imageData.data[pixelIndex + 3] = alpha
    }
  }

  const overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = size
  overlayCanvas.height = size
  const overlayContext = overlayCanvas.getContext('2d')

  if (!overlayContext) {
    context.restore()
    return
  }

  overlayContext.putImageData(imageData, 0, 0)
  context.drawImage(overlayCanvas, left, top)
  context.restore()
}

function roundedRectPerimeterPoint(
  t: number,
  width: number,
  height: number,
  radius: number
) {
  const turns = ((t % 1) + 1) % 1
  const theta = turns * Math.PI * 2
  const dx = Math.sin(theta)
  const dy = -Math.cos(theta)
  const halfWidth = width / 2
  const halfHeight = height / 2
  const r = Math.min(radius, halfWidth, halfHeight)
  const straightHalfWidth = halfWidth - r
  const straightHalfHeight = halfHeight - r
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const signX = Math.sign(dx) || 1
  const signY = Math.sign(dy) || 1
  const epsilon = 1e-6

  if (absDx < epsilon) {
    return { x: CX, y: CY + signY * halfHeight }
  }

  if (absDy < epsilon) {
    return { x: CX + signX * halfWidth, y: CY }
  }

  const verticalScale = halfWidth / absDx
  const verticalY = absDy * verticalScale
  if (verticalY <= straightHalfHeight + epsilon) {
    return {
      x: CX + signX * halfWidth,
      y: CY + signY * verticalY,
    }
  }

  const horizontalScale = halfHeight / absDy
  const horizontalX = absDx * horizontalScale
  if (horizontalX <= straightHalfWidth + epsilon) {
    return {
      x: CX + signX * horizontalX,
      y: CY + signY * halfHeight,
    }
  }

  const arcCenterX = straightHalfWidth
  const arcCenterY = straightHalfHeight
  const quadraticB = -2 * (absDx * arcCenterX + absDy * arcCenterY)
  const quadraticC = arcCenterX * arcCenterX + arcCenterY * arcCenterY - r * r
  const discriminant = Math.max(quadraticB * quadraticB - 4 * quadraticC, 0)
  const scale = (-quadraticB + Math.sqrt(discriminant)) / 2

  return {
    x: CX + signX * absDx * scale,
    y: CY + signY * absDy * scale,
  }
}

function lerpPoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  amount: number
) {
  return {
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount,
  }
}

type RgbColor = {
  r: number
  g: number
  b: number
}

type ExplorerBackgroundKey = keyof ThemeExplorerBackgroundImages

const EXPLORER_SKY_COLORS = {
  night: { r: 56, g: 78, b: 140 },
  sunrise: { r: 255, g: 196, b: 143 },
  day: { r: 135, g: 206, b: 250 },
  sunset: { r: 255, g: 166, b: 120 },
} as const

function interpolateColor(from: RgbColor, to: RgbColor, amount: number) {
  return {
    r: Math.round(from.r + (to.r - from.r) * amount),
    g: Math.round(from.g + (to.g - from.g) * amount),
    b: Math.round(from.b + (to.b - from.b) * amount),
  }
}

function toRgba(color: RgbColor, alpha: number) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
}

function getNightMidpointMinutes(
  sunriseMinutes: number,
  sunsetMinutes: number
) {
  const wrappedSunriseMinutes =
    sunriseMinutes <= sunsetMinutes
      ? sunriseMinutes + TOTAL_MINUTES
      : sunriseMinutes

  return normalizeMinutes(
    sunsetMinutes + (wrappedSunriseMinutes - sunsetMinutes) / 2
  )
}

function getExplorerBackdropColor(
  minutes: number,
  solarTimes: ReturnType<typeof useSelectedDateSolarTimes>
) {
  const normalizedMinutes = normalizeMinutes(minutes)
  const solarNoonMinutes =
    (solarTimes.daylightStartMinutes + solarTimes.daylightEndMinutes) / 2
  const nightMidpointMinutes = getNightMidpointMinutes(
    solarTimes.sunriseMinutes,
    solarTimes.sunsetMinutes
  )

  const colorStops = [
    {
      minute: nightMidpointMinutes - TOTAL_MINUTES,
      color: EXPLORER_SKY_COLORS.night,
    },
    { minute: solarTimes.sunriseMinutes, color: EXPLORER_SKY_COLORS.sunrise },
    {
      minute: solarTimes.daylightStartMinutes,
      color: EXPLORER_SKY_COLORS.day,
    },
    { minute: solarNoonMinutes, color: EXPLORER_SKY_COLORS.day },
    { minute: solarTimes.daylightEndMinutes, color: EXPLORER_SKY_COLORS.day },
    { minute: solarTimes.sunsetMinutes, color: EXPLORER_SKY_COLORS.sunset },
    {
      minute: nightMidpointMinutes + TOTAL_MINUTES,
      color: EXPLORER_SKY_COLORS.night,
    },
  ]

  const adjustedMinutes =
    normalizedMinutes < solarTimes.sunriseMinutes
      ? normalizedMinutes + TOTAL_MINUTES
      : normalizedMinutes

  for (let i = 0; i < colorStops.length - 1; i++) {
    const currentStop = colorStops[i]
    const nextStop = colorStops[i + 1]

    if (
      adjustedMinutes >= currentStop.minute &&
      adjustedMinutes <= nextStop.minute
    ) {
      const segmentDuration = nextStop.minute - currentStop.minute || 1
      const amount = (adjustedMinutes - currentStop.minute) / segmentDuration

      return toRgba(
        interpolateColor(currentStop.color, nextStop.color, amount),
        0.5
      )
    }
  }

  return toRgba(EXPLORER_SKY_COLORS.night, 0.5)
}

function getExplorerBackgroundBlend(
  minutes: number,
  solarTimes: ReturnType<typeof useSelectedDateSolarTimes>
) {
  const normalizedMinutes = normalizeMinutes(minutes)
  const nightMidpointMinutes = getNightMidpointMinutes(
    solarTimes.sunriseMinutes,
    solarTimes.sunsetMinutes
  )
  const adjustedMinutes =
    normalizedMinutes < solarTimes.sunriseMinutes
      ? normalizedMinutes + TOTAL_MINUTES
      : normalizedMinutes

  const imageStops: Array<{
    minute: number
    key: ExplorerBackgroundKey
  }> = [
    { minute: nightMidpointMinutes - TOTAL_MINUTES, key: 'night' },
    { minute: solarTimes.sunriseMinutes, key: 'sunrise' },
    { minute: solarTimes.daylightStartMinutes, key: 'daytime' },
    { minute: solarTimes.daylightEndMinutes, key: 'daytime' },
    { minute: solarTimes.sunsetMinutes, key: 'sunset' },
    { minute: nightMidpointMinutes + TOTAL_MINUTES, key: 'night' },
  ]

  for (let i = 0; i < imageStops.length - 1; i++) {
    const currentStop = imageStops[i]
    const nextStop = imageStops[i + 1]

    if (
      adjustedMinutes >= currentStop.minute &&
      adjustedMinutes <= nextStop.minute
    ) {
      const segmentDuration = nextStop.minute - currentStop.minute || 1
      const mix = (adjustedMinutes - currentStop.minute) / segmentDuration

      return {
        base: currentStop.key,
        overlay: nextStop.key,
        overlayOpacity: mix,
      }
    }
  }

  return {
    base: 'night' as ExplorerBackgroundKey,
    overlay: 'night' as ExplorerBackgroundKey,
    overlayOpacity: 0,
  }
}

const TICK_MARKS: ReactElement[] = []
for (let i = 0; i < 60; i++) {
  const isHour = i % 5 === 0
  const outer = roundedRectPerimeterPoint(
    i / 60,
    CLOCK_FACE_WIDTH - CLOCK_EDGE_INSET,
    CLOCK_FACE_HEIGHT - CLOCK_EDGE_INSET,
    CLOCK_FACE_RADIUS - CLOCK_FACE_RADIUS_INSET
  )
  const inner = lerpPoint(
    outer,
    { x: CX, y: CY },
    isHour ? CLOCK_HOUR_TICK_LERP : CLOCK_MINUTE_TICK_LERP
  )
  TICK_MARKS.push(
    <line
      key={i}
      x1={inner.x}
      y1={inner.y}
      x2={outer.x}
      y2={outer.y}
      stroke={isHour ? '#333' : '#ccc'}
      strokeWidth={isHour ? CLOCK_HOUR_TICK_STROKE : CLOCK_MINUTE_TICK_STROKE}
      strokeLinecap="round"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function DayNightExplorer({ theme }: DayNightExplorerProps) {
  const { selectedDate } = useSelectedDate()
  const season = getSeason(selectedDate)
  const solarTimes = useSelectedDateSolarTimes()
  const [minutes, setMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })
  const [seconds, setSeconds] = useState(() => new Date().getSeconds())

  const [globeReady, setGlobeReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const minutesRef = useRef(minutes)
  minutesRef.current = minutes
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planetRef = useRef<any>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const activeHandRef = useRef<'hour' | 'minute' | 'second' | null>(null)
  const lastAngleRef = useRef<number>(0)
  const exactMinutesRef = useRef<number>(minutes)

  const adjust = useCallback((delta: number) => {
    setMinutes((prev) => {
      const next = prev + delta
      exactMinutesRef.current = next
      return next
    })
  }, [])

  /* ---------- Timer Logic ---------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1
        if (next >= 60) {
          setMinutes((m) => {
            const nextM = m + 1
            exactMinutesRef.current = nextM
            return nextM
          })
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  /* ---------- Planetary.js Setup ---------- */

  useEffect(() => {
    let cancelled = false

    ensureGlobeScripts().then(() => {
      if (cancelled || !canvasRef.current) return

      const pjs = window.planetaryjs
      const planet = pjs.planet()

      planet.loadPlugin(
        pjs.plugins.earth({
          topojson: {
            file: 'https://unpkg.com/world-atlas@1.1.4/world/110m.json',
          },
          oceans: { fill: '#1e3799' },
          land: { fill: '#2ed573' },
          borders: { stroke: '#1e3799', strokeWidth: 0.5 },
        })
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planet.loadPlugin(function (pl: any) {
        pl.onDraw(function () {
          const currentMinutes = normalizeMinutes(minutesRef.current)
          const timeDifference = currentMinutes - 720
          const degreesRotated = timeDifference * 0.25
          const solarDeclination = getSolarDeclinationDegrees(selectedDate)
          const sunLongitude = CITIES[0].lng - degreesRotated
          const viewLongitude = sunLongitude + 90
          pl.projection.rotate([-viewLongitude, -AMSTERDAM_LAT, 0])

          const [translateX, translateY] = pl.projection.translate()
          const globeRadius = pl.projection.scale()

          drawNightOverlay({
            context: pl.context,
            centerX: translateX,
            centerY: translateY,
            radius: globeRadius,
            centerLongitude: viewLongitude,
            centerLatitude: AMSTERDAM_LAT,
            sunLongitude,
            sunLatitude: solarDeclination,
          })
        })
      })

      planet.loadPlugin(pjs.plugins.pings())
      planet.loadPlugin(
        pjs.plugins.drag({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onDragStart: function (this: any) {
            this.plugins.drag.originalRotation = planet.projection.rotate()
          },
        })
      )

      planet.projection
        .scale(GLOBE_PROJECTION_SCALE)
        .translate([CLOCK_SIZE / 2, CLOCK_SIZE / 2])
      planet.draw(canvasRef.current)
      planetRef.current = planet

      pingIntervalRef.current = setInterval(() => {
        CITIES.forEach((city) => {
          planet.plugins.pings.add(city.lng, city.lat, {
            color: city.color,
            ttl: city.ttl,
            angle: city.angle,
            strokeWidth: city.strokeWidth,
          })
        })
      }, 1000)

      setGlobeReady(true)
    })

    return () => {
      cancelled = true
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (planetRef.current) planetRef.current.stop()
    }
  }, [selectedDate])

  /* ---------- Dragging Logic ---------- */

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return 0
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const x = clientX - centerX
    const y = clientY - centerY

    let deg = (Math.atan2(y, x) * 180) / Math.PI
    deg += 90
    if (deg < 0) deg += 360
    return deg
  }, [])

  const handlePointerDown = (
    e: React.PointerEvent,
    hand: 'hour' | 'minute' | 'second'
  ) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    activeHandRef.current = hand
    exactMinutesRef.current = minutesRef.current

    lastAngleRef.current = getAngle(e.clientX, e.clientY)
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeHandRef.current) return

      const currentAngle = getAngle(e.clientX, e.clientY)
      let deltaAngle = currentAngle - lastAngleRef.current

      if (deltaAngle > 180) deltaAngle -= 360
      if (deltaAngle < -180) deltaAngle += 360

      if (activeHandRef.current === 'second') {
        setSeconds((prev) => {
          let next = prev + deltaAngle / 6
          if (next >= 60) {
            exactMinutesRef.current += 1
            setMinutes(exactMinutesRef.current)
            next -= 60
          } else if (next < 0) {
            exactMinutesRef.current -= 1
            setMinutes(exactMinutesRef.current)
            next += 60
          }
          return next
        })
      } else {
        let deltaMins = 0
        if (activeHandRef.current === 'minute') deltaMins = deltaAngle / 6
        if (activeHandRef.current === 'hour') deltaMins = deltaAngle * 2

        exactMinutesRef.current += deltaMins
        setMinutes(exactMinutesRef.current)
      }

      lastAngleRef.current = currentAngle
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      activeHandRef.current = null
    }

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [isDragging, getAngle])

  /* ---------- Derived Values ---------- */

  const { h, m, ampm } = formatTime(minutes)
  const activityImage = getImageForTime(minutes, theme)
  const explorerBackdropColor = getExplorerBackdropColor(minutes, solarTimes)
  const explorerBackgroundBlend = getExplorerBackgroundBlend(
    minutes,
    solarTimes
  )

  const resolveBackgroundImage = (
    images: ThemeExplorerBackgroundImages | undefined,
    key: ExplorerBackgroundKey,
    season: Season
  ) => {
    if (!images) return null
    const img = images[key]
    if (typeof img === 'string') return img
    return img[season]
  }

  const explorerBaseBackgroundImage = resolveBackgroundImage(
    theme.explorerBackgroundImages,
    explorerBackgroundBlend.base,
    season
  )
  const explorerOverlayBackgroundImage = resolveBackgroundImage(
    theme.explorerBackgroundImages,
    explorerBackgroundBlend.overlay,
    season
  )

  const minAngle = (minutes / 60) * 360
  const hrAngle = (minutes / 720) * 360
  const secAngle = (seconds / 60) * 360

  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    const pos = lerpPoint(
      roundedRectPerimeterPoint(
        h / 12,
        CLOCK_FACE_WIDTH - CLOCK_NUMBER_INSET,
        CLOCK_FACE_HEIGHT - CLOCK_NUMBER_INSET,
        CLOCK_FACE_RADIUS - CLOCK_NUMBER_RADIUS_INSET
      ),
      { x: CX, y: CY },
      CLOCK_NUMBER_LERP
    )
    return (
      <text
        key={h}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={CLOCK_NUMBER_FONT_SIZE}
        fontWeight="bold"
        fill={theme.colors.text}
        fontFamily={theme.fonts.heading}
        style={{
          pointerEvents: 'none',
          textShadow: '0 1px 2px rgba(255,255,255,0.65)',
        }}
      >
        {h}
      </text>
    )
  })

  const handTransition = isDragging
    ? 'none'
    : 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)'

  const controlHeight = GLOBE_CANVAS_SIZE
  const digitalClockGap = 0
  const digitalClockAreaHeight = uiTokens.doubleVerticalSpace
  const digitalClockBottomInset = uiTokens.pagePaddingTop
  const controlPanelHeight =
    controlHeight + digitalClockGap + digitalClockAreaHeight
  const digitalClockTop =
    controlHeight + digitalClockGap - uiTokens.pagePaddingTop
  const digitalClockCenterY = digitalClockTop + digitalClockAreaHeight / 2
  const analogClockOffsetY = 0
  const stepperInset = uiTokens.pagePaddingX
  const explorerGap = uiTokens.singleVerticalSpace / 2

  /* ---------- Render ---------- */

  return (
    <>
      <style>{`
        .dne-btn { transition: transform 0.1s, box-shadow 0.1s; }
        .dne-btn--prev:active { transform: translate(-50%, calc(-50% + 3px)) !important; box-shadow: none !important; }
        .dne-btn--next:active { transform: translate(50%, calc(-50% + 3px)) !important; box-shadow: none !important; }
        .clock-hand { cursor: grab; }
        .clock-hand:active { cursor: grabbing; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: explorerGap,
          width: '100%',
          maxWidth: uiTokens.contentMaxWidth,
          margin: '0 auto',
        }}
      >
        {/* -------- Globe -------- */}
        <div
          style={{
            width: GLOBE_CANVAS_SIZE,
            height: GLOBE_CANVAS_SIZE,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#1e3799',
            boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px ${theme.colors.accent}`,
            position: 'relative',
            opacity: globeReady ? 1 : 0.6,
            transition: 'opacity 0.5s ease',
          }}
        >
          <canvas
            ref={canvasRef}
            width={GLOBE_CANVAS_SIZE}
            height={GLOBE_CANVAS_SIZE}
            style={{ display: 'block' }}
          />
        </div>

        <div
          data-no-drag-scroll="true"
          style={{
            width: '100%',
            maxWidth: uiTokens.contentMaxWidth,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: explorerGap,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              width: '100%',
              height: controlPanelHeight,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: CLOCK_FACE_RADIUS,
                background: theme.colors.surface,
                border: `${uiTokens.listItemBorderWidth}px solid ${theme.colors.accent}`,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                borderTopLeftRadius: CLOCK_FACE_RADIUS,
                borderTopRightRadius: CLOCK_FACE_RADIUS,
                background: explorerBackdropColor,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              {explorerBaseBackgroundImage ? (
                <img
                  src={explorerBaseBackgroundImage}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '100%',
                    height: controlHeight,
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    borderTopLeftRadius: CLOCK_FACE_RADIUS,
                    borderTopRightRadius: CLOCK_FACE_RADIUS,
                    opacity: 0.5,
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4,
                pointerEvents: 'none',
              }}
            >
              {explorerOverlayBackgroundImage ? (
                <img
                  src={explorerOverlayBackgroundImage}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '100%',
                    height: controlHeight,
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    borderTopLeftRadius: CLOCK_FACE_RADIUS,
                    borderTopRightRadius: CLOCK_FACE_RADIUS,
                    opacity: explorerBackgroundBlend.overlayOpacity * 0.5,
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              {activityImage ? (
                <img
                  src={activityImage}
                  alt="Activity"
                  style={{
                    width: ACTIVITY_IMAGE_WIDTH,
                    height: controlHeight,
                    objectFit: 'contain',
                    objectPosition: 'center center',
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            >
              <svg
                width={CLOCK_SIZE}
                height={CLOCK_SIZE}
                viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
                style={{
                  overflow: 'visible',
                  transform: `translateY(${analogClockOffsetY}px)`,
                }}
              >
                {TICK_MARKS}
                {hourNumbers}
              </svg>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: controlHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 7,
              }}
            >
              <svg
                ref={svgRef}
                width={CLOCK_SIZE}
                height={CLOCK_SIZE}
                viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
                style={{
                  touchAction: 'none',
                  overflow: 'visible',
                  transform: `translateY(${analogClockOffsetY}px)`,
                }}
              >
                <g
                  className="clock-hand"
                  onPointerDown={(e) => handlePointerDown(e, 'hour')}
                  style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${hrAngle}deg)`,
                    transition: handTransition,
                    filter: HAND_SHADOW,
                  }}
                >
                  <image
                    href={hourHandSvg}
                    x={CX}
                    y={CY - HOUR_HAND_HEIGHT}
                    width={HOUR_HAND_WIDTH}
                    height={HOUR_HAND_HEIGHT}
                    preserveAspectRatio="xMidYMid meet"
                    transform={`rotate(${HOUR_HAND_BASE_ROTATION} ${CX} ${CY})`}
                  />
                  <line
                    x1={CX}
                    y1={CY}
                    x2={CX}
                    y2={CY - HOUR_HAND_HEIGHT}
                    stroke="transparent"
                    strokeWidth={CLOCK_HAND_HIT_HOUR}
                    strokeLinecap="round"
                  />
                </g>

                <g
                  className="clock-hand"
                  onPointerDown={(e) => handlePointerDown(e, 'minute')}
                  style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${minAngle}deg)`,
                    transition: handTransition,
                    filter: HAND_SHADOW,
                  }}
                >
                  <image
                    href={minuteHandSvg}
                    x={CX}
                    y={CY - MINUTE_HAND_HEIGHT}
                    width={MINUTE_HAND_WIDTH}
                    height={MINUTE_HAND_HEIGHT}
                    preserveAspectRatio="xMidYMid meet"
                    transform={`rotate(${MINUTE_HAND_BASE_ROTATION} ${CX} ${CY})`}
                  />
                  <line
                    x1={CX}
                    y1={CY}
                    x2={CX}
                    y2={CY - MINUTE_HAND_HEIGHT}
                    stroke="transparent"
                    strokeWidth={CLOCK_HAND_HIT_MINUTE}
                    strokeLinecap="round"
                  />
                </g>

                <g
                  className="clock-hand"
                  onPointerDown={(e) => handlePointerDown(e, 'second')}
                  style={{
                    transformOrigin: `${CX}px ${CY}px`,
                    transform: `rotate(${secAngle}deg)`,
                    transition: handTransition,
                    filter: HAND_SHADOW,
                  }}
                >
                  <image
                    href={secondHandSvg}
                    x={CX}
                    y={CY - SECOND_HAND_HEIGHT}
                    width={SECOND_HAND_WIDTH}
                    height={SECOND_HAND_HEIGHT}
                    preserveAspectRatio="xMidYMid meet"
                    transform={`rotate(${SECOND_HAND_BASE_ROTATION} ${CX} ${CY})`}
                  />
                  <line
                    x1={CX}
                    y1={CY + CLOCK_SECOND_HAND_BASE_OFFSET}
                    x2={CX}
                    y2={CY - SECOND_HAND_HEIGHT}
                    stroke="transparent"
                    strokeWidth={CLOCK_HAND_HIT_SECOND}
                    strokeLinecap="round"
                  />
                </g>

                <image
                  href={pivotSvg}
                  x={CX - CLOCK_PIVOT_SIZE / 2}
                  y={CY - CLOCK_PIVOT_SIZE / 2}
                  width={CLOCK_PIVOT_SIZE}
                  height={CLOCK_PIVOT_SIZE}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none', filter: HAND_SHADOW }}
                />
              </svg>
            </div>

            <StepperButton
              theme={theme}
              direction="prev"
              onClick={() => adjust(-15)}
              ariaLabel="Subtract 15 minutes"
              className="dne-btn dne-btn--prev"
              style={{
                position: 'absolute',
                left: stepperInset,
                top: digitalClockCenterY,
                transform: 'translate(-50%, -50%)',
                zIndex: 9,
              }}
            />

            <StepperButton
              theme={theme}
              direction="next"
              onClick={() => adjust(15)}
              ariaLabel="Add 15 minutes"
              className="dne-btn dne-btn--next"
              style={{
                position: 'absolute',
                right: stepperInset,
                top: digitalClockCenterY,
                transform: 'translate(50%, -50%)',
                zIndex: 9,
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: digitalClockTop,
                height: digitalClockAreaHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: DIGITAL_CLOCK_TEXT_GAP,
                paddingBottom: digitalClockBottomInset,
                boxSizing: 'border-box',
                pointerEvents: 'none',
                zIndex: 8,
              }}
            >
              <span
                style={{
                  fontSize: DIGITAL_CLOCK_TIME_FONT_SIZE,
                  fontWeight: 700,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                  lineHeight: 1,
                }}
              >
                {h}
              </span>
              <span
                style={{
                  fontSize: DIGITAL_CLOCK_SEPARATOR_FONT_SIZE,
                  fontWeight: 700,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                  opacity: 0.55,
                  lineHeight: 1,
                }}
              >
                :
              </span>
              <span
                style={{
                  fontSize: DIGITAL_CLOCK_TIME_FONT_SIZE,
                  fontWeight: 700,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                  lineHeight: 1,
                }}
              >
                {m}
              </span>
              <span
                style={{
                  fontSize: DIGITAL_CLOCK_SEPARATOR_FONT_SIZE,
                  fontWeight: 700,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                  opacity: 0.55,
                  lineHeight: 1,
                }}
              >
                :
              </span>
              <span
                style={{
                  fontSize: DIGITAL_CLOCK_TIME_FONT_SIZE,
                  fontWeight: 700,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                  opacity: 0.88,
                  textShadow: '0 1px 2px rgba(255,255,255,0.35)',
                  lineHeight: 1,
                }}
              >
                {String(Math.floor(seconds)).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: DIGITAL_CLOCK_AMPM_FONT_SIZE,
                  fontWeight: 700,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  marginLeft: DIGITAL_CLOCK_AMPM_MARGIN,
                  textShadow: '0 1px 2px rgba(255,255,255,0.35)',
                }}
              >
                {ampm}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
