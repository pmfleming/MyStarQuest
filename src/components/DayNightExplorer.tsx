import { useState, useCallback, useEffect, useRef, type ReactElement } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'
import StepperButton from './StepperButton'

/* ------------------------------------------------------------------ */
/* Types                                                             */
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
/* Constants                                                         */
/* ------------------------------------------------------------------ */

const TOTAL_MINUTES = 1440
const NOON = 720

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

// Map our target cities with distinct, bright colors
const CITIES = [
  { name: 'Amsterdam', lat: 52.37, lng: 4.90, color: '#ff8c00', angle: 20, ttl: 3200, strokeWidth: 4 },
  { name: 'Dublin', lat: 53.35, lng: -6.26, color: '#00aaff', angle: 16, ttl: 2600, strokeWidth: 3 },
  { name: 'Taipei', lat: 25.03, lng: 121.56, color: '#ff3b30', angle: 16, ttl: 2600, strokeWidth: 3 }
]

const SCRIPTS = [
  'https://d3js.org/d3.v3.min.js',
  'https://d3js.org/topojson.v1.min.js',
  'https://unpkg.com/planetary.js@1.1.2/dist/planetaryjs.min.js',
] as const

/* ------------------------------------------------------------------ */
/* Helpers & Script Caching                                          */
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

// Helper to safely wrap continuous minutes into a 24-hour cycle (0-1439)
function normalizeMinutes(totalMinutes: number) {
  return ((totalMinutes % TOTAL_MINUTES) + TOTAL_MINUTES) % TOTAL_MINUTES
}

