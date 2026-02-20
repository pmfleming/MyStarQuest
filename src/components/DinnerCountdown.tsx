import { useState, useEffect, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './StepperButton'
import EditableStarDisplay from './EditableStarDisplay'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SLICE_COLORS = [
  '#ff9ff3',
  '#feca57',
  '#ff6b6b',
  '#48dbfb',
  '#1dd1a1',
  '#ff9f43',
  '#54a0ff',
  '#00d2d3',
]

const MIN_DURATION = 5 * 60 // 5 minutes
const MAX_DURATION = 30 * 60 // 30 minutes
const MIN_BITES = 1
const MAX_BITES = 16
const TIME_STEP = 5 * 60 // ±5 minutes

/* ------------------------------------------------------------------ */
/*  SVG geometry helpers  (same maths as design prototype)             */
/* ------------------------------------------------------------------ */

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** Half-circle wedge representing remaining time proportion against the fixed 30-min max. */
function wedgePath(remaining: number): string {
  const pct = Math.max(0, Math.min(1, remaining / MAX_DURATION))
  if (pct <= 0) return 'M 100 100 L 20 100 Z'
  if (pct >= 1) return 'M 100 100 L 20 100 A 80 80 0 0 1 180 100 Z'
  const a = pct * Math.PI
  return `M 100 100 L 20 100 A 80 80 0 0 1 ${100 - 80 * Math.cos(a)} ${100 - 80 * Math.sin(a)} Z`
}

/** Pie-slice path for one bite on the plate. */
function slicePath(i: number, n: number, c: number, r: number): string {
  if (n === 1) {
    return (
      `M ${c} ${c - r} ` +
      `A ${r} ${r} 0 1 1 ${c} ${c + r} ` +
      `A ${r} ${r} 0 1 1 ${c} ${c - r} Z`
    )
  }
  const sa = (i / n) * 360
  const ea = ((i + 1) / n) * 360
  const s = polar(c, c, r, ea)
  const e = polar(c, c, r, sa)
  const lg = ea - sa <= 180 ? '0' : '1'
  return `M ${c} ${c} L ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 0 ${e.x} ${e.y} Z`
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface DinnerCountdownProps {
  theme: Theme
  duration: number
  remaining: number
  totalBites: number
  bitesLeft: number
  starReward: number
  isTimerRunning: boolean
  /** Optional plate background image URL (themed) */
  plateImage?: string
  onAdjustTime: (delta: number) => void
  onAdjustBites: (delta: number) => void
  onStarsChange: (value: number) => void
  /** Optional image to show when all bites are eaten (themed) */
  completionImage?: string
}

const DinnerCountdown = ({
  theme,
  duration,
  remaining,
  totalBites,
  bitesLeft,
  starReward,
  isTimerRunning,
  plateImage,
  onAdjustTime,
  onAdjustBites,
  onStarsChange,
  completionImage,
}: DinnerCountdownProps) => {
  /* --- derived game phase --- */
  const isSuccess = bitesLeft <= 0
  const isTimeout = remaining <= 0 && bitesLeft > 0
  const isFinished = isSuccess || isTimeout
  const isSetup = !isTimerRunning && !isFinished

  /* --- bite animation tracking --- */
  const [animSlice, setAnimSlice] = useState<number | null>(null)
  const [biteVis, setBiteVis] = useState(false)
  const prevBites = useRef(bitesLeft)

  useEffect(() => {
    if (bitesLeft < prevBites.current) {
      setAnimSlice(bitesLeft)
      setBiteVis(false)
      const t1 = setTimeout(() => setBiteVis(true), 20)
      const t2 = setTimeout(() => setAnimSlice(null), 800)
      prevBites.current = bitesLeft
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    prevBites.current = bitesLeft
  }, [bitesLeft])

  /* --- second hand (mechanical tick every 2 s) --- */
  const secRot = (() => {
    if (!isTimerRunning || remaining <= 0) return 0
    let s = remaining % 60
    if (s === 0) s = 60
    return ((Math.ceil(s / 2) * 2) / 60) * 180
  })()

  /* --- clock minute markers: fixed at 5/10/15/20/25 against 30-min max --- */
  const maxMins = MAX_DURATION / 60 // always 30
  const MARKER_VALUES = [5, 10, 15, 20, 25]
  const markers = MARKER_VALUES.map((val) => {
    const f = val / maxMins
    const a = f * Math.PI
    return {
      x1: 100 - 72 * Math.cos(a),
      y1: 100 - 72 * Math.sin(a),
      x2: 100 - 80 * Math.cos(a),
      y2: 100 - 80 * Math.sin(a),
    }
  })

  const bg = theme.colors.surface

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {isSuccess && completionImage ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <img
            src={completionImage}
            alt="All done!"
            style={{
              maxWidth: '240px',
              maxHeight: '280px',
              objectFit: 'contain',
            }}
          />
        </div>
      ) : (
        <>
          {/* ---- CLOCK ROW ---- */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                opacity: isSetup ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
              }}
            >
              <StepperButton
                theme={theme}
                direction="prev"
                onClick={() => onAdjustTime(-TIME_STEP)}
                disabled={!isSetup || duration <= MIN_DURATION}
                ariaLabel="Decrease timer by 5 minutes"
              />
            </div>

            <svg
              width="220"
              height="120"
              viewBox="0 0 200 120"
              style={{ margin: '0 6px' }}
            >
              {/* Full semicircle background (white) */}
              <path
                d="M 100 100 L 20 100 A 80 80 0 0 1 180 100 Z"
                fill="#ffffff"
              />
              {/* Outline arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="4"
              />

              {/* Remaining-time wedge (theme primary) */}
              <path
                d={wedgePath(remaining)}
                fill={theme.colors.primary}
                style={{ transition: 'd 1s linear' }}
              />

              {/* Minute markers */}
              {markers.map((m, i) => (
                <line
                  key={i}
                  x1={m.x1}
                  y1={m.y1}
                  x2={m.x2}
                  y2={m.y2}
                  stroke="#bbb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}

              {/* Second hand + center dot (visible only while running) */}
              {isTimerRunning && (
                <>
                  <line
                    x1="100"
                    y1="100"
                    x2="25"
                    y2="100"
                    stroke={theme.colors.secondary}
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      transformOrigin: '100px 100px',
                      transform: `rotate(${secRot}deg)`,
                      transition:
                        'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
                    }}
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="6"
                    fill={theme.colors.secondary}
                  />
                </>
              )}
            </svg>

            <div
              style={{
                opacity: isSetup ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
              }}
            >
              <StepperButton
                theme={theme}
                direction="next"
                onClick={() => onAdjustTime(TIME_STEP)}
                disabled={!isSetup || duration >= MAX_DURATION}
                ariaLabel="Increase timer by 5 minutes"
              />
            </div>
          </div>

          {/* ---- PLATE ROW ---- */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                opacity: isSetup ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
              }}
            >
              <StepperButton
                theme={theme}
                direction="prev"
                onClick={() => onAdjustBites(-1)}
                disabled={!isSetup || totalBites <= MIN_BITES}
                ariaLabel="Decrease bites"
              />
            </div>

            <svg
              width="200"
              height="200"
              viewBox="0 0 220 220"
              style={{ margin: '0 6px', overflow: 'visible' }}
            >
              {/* Per-slice clip paths (used when a plate image is provided) */}
              {plateImage && (
                <defs>
                  {Array.from({ length: totalBites }, (_, i) => (
                    <clipPath key={i} id={`slice-clip-${i}`}>
                      <path d={slicePath(i, totalBites, 110, 100)} />
                    </clipPath>
                  ))}
                </defs>
              )}

              {Array.from({ length: totalBites }, (_, i) => {
                const gone = i >= bitesLeft && i !== animSlice
                const biting = i === animSlice

                return (
                  <g
                    key={i}
                    style={{
                      transition:
                        'transform 0.4s ease-in, opacity 0.4s ease-in',
                      transformOrigin: '110px 110px',
                      transform: gone || biting ? 'scale(0.7)' : 'scale(1)',
                      opacity: gone ? 0 : biting ? 0.3 : 1,
                    }}
                  >
                    {plateImage ? (
                      /* Plate image clipped to this pie segment */
                      <>
                        <image
                          href={plateImage}
                          x="10"
                          y="10"
                          width="200"
                          height="200"
                          clipPath={`url(#slice-clip-${i})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                        {/* Divider line between segments */}
                        <path
                          d={slicePath(i, totalBites, 110, 100)}
                          fill="none"
                          stroke={theme.colors.primary}
                          strokeWidth="4"
                        />
                      </>
                    ) : (
                      /* Fallback: solid-colour slice */
                      <path
                        d={slicePath(i, totalBites, 110, 100)}
                        fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                        stroke={bg}
                        strokeWidth="4"
                      />
                    )}

                    {/* Bite-mark circles (3 crescents that pop in) */}
                    {biting &&
                      (() => {
                        const ang = ((i + 0.5) / totalBites) * 360
                        return [-15, 0, 15].map((off, j) => {
                          const c = polar(110, 110, 95, ang + off)
                          return (
                            <circle
                              key={j}
                              cx={c.x}
                              cy={c.y}
                              r={j === 1 ? 32 : 25}
                              fill={bg}
                              style={{
                                transformOrigin: `${c.x}px ${c.y}px`,
                                transform: biteVis ? 'scale(1)' : 'scale(0)',
                                transition: `transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275) ${j * 0.1}s`,
                              }}
                            />
                          )
                        })
                      })()}
                  </g>
                )
              })}
            </svg>

            <div
              style={{
                opacity: isSetup ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
              }}
            >
              <StepperButton
                theme={theme}
                direction="next"
                onClick={() => onAdjustBites(1)}
                disabled={!isSetup || totalBites >= MAX_BITES}
                ariaLabel="Increase bites"
              />
            </div>
          </div>

          {/* ---- STAR REWARD (editable, setup only) ---- */}
          {isSetup && (
            <EditableStarDisplay
              theme={theme}
              count={starReward}
              editable
              onChange={(value) => onStarsChange(value)}
              min={1}
              max={3}
            />
          )}
        </>
      )}
    </div>
  )
}

export default DinnerCountdown
