import { useState, useEffect, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './StepperButton'
import StarDisplay from './StarDisplay'
import ChoreOutcomeView from './ChoreOutcomeView'
import { uiTokens } from '../ui/tokens'
import { BITE_COOLDOWN_SECONDS } from '../data/types'

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
const STEPPER_WIDTH = 46
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const PLATE_CENTER = 110
const BASE_VIEWBOX_SIZE = 220
const CONTROL_SVG_SIZE = 200
const CONTROL_SVG_SCALE = CONTROL_SVG_SIZE / BASE_VIEWBOX_SIZE
const PLATE_RADIUS = (CONTROL_ROW_WIDTH / 2 - STEPPER_WIDTH / 2) / (200 / 220)
const PLATE_IMAGE_SIZE = PLATE_RADIUS * 2
const PLATE_IMAGE_OFFSET = PLATE_CENTER - PLATE_RADIUS
const PLATE_VERTICAL_OVERFLOW = Math.max(
  0,
  (PLATE_RADIUS - PLATE_CENTER) * CONTROL_SVG_SCALE
)
const CLOCK_CENTER_X = PLATE_CENTER
const CLOCK_CENTER_Y = 110
const CLOCK_RADIUS = PLATE_RADIUS
const CLOCK_MARKER_INNER_RADIUS = CLOCK_RADIUS - 8
const CLOCK_SECOND_HAND_LENGTH = CLOCK_RADIUS * 0.9375
const CLOCK_VIEWBOX_Y = CLOCK_CENTER_Y - CLOCK_RADIUS
const CLOCK_VIEWBOX_HEIGHT = CLOCK_CENTER_Y - CLOCK_VIEWBOX_Y
const CLOCK_SVG_HEIGHT = CLOCK_VIEWBOX_HEIGHT * CONTROL_SVG_SCALE

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
  const leftX = CLOCK_CENTER_X - CLOCK_RADIUS
  const baseY = CLOCK_CENTER_Y

  if (pct <= 0) return `M ${CLOCK_CENTER_X} ${baseY} L ${leftX} ${baseY} Z`
  if (pct >= 1) {
    const rightX = CLOCK_CENTER_X + CLOCK_RADIUS
    return `M ${CLOCK_CENTER_X} ${baseY} L ${leftX} ${baseY} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 0 1 ${rightX} ${baseY} Z`
  }

  const a = pct * Math.PI
  return `M ${CLOCK_CENTER_X} ${baseY} L ${leftX} ${baseY} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 0 1 ${CLOCK_CENTER_X - CLOCK_RADIUS * Math.cos(a)} ${CLOCK_CENTER_Y - CLOCK_RADIUS * Math.sin(a)} Z`
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
  /** Explicit completion flag used to control when success is shown */
  isCompleted?: boolean
  /** Optional image to show when time runs out (themed) */
  failureImage?: string
  /** Remaining cooldown seconds between bites (0 = ready) */
  biteCooldownSeconds?: number
  /** Absolute timestamp when the current bite cooldown ends */
  biteCooldownEndsAt?: number | null
  /** Absolute timestamp when the main timer was started */
  timerStartedAt?: number | null
  /** Icon shown during bite cooldown (themed) */
  biteIcon?: string
  /** Optional test hook to cycle cooldown icon while visible */
  onBiteIconClick?: () => void
  /** Hide the +/- setup controls around the timer and plate */
  showSetupControls?: boolean
  /** Hide the editable star reward block */
  showStarReward?: boolean
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
  isCompleted = false,
  failureImage,
  biteCooldownSeconds = 0,
  biteCooldownEndsAt,
  timerStartedAt,
  biteIcon,
  onBiteIconClick,
  showSetupControls = true,
  showStarReward = true,
}: DinnerCountdownProps) => {
  /* --- local visual tick for smooth animations --- */
  const [, setTick] = useState(0)
  const now = Date.now()

  useEffect(() => {
    // Only tick if the timer is running or a cooldown is active
    const needsTick =
      isTimerRunning || (biteCooldownEndsAt && biteCooldownEndsAt > Date.now())
    if (!needsTick) return

    const interval = window.setInterval(() => setTick((t) => t + 1), 100)
    return () => window.clearInterval(interval)
  }, [isTimerRunning, biteCooldownEndsAt])

  /* --- live display values --- */
  // remaining is the "frozen" seconds from the last sync; we subtract elapsed ms
  const liveRemainingFloat =
    isTimerRunning && timerStartedAt
      ? Math.max(0, remaining - (now - timerStartedAt) / 1000)
      : remaining
  const liveRemaining = Math.floor(liveRemainingFloat)

  const liveCooldown = biteCooldownEndsAt
    ? Math.max(0, (biteCooldownEndsAt - now) / 1000)
    : 0
  const totalCooldownSeconds = biteCooldownSeconds || BITE_COOLDOWN_SECONDS

  /* --- derived game phase --- */
  const isCoolingDown = liveCooldown > 0
  const isSuccess = isCompleted && bitesLeft <= 0 && !isCoolingDown
  const isTimeout = liveRemaining <= 0 && bitesLeft > 0
  const isFinished = isSuccess || isTimeout
  const isSetup = !isTimerRunning && !isFinished && !isCoolingDown
  const showSideControls = showSetupControls && !isFinished

  /* --- bite animation tracking --- */
  const [animSlice, setAnimSlice] = useState<number | null>(null)
  const [biteVis, setBiteVis] = useState(false)
  const prevBites = useRef(bitesLeft)

  /* --- clock display mode: 'minsec' = m:ss, 'seconds' = total seconds --- */
  const [clockDisplayMode, setClockDisplayMode] = useState<
    'minsec' | 'seconds'
  >('minsec')

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
    if (!isTimerRunning || liveRemaining <= 0) return 0
    let s = liveRemaining % 60
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
      x1: CLOCK_CENTER_X - CLOCK_MARKER_INNER_RADIUS * Math.cos(a),
      y1: CLOCK_CENTER_Y - CLOCK_MARKER_INNER_RADIUS * Math.sin(a),
      x2: CLOCK_CENTER_X - CLOCK_RADIUS * Math.cos(a),
      y2: CLOCK_CENTER_Y - CLOCK_RADIUS * Math.sin(a),
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
        gap: `${uiTokens.singleVerticalSpace}px`,
      }}
    >
      {isSuccess ? (
        <ChoreOutcomeView imageSrc={completionImage} outcome="success" />
      ) : isTimeout ? (
        <ChoreOutcomeView
          imageSrc={failureImage}
          outcome="failure"
          failureAlt="Time's up!"
        />
      ) : (
        <>
          {/* ---- CLOCK ROW ---- */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${CONTROL_ROW_WIDTH}px`,
              maxWidth: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                opacity: showSideControls ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
                position: 'relative',
                zIndex: 3,
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
              width="200"
              height={CLOCK_SVG_HEIGHT}
              viewBox={`0 ${CLOCK_VIEWBOX_Y} 220 ${CLOCK_VIEWBOX_HEIGHT}`}
              style={{
                margin: '0 6px',
                overflow: 'visible',
              }}
            >
              {/* Full semicircle background (white) */}
              <path
                d={`M ${CLOCK_CENTER_X} ${CLOCK_CENTER_Y} L ${CLOCK_CENTER_X - CLOCK_RADIUS} ${CLOCK_CENTER_Y} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 0 1 ${CLOCK_CENTER_X + CLOCK_RADIUS} ${CLOCK_CENTER_Y} Z`}
                fill="#ffffff"
              />
              {/* Outline arc */}
              <path
                d={`M ${CLOCK_CENTER_X - CLOCK_RADIUS} ${CLOCK_CENTER_Y} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 0 1 ${CLOCK_CENTER_X + CLOCK_RADIUS} ${CLOCK_CENTER_Y}`}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="4"
              />

              {/* Remaining-time wedge (theme primary) */}
              <path
                d={wedgePath(liveRemainingFloat)}
                fill={theme.colors.primary}
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
                    x1={CLOCK_CENTER_X}
                    y1={CLOCK_CENTER_Y}
                    x2={CLOCK_CENTER_X - CLOCK_SECOND_HAND_LENGTH}
                    y2={CLOCK_CENTER_Y}
                    stroke={theme.colors.secondary}
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      transformOrigin: `${CLOCK_CENTER_X}px ${CLOCK_CENTER_Y}px`,
                      transform: `rotate(${secRot}deg)`,
                      transition:
                        'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
                    }}
                  />
                  <circle
                    cx={CLOCK_CENTER_X}
                    cy={CLOCK_CENTER_Y}
                    r="6"
                    fill={theme.colors.secondary}
                  />
                </>
              )}

              {/* Remaining-seconds display box (bottom-aligned to semicircle baseline) */}
              {(() => {
                const displaySeconds = isTimerRunning ? liveRemaining : duration
                const mins = Math.floor(displaySeconds / 60)
                const secs = displaySeconds % 60
                const label =
                  clockDisplayMode === 'minsec'
                    ? `${mins}:${secs.toString().padStart(2, '0')}`
                    : `${displaySeconds}`
                const boxW = 120
                const boxH = 54
                const boxX = CLOCK_CENTER_X - boxW / 2
                const boxY = CLOCK_CENTER_Y - 4 - boxH
                return (
                  <g
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                      setClockDisplayMode((mode) =>
                        mode === 'minsec' ? 'seconds' : 'minsec'
                      )
                    }
                  >
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      rx={10}
                      ry={10}
                      fill="rgba(255,255,255,0.85)"
                      stroke={theme.colors.primary}
                      strokeWidth="2"
                    />
                    <text
                      x={CLOCK_CENTER_X}
                      y={CLOCK_CENTER_Y - 17}
                      textAnchor="middle"
                      fill={theme.colors.primary}
                      fontFamily={theme.fonts.heading}
                      fontWeight="bold"
                      fontSize="36"
                    >
                      {label}
                    </text>
                  </g>
                )
              })()}
            </svg>

            <div
              style={{
                opacity: showSideControls ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
                position: 'relative',
                zIndex: 3,
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
              width: `${CONTROL_ROW_WIDTH}px`,
              maxWidth: '100%',
              marginTop: `${PLATE_VERTICAL_OVERFLOW}px`,
              marginBottom: `${PLATE_VERTICAL_OVERFLOW}px`,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                opacity: showSideControls ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
                position: 'relative',
                zIndex: 3,
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

            <div style={{ position: 'relative', margin: '0 6px' }}>
              <svg
                width="200"
                height="200"
                viewBox="0 0 220 220"
                style={{
                  overflow: 'visible',
                  display: 'block',
                }}
              >
                {/* Per-slice clip paths (used when a plate image is provided) */}
                {plateImage && (
                  <defs>
                    {Array.from({ length: totalBites }, (_, i) => (
                      <clipPath key={i} id={`slice-clip-${i}`}>
                        <path
                          d={slicePath(
                            i,
                            totalBites,
                            PLATE_CENTER,
                            PLATE_RADIUS
                          )}
                        />
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
                            x={PLATE_IMAGE_OFFSET}
                            y={PLATE_IMAGE_OFFSET}
                            width={PLATE_IMAGE_SIZE}
                            height={PLATE_IMAGE_SIZE}
                            clipPath={`url(#slice-clip-${i})`}
                            preserveAspectRatio="xMidYMid slice"
                          />
                          {/* Divider line between segments */}
                          <path
                            d={slicePath(
                              i,
                              totalBites,
                              PLATE_CENTER,
                              PLATE_RADIUS
                            )}
                            fill="none"
                            stroke={theme.colors.primary}
                            strokeWidth="4"
                          />
                        </>
                      ) : (
                        /* Fallback: solid-colour slice */
                        <path
                          d={slicePath(
                            i,
                            totalBites,
                            PLATE_CENTER,
                            PLATE_RADIUS
                          )}
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
                            const c = polar(
                              PLATE_CENTER,
                              PLATE_CENTER,
                              PLATE_RADIUS - 5,
                              ang + off
                            )
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

              {/* ---- CHEWING COOLDOWN OVERLAY ---- */}
              {liveCooldown > 0 &&
                (() => {
                  const RING_R = 55
                  const CIRC = 2 * Math.PI * RING_R
                  const progress = Math.max(
                    0,
                    Math.min(1, liveCooldown / totalCooldownSeconds)
                  )
                  const offset = (1 - progress) * CIRC
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 200,
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        zIndex: 2,
                      }}
                    >
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        {/* Frosted backdrop */}
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="rgba(255,255,255,0.85)"
                        />
                        {/* Track ring */}
                        <circle
                          cx="80"
                          cy="80"
                          r={RING_R}
                          fill="none"
                          stroke="#e8e8e8"
                          strokeWidth="8"
                        />
                        {/* Countdown ring (empties clockwise) */}
                        <circle
                          cx="80"
                          cy="80"
                          r={RING_R}
                          fill="none"
                          stroke={theme.colors.secondary}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={CIRC}
                          strokeDashoffset={offset}
                          transform="rotate(-90 80 80)"
                        />
                      </svg>
                      {/* Centered bite icon */}
                      <div
                        style={{
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: biteIcon ? 'auto' : 'none',
                        }}
                      >
                        {biteIcon && (
                          <img
                            src={biteIcon}
                            alt="Chewing…"
                            className="animate-bounce"
                            onClick={onBiteIconClick}
                            style={{
                              width: 64,
                              height: 64,
                              objectFit: 'contain',
                              cursor: onBiteIconClick ? 'pointer' : 'default',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })()}
            </div>

            <div
              style={{
                opacity: showSideControls ? 1 : 0,
                pointerEvents: isSetup ? 'auto' : 'none',
                transition: 'opacity 0.3s',
                position: 'relative',
                zIndex: 3,
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
          {showStarReward && isSetup && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                width: `${CONTROL_ROW_WIDTH}px`,
                maxWidth: '100%',
              }}
            >
              <StarDisplay
                theme={theme}
                count={starReward}
                editable
                onChange={(value) => onStarsChange(value)}
                min={1}
                max={3}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DinnerCountdown