function formatTime(totalMinutes: number) {
  const normMins = normalizeMinutes(totalMinutes)
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

  const normMins = normalizeMinutes(minutes)
  if (normMins < 451) return activityImages.bedtime
  if (normMins <= 480) return activityImages.eatingBreakfast
  if (normMins <= 510) return activityImages.commute
  if (normMins <= 885) return activityImages.schooltime
  if (normMins <= 915) return activityImages.commute
  if (normMins <= 1080) return activityImages.playing
  if (normMins <= 1140) return activityImages.eatingDinner
  if (normMins <= 1200) return activityImages.computergames
  if (normMins <= 1260) return activityImages.bathtime
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
/* Component                                                         */
/* ------------------------------------------------------------------ */

export default function DayNightExplorer({ theme }: DayNightExplorerProps) {
  const [minutes, setMinutes] = useState(NOON)
  const [seconds, setSeconds] = useState(0)
  const [globeReady, setGlobeReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const minutesRef = useRef(minutes)
  minutesRef.current = minutes
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const planetRef = useRef<any>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const activeHandRef = useRef<'hour' | 'minute' | null>(null)
  const lastAngleRef = useRef<number>(0)
  const exactMinutesRef = useRef<number>(minutes)

  // FIX 2: We no longer modulo the continuous state! Let it grow infinitely.
  const adjust = useCallback((delta: number) => {
    setMinutes((prev) => prev + delta)
    exactMinutesRef.current += delta
  }, [])

  /* ---------- Timer Logic ---------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev >= 59) {
          setMinutes(m => m + 1) // Infinitely increment
          exactMinutesRef.current += 1
          return 0
        }
        return prev + 1
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
      const d3 = window.d3
      const planet = pjs.planet()

      planet.loadPlugin(
        pjs.plugins.earth({
          topojson: { file: 'https://unpkg.com/world-atlas@1.1.4/world/110m.json' },
          oceans: { fill: '#1e3799' },
          land: { fill: '#2ed573' },
          borders: { stroke: '#1e3799', strokeWidth: 0.5 },
        })
      )

      planet.loadPlugin(function (pl: any) {
        const nightCircle = d3.geo.circle().angle(90)

        pl.onDraw(function () {
          const currentMinutes = minutesRef.current
          const timeDifference = currentMinutes - 720
          const degreesRotated = timeDifference * 0.25
          
          // FIX 1: Normalize Longitude to [-180, 180] to prevent D3 polygon flipping
          let sunLongitude = (CITIES[0].lng - degreesRotated) % 360
          if (sunLongitude > 180) sunLongitude -= 360
          if (sunLongitude < -180) sunLongitude += 360

          const viewLongitude = sunLongitude + 90
          pl.projection.rotate([-viewLongitude, -AMSTERDAM_LAT, 0])

          let antiSolarLon = sunLongitude + 180
          if (antiSolarLon > 180) antiSolarLon -= 360
          
          nightCircle.origin([antiSolarLon, 0])

          pl.context.beginPath()
          pl.path(nightCircle())
          pl.context.fillStyle = 'rgba(0, 5, 25, 0.65)'
          pl.context.fill()
        })
      })

      planet.loadPlugin(pjs.plugins.pings())
      planet.loadPlugin(
        pjs.plugins.drag({
          onDragStart: function (this: any) {
            this.plugins.drag.originalRotation = planet.projection.rotate()
          },
        })
      )

      planet.projection.scale(108).translate([110, 110])
      planet.draw(canvasRef.current)
      planetRef.current = planet

      // FIX 3: Iterate through all 3 cities, with a larger angle (radius) for visibility
      pingIntervalRef.current = setInterval(() => {
        CITIES.forEach(city => {
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

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, hand: 'hour' | 'minute') => {
    e.preventDefault()
    setIsDragging(true)
    activeHandRef.current = hand
    exactMinutesRef.current = minutesRef.current

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    
    lastAngleRef.current = getAngle(clientX, clientY)
  }

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!activeHandRef.current) return

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      
      const currentAngle = getAngle(clientX, clientY)
      let deltaAngle = currentAngle - lastAngleRef.current

      if (deltaAngle > 180) deltaAngle -= 360
      if (deltaAngle < -180) deltaAngle += 360

      let deltaMins = 0
      if (activeHandRef.current === 'minute') {
        deltaMins = deltaAngle / 6 
      } else if (activeHandRef.current === 'hour') {
        deltaMins = deltaAngle * 2 
      }

      // FIX 2b: Do not wrap the exact minutes either. This allows continuous dragging past midnight.
      exactMinutesRef.current += deltaMins
      lastAngleRef.current = currentAngle
      setMinutes(exactMinutesRef.current)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      activeHandRef.current = null
    }

    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove, { passive: false })
      window.addEventListener('touchmove', handlePointerMove, { passive: false })
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

  // Absolute continuous rotation (No modulo here! 1 min = 6 degrees, 1 min = 0.5 degrees for hours)
  const minAngle = (minutes / 60) * 360
  const hrAngle = (minutes / 720) * 360

  const secAngle = (seconds / 60) * 360

  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    const pos = polar(64, (h / 12) * 360)
    return (
      <text
        key={h}
        x={pos.x} y={pos.y}
        textAnchor="middle" dominantBaseline="central"
        fontSize="14" fontWeight="bold" fill="#555"
        fontFamily={theme.fonts.body}
        style={{ pointerEvents: 'none' }}
      >
        {h}
      </text>
    )
  })

  const handTransition = isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'

  /* ---------- Render ---------- */

  return (
    <>
      <style>{`
        .dne-btn { transition: transform 0.1s, box-shadow 0.1s; }
        .dne-btn:active { transform: translateY(3px) !important; box-shadow: none !important; }
        .clock-hand { cursor: grab; }
        .clock-hand:active { cursor: grabbing; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: uiTokens.contentMaxWidth, margin: '0 auto' }}>
        
        {/* -------- Globe -------- */}
        <div style={{ width: GLOBE_CANVAS_SIZE, height: GLOBE_CANVAS_SIZE, borderRadius: '50%', overflow: 'hidden', background: '#1e3799', boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px ${theme.colors.accent}`, position: 'relative', opacity: globeReady ? 1 : 0.6, transition: 'opacity 0.5s ease' }}>
          <canvas ref={canvasRef} width={GLOBE_CANVAS_SIZE} height={GLOBE_CANVAS_SIZE} style={{ display: 'block' }} />
        </div>

        {/* -------- Activity & Digital clock (Split Left/Right) -------- */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 0, background: theme.colors.surface, padding: 0, borderRadius: 20, border: `3px solid ${theme.colors.accent}`, width: '100%', maxWidth: uiTokens.contentMaxWidth, height: GLOBE_CANVAS_SIZE, boxSizing: 'border-box', overflow: 'hidden' }}>
          
          {/* Left: Activity Image */}
          <div style={{ flex: 1.2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: `${theme.colors.accent}11`, borderRight: `2px solid ${theme.colors.accent}44`, overflow: 'hidden' }}>
            {activityImage ? <img src={activityImage} alt="Activity" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} /> : null}
          </div>

          {/* Right: Time Stack */}
          <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 0 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: theme.colors.text, fontFamily: theme.fonts.heading, lineHeight: 0.9 }}>{h}</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: theme.colors.text, fontFamily: theme.fonts.heading, opacity: 0.5, lineHeight: 0.5 }}>:</span>
            <span style={{ fontSize: 40, fontWeight: 700, color: theme.colors.text, fontFamily: theme.fonts.heading, lineHeight: 0.9 }}>{m}</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: theme.colors.text, fontFamily: theme.fonts.heading, opacity: 0.5, lineHeight: 0.5 }}>:</span>
            <span style={{ fontSize: 40, fontWeight: 700, color: theme.colors.text, fontFamily: theme.fonts.heading, opacity: 0.5, lineHeight: 0.9 }}>{String(seconds).padStart(2, '0')}</span>
            <span style={{ fontSize: 24, fontWeight: 600, color: theme.colors.accent, fontFamily: theme.fonts.body, marginTop: 4 }}>{ampm}</span>
          </div>
        </div>

        {/* -------- Analogue clock with Steppers -------- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: uiTokens.controlRowWidth, gap: 8 }}>
          <StepperButton theme={theme} direction="prev" onClick={() => adjust(-15)} ariaLabel="Subtract 15 minutes" />

          <svg ref={svgRef} width="200" height="200" viewBox="0 0 200 200" style={{ touchAction: 'none' }}>
            <circle cx={CX} cy={CY} r={CLOCK_R + 3} fill="white" stroke={theme.colors.accent} strokeWidth={5} />
            {TICK_MARKS}
            {hourNumbers}

            <g className="clock-hand" onMouseDown={(e) => handlePointerDown(e, 'hour')} onTouchStart={(e) => handlePointerDown(e, 'hour')} style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${hrAngle}deg)`, transition: handTransition }}>
              <line x1={CX} y1={CY} x2={CX} y2={CY - 45} stroke={HOUR_COLOR} strokeWidth={7} strokeLinecap="round" />
              <line x1={CX} y1={CY} x2={CX} y2={CY - 45} stroke="transparent" strokeWidth={25} strokeLinecap="round" />
            </g>

            <g className="clock-hand" onMouseDown={(e) => handlePointerDown(e, 'minute')} onTouchStart={(e) => handlePointerDown(e, 'minute')} style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${minAngle}deg)`, transition: handTransition }}>
              <line x1={CX} y1={CY} x2={CX} y2={CY - 70} stroke={MINUTE_COLOR} strokeWidth={4} strokeLinecap="round" />
              <line x1={CX} y1={CY} x2={CX} y2={CY - 70} stroke="transparent" strokeWidth={20} strokeLinecap="round" />
            </g>

            <g style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${secAngle}deg)` }}>
              <line x1={CX} y1={CY + 12} x2={CX} y2={CY - 78} stroke={SECOND_COLOR} strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={CX} cy={CY - 78} r={3} fill={SECOND_COLOR} />
            </g>

            <circle cx={CX} cy={CY} r={5} fill="#333" style={{ pointerEvents: 'none' }} />
          </svg>

          <StepperButton theme={theme} direction="next" onClick={() => adjust(15)} ariaLabel="Add 15 minutes" />
        </div>
      </div>
    </>
  )
}