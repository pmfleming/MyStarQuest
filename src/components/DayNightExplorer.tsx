import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'
import StepperButton from './StepperButton'

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

/* Clock geometry */
const CX = 100
const CY = 100
const CLOCK_R = 92

/* Hand colors */
const HOUR_COLOR = '#54a0ff'
const MINUTE_COLOR = '#1dd1a1'
const SECOND_COLOR = '#ff4757'

/* Globe & Cities */
const GLOBE_CANVAS_SIZE = 220
const AMSTERDAM_LAT = 52.37

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

function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

const TICK_MARKS: ReactElement[] = []
for (let i = 0; i < 60; i++) {
  const isHour = i % 5 === 0
  const angle = (i / 60) * 360
  const inner = polar(isHour ? 76 : 84, angle)
  const outer = polar(CLOCK_R, angle)
  TICK_MARKS.push(
    <line
      key={i}
      x1={inner.x}
      y1={inner.y}
      x2={outer.x}
      y2={outer.y}
      stroke={isHour ? '#333' : '#ccc'}
      strokeWidth={isHour ? 3 : 1.5}
      strokeLinecap="round"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function DayNightExplorer({ theme }: DayNightExplorerProps) {
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
          const sunLongitude = CITIES[0].lng - degreesRotated
          const viewLongitude = sunLongitude + 90
          pl.projection.rotate([-viewLongitude, -AMSTERDAM_LAT, 0])

          const [translateX, translateY] = pl.projection.translate()
          const globeRadius = pl.projection.scale()

          pl.context.save()
          pl.context.beginPath()
          pl.context.arc(
            translateX,
            translateY,
            globeRadius,
            -Math.PI / 2,
            Math.PI / 2
          )
          pl.context.closePath()

          const nightGradient = pl.context.createLinearGradient(
            translateX,
            translateY,
            translateX + globeRadius,
            translateY
          )

          // INCREASED OPACITY: Makes the shadow much darker and more defined
          //nightGradient.addColorStop(0, 'rgba(0, 5, 25, 0)')
          //nightGradient.addColorStop(0.1, 'rgba(0, 5, 25, 0.4)')
          //nightGradient.addColorStop(0.3, 'rgba(0, 5, 25, 0.75)')
          //nightGradient.addColorStop(0.6, 'rgba(0, 5, 25, 0.9)')
          //nightGradient.addColorStop(1, 'rgba(0, 5, 25, 0.95)')

          // NEW EXTREME DARKNESS VALUES
          nightGradient.addColorStop(0, 'rgba(0, 5, 25, 0)') // Edge of the light
          nightGradient.addColorStop(0.05, 'rgba(0, 5, 25, 0.5)') // Gets dark super fast
          nightGradient.addColorStop(0.15, 'rgba(0, 5, 25, 0.75)') // Almost solid at 15% in
          nightGradient.addColorStop(0.5, 'rgba(0, 5, 25, 0.9)') // Pitch black halfway across
          nightGradient.addColorStop(1, 'rgba(0, 5, 25, 1)') // 100% solid at the right edge

          pl.context.fillStyle = nightGradient
          pl.context.fill()
          pl.context.restore()
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

      planet.projection.scale(108).translate([110, 110])
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
  }, [])

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
    e: React.MouseEvent | React.TouchEvent,
    hand: 'hour' | 'minute' | 'second'
  ) => {
    e.preventDefault()
    setIsDragging(true)
    activeHandRef.current = hand
    exactMinutesRef.current = minutesRef.current

    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY =
      'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    lastAngleRef.current = getAngle(clientX, clientY)
  }

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!activeHandRef.current) return

      const clientX =
        'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY =
        'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

      const currentAngle = getAngle(clientX, clientY)
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
      window.addEventListener('mousemove', handlePointerMove, {
        passive: false,
      })
      window.addEventListener('touchmove', handlePointerMove, {
        passive: false,
      })
      window.addEventListener('mouseup', handlePointerUp)
      window.addEventListener('touchend', handlePointerUp)
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [isDragging, getAngle])

  /* ---------- Derived Values ---------- */

  const { h, m, ampm } = formatTime(minutes)
  const activityImage = getImageForTime(minutes, theme)

  const minAngle = (minutes / 60) * 360
  const hrAngle = (minutes / 720) * 360
  const secAngle = (seconds / 60) * 360

  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    const pos = polar(64, (h / 12) * 360)
    return (
      <text
        key={h}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
        fill="#555"
        fontFamily={theme.fonts.body}
        style={{ pointerEvents: 'none' }}
      >
        {h}
      </text>
    )
  })

  const handTransition = isDragging
    ? 'none'
    : 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)'

  /* ---------- Render ---------- */

  return (
    <>
      <style>{`
        .dne-btn { transition: transform 0.1s, box-shadow 0.1s; }
        .dne-btn:active { transform: translateY(3px) !important; box-shadow: none !important; }
        .clock-hand { cursor: grab; }
        .clock-hand:active { cursor: grabbing; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
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

        {/* -------- Activity & Digital clock (Split Left/Right) -------- */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0,
            background: theme.colors.surface,
            padding: 0,
            borderRadius: 20,
            border: `3px solid ${theme.colors.accent}`,
            width: '100%',
            maxWidth: uiTokens.contentMaxWidth,
            height: GLOBE_CANVAS_SIZE,
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Left: Activity Image */}
          <div
            style={{
              flex: 1.2,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              background: `${theme.colors.accent}11`,
              borderRight: `2px solid ${theme.colors.accent}44`,
              overflow: 'hidden',
            }}
          >
            {activityImage ? (
              <img
                src={activityImage}
                alt="Activity"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                }}
              />
            ) : null}
          </div>

          {/* Right: Time Stack (REVERTED TO VERTICAL) */}
          <div
            style={{
              flex: 0.8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 0,
            }}
          >
            <span
              style={{
                fontSize: 36,
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
                fontSize: 18,
                fontWeight: 700,
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                opacity: 0.4,
                lineHeight: 0.5,
              }}
            >
              :
            </span>
            <span
              style={{
                fontSize: 36,
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
                fontSize: 18,
                fontWeight: 700,
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                opacity: 0.4,
                lineHeight: 0.5,
              }}
            >
              :
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                opacity: 0.6,
                lineHeight: 1,
              }}
            >
              {String(Math.floor(seconds)).padStart(2, '0')}
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: theme.colors.accent,
                fontFamily: theme.fonts.body,
                marginTop: 6,
              }}
            >
              {ampm}
            </span>
          </div>
        </div>

        {/* -------- Analogue clock with Steppers -------- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: uiTokens.controlRowWidth,
            gap: 8,
          }}
        >
          <StepperButton
            theme={theme}
            direction="prev"
            onClick={() => adjust(-15)}
            ariaLabel="Subtract 15 minutes"
          />

          <svg
            ref={svgRef}
            width="200"
            height="200"
            viewBox="0 0 200 200"
            style={{ touchAction: 'none' }}
          >
            <circle
              cx={CX}
              cy={CY}
              r={CLOCK_R + 3}
              fill="white"
              stroke={theme.colors.accent}
              strokeWidth={5}
            />
            {TICK_MARKS}
            {hourNumbers}

            <g
              className="clock-hand"
              onMouseDown={(e) => handlePointerDown(e, 'hour')}
              onTouchStart={(e) => handlePointerDown(e, 'hour')}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${hrAngle}deg)`,
                transition: handTransition,
              }}
            >
              <line
                x1={CX}
                y1={CY}
                x2={CX}
                y2={CY - 45}
                stroke={HOUR_COLOR}
                strokeWidth={7}
                strokeLinecap="round"
              />
              <line
                x1={CX}
                y1={CY}
                x2={CX}
                y2={CY - 45}
                stroke="transparent"
                strokeWidth={25}
                strokeLinecap="round"
              />
            </g>

            <g
              className="clock-hand"
              onMouseDown={(e) => handlePointerDown(e, 'minute')}
              onTouchStart={(e) => handlePointerDown(e, 'minute')}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${minAngle}deg)`,
                transition: handTransition,
              }}
            >
              <line
                x1={CX}
                y1={CY}
                x2={CX}
                y2={CY - 70}
                stroke={MINUTE_COLOR}
                strokeWidth={4}
                strokeLinecap="round"
              />
              <line
                x1={CX}
                y1={CY}
                x2={CX}
                y2={CY - 70}
                stroke="transparent"
                strokeWidth={20}
                strokeLinecap="round"
              />
            </g>

            <g
              className="clock-hand"
              onMouseDown={(e) => handlePointerDown(e, 'second')}
              onTouchStart={(e) => handlePointerDown(e, 'second')}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: `rotate(${secAngle}deg)`,
                transition: handTransition,
              }}
            >
              <line
                x1={CX}
                y1={CY + 12}
                x2={CX}
                y2={CY - 78}
                stroke={SECOND_COLOR}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <circle cx={CX} cy={CY - 78} r={3} fill={SECOND_COLOR} />
              <line
                x1={CX}
                y1={CY + 12}
                x2={CX}
                y2={CY - 78}
                stroke="transparent"
                strokeWidth={15}
                strokeLinecap="round"
              />
            </g>

            <circle
              cx={CX}
              cy={CY}
              r={5}
              fill="#333"
              style={{ pointerEvents: 'none' }}
            />
          </svg>

          <StepperButton
            theme={theme}
            direction="next"
            onClick={() => adjust(15)}
            ariaLabel="Add 15 minutes"
          />
        </div>
      </div>
    </>
  )
}
