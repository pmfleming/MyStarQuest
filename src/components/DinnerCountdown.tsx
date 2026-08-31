import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import ChoreOutcomeView from './ChoreOutcomeView'
import StepperButton from './ui/StepperButton'
import { getStepperEdgePositionStyle } from './ui/stepperLayout'
import { uiTokens } from '../tokens'
import { useDinnerCountdownState } from '../hooks/useDinnerCountdownState'
import { StarRewardControl } from './ui/ActivityControls'
import { MAX_DINNER_SLICES, MIN_DINNER_SLICES } from '../data/taskLimits'

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
const TIME_STEP = 5 * 60 // ±5 minutes
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const PLATE_CENTER = 110
const BASE_VIEWBOX_SIZE = 220
const PLATE_RADIUS = 92
const PLATE_IMAGE_SIZE = PLATE_RADIUS * 2
const PLATE_IMAGE_OFFSET = PLATE_CENTER - PLATE_RADIUS
const PLATE_VERTICAL_OVERFLOW = 0
const CLOCK_CENTER_X = PLATE_CENTER
const CLOCK_CENTER_Y = 110
const CLOCK_RADIUS = PLATE_RADIUS
const CLOCK_MARKER_INNER_RADIUS = CLOCK_RADIUS - 8
const CLOCK_SECOND_HAND_LENGTH = CLOCK_RADIUS * 0.9375
const CLOCK_VIEWBOX_Y = CLOCK_CENTER_Y - CLOCK_RADIUS
const CLOCK_VIEWBOX_HEIGHT = CLOCK_CENTER_Y - CLOCK_VIEWBOX_Y
const CLOCK_MARKER_VALUES = [5, 10, 15, 20, 25]

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

type CountdownVisualRowProps = {
  children: ReactNode
  style?: CSSProperties
}

const CountdownVisualRow = ({ children, style }: CountdownVisualRowProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${CONTROL_ROW_WIDTH}px`,
      maxWidth: '100%',
      position: 'relative',
      zIndex: 1,
      ...style,
    }}
  >
    {children}
  </div>
)

type CountdownStepperControlProps = {
  theme: Theme
  direction: 'prev' | 'next'
  onClick: () => void
  disabled: boolean
  ariaLabel: string
  visible: boolean
  isSetup: boolean
}

const CountdownStepperControl = ({
  theme,
  direction,
  onClick,
  disabled,
  ariaLabel,
  visible,
  isSetup,
}: CountdownStepperControlProps) => (
  <div
    style={{
      opacity: visible ? 1 : 0,
      pointerEvents: visible && isSetup ? 'auto' : 'none',
      transition: 'opacity 0.3s',
      ...getStepperEdgePositionStyle(direction),
    }}
    aria-hidden={!visible}
  >
    <StepperButton
      theme={theme}
      direction={direction}
      onClick={onClick}
      disabled={disabled || !visible}
      ariaLabel={ariaLabel}
    />
  </div>
)

type ClockDisplayMode = 'minsec' | 'seconds'

type CountdownClockDisplayOptions = {
  theme: Theme
  duration: number
  liveRemaining: number
  liveRemainingFloat: number
  isTimerRunning: boolean
  secRot: number
  clockDisplayMode: ClockDisplayMode
  onToggleDisplayMode: () => void
}

const renderCountdownClockDisplay = ({
  theme,
  duration,
  liveRemaining,
  liveRemainingFloat,
  isTimerRunning,
  secRot,
  clockDisplayMode,
  onToggleDisplayMode,
}: CountdownClockDisplayOptions) => {
  const maxMins = MAX_DURATION / 60
  const markers = CLOCK_MARKER_VALUES.map((val) => {
    const fraction = val / maxMins
    const angle = fraction * Math.PI
    return {
      x1: CLOCK_CENTER_X - CLOCK_MARKER_INNER_RADIUS * Math.cos(angle),
      y1: CLOCK_CENTER_Y - CLOCK_MARKER_INNER_RADIUS * Math.sin(angle),
      x2: CLOCK_CENTER_X - CLOCK_RADIUS * Math.cos(angle),
      y2: CLOCK_CENTER_Y - CLOCK_RADIUS * Math.sin(angle),
    }
  })
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
    <svg
      width={BASE_VIEWBOX_SIZE}
      height={CLOCK_VIEWBOX_HEIGHT}
      viewBox={`0 ${CLOCK_VIEWBOX_Y} 220 ${CLOCK_VIEWBOX_HEIGHT}`}
      aria-label="Dinner timer"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        overflow: 'visible',
      }}
    >
      <path
        d={`M ${CLOCK_CENTER_X} ${CLOCK_CENTER_Y} L ${CLOCK_CENTER_X - CLOCK_RADIUS} ${CLOCK_CENTER_Y} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 0 1 ${CLOCK_CENTER_X + CLOCK_RADIUS} ${CLOCK_CENTER_Y} Z`}
        fill="#ffffff"
      />
      <path
        d={`M ${CLOCK_CENTER_X - CLOCK_RADIUS} ${CLOCK_CENTER_Y} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 0 1 ${CLOCK_CENTER_X + CLOCK_RADIUS} ${CLOCK_CENTER_Y}`}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth="4"
      />
      <path d={wedgePath(liveRemainingFloat)} fill={theme.colors.primary} />

      {markers.map((marker, index) => (
        <line
          key={index}
          x1={marker.x1}
          y1={marker.y1}
          x2={marker.x2}
          y2={marker.y2}
          stroke="#bbb"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}

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
              transition: 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)',
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

      <g style={{ cursor: 'pointer' }} onClick={onToggleDisplayMode}>
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
    </svg>
  )
}

type CountdownPlateDisplayOptions = {
  theme: Theme
  plateImage?: string
  totalBites: number
  bitesLeft: number
  animSlice: number | null
  biteVis: boolean
  background: string
  liveCooldown: number
  totalCooldownSeconds: number
  biteIcon?: string
  onBiteIconClick?: () => void
}

const renderCountdownPlateDisplay = ({
  theme,
  plateImage,
  totalBites,
  bitesLeft,
  animSlice,
  biteVis,
  background,
  liveCooldown,
  totalCooldownSeconds,
  biteIcon,
  onBiteIconClick,
}: CountdownPlateDisplayOptions) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <svg
      width={BASE_VIEWBOX_SIZE}
      height={BASE_VIEWBOX_SIZE}
      viewBox="0 0 220 220"
      aria-label="Dinner plate portions"
      style={{
        width: '100%',
        height: 'auto',
        overflow: 'visible',
        display: 'block',
      }}
    >
      {plateImage && (
        <defs>
          {Array.from({ length: totalBites }, (_, index) => (
            <clipPath key={index} id={`slice-clip-${index}`}>
              <path
                d={slicePath(index, totalBites, PLATE_CENTER, PLATE_RADIUS)}
              />
            </clipPath>
          ))}
        </defs>
      )}

      {Array.from({ length: totalBites }, (_, index) => {
        const gone = index >= bitesLeft && index !== animSlice
        const biting = index === animSlice

        return (
          <g
            key={index}
            style={{
              transition: 'transform 0.4s ease-in, opacity 0.4s ease-in',
              transformOrigin: '110px 110px',
              transform: gone || biting ? 'scale(0.7)' : 'scale(1)',
              opacity: gone ? 0 : biting ? 0.3 : 1,
            }}
          >
            {plateImage ? (
              <>
                <image
                  href={plateImage}
                  x={PLATE_IMAGE_OFFSET}
                  y={PLATE_IMAGE_OFFSET}
                  width={PLATE_IMAGE_SIZE}
                  height={PLATE_IMAGE_SIZE}
                  clipPath={`url(#slice-clip-${index})`}
                  preserveAspectRatio="xMidYMid slice"
                />
                <path
                  d={slicePath(index, totalBites, PLATE_CENTER, PLATE_RADIUS)}
                  fill="none"
                  stroke={theme.colors.primary}
                  strokeWidth="4"
                />
              </>
            ) : (
              <path
                d={slicePath(index, totalBites, PLATE_CENTER, PLATE_RADIUS)}
                fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                stroke={background}
                strokeWidth="4"
              />
            )}

            {biting &&
              (() => {
                const angle = ((index + 0.5) / totalBites) * 360
                return [-15, 0, 15].map((offset, biteIndex) => {
                  const center = polar(
                    PLATE_CENTER,
                    PLATE_CENTER,
                    PLATE_RADIUS - 5,
                    angle + offset
                  )
                  return (
                    <circle
                      key={biteIndex}
                      cx={center.x}
                      cy={center.y}
                      r={biteIndex === 1 ? 32 : 25}
                      fill={background}
                      style={{
                        transformOrigin: `${center.x}px ${center.y}px`,
                        transform: biteVis ? 'scale(1)' : 'scale(0)',
                        transition: `transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275) ${biteIndex * 0.1}s`,
                      }}
                    />
                  )
                })
              })()}
          </g>
        )
      })}
    </svg>

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
              width: '100%',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="rgba(255,255,255,0.85)" />
              <circle
                cx="80"
                cy="80"
                r={RING_R}
                fill="none"
                stroke="#e8e8e8"
                strokeWidth="8"
              />
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
                  alt="Chewing..."
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
)

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface DinnerCountdownProps {
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
  /** Triggered when the timer runs out */
  onExpire?: () => void
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
  onExpire,
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
  const {
    animSlice,
    biteVis,
    isSetup,
    isSuccess,
    isTimeout,
    liveRemaining,
    liveRemainingFloat,
    liveCooldown,
    totalCooldownSeconds,
    secRot,
  } = useDinnerCountdownState({
    remaining,
    bitesLeft,
    isTimerRunning,
    isCompleted,
    biteCooldownSeconds,
    biteCooldownEndsAt,
    timerStartedAt,
    onExpire,
  })

  /* --- clock display mode: 'minsec' = m:ss, 'seconds' = total seconds --- */
  const [clockDisplayMode, setClockDisplayMode] =
    useState<ClockDisplayMode>('minsec')

  const bg = theme.colors.surface
  const showVisualSetupControls = showSetupControls && isSetup

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
          <CountdownVisualRow>
            <CountdownStepperControl
              theme={theme}
              direction="prev"
              onClick={() => onAdjustTime(-TIME_STEP)}
              disabled={!isSetup || duration <= MIN_DURATION}
              ariaLabel="Decrease timer by 5 minutes"
              visible={showVisualSetupControls}
              isSetup={isSetup}
            />

            {renderCountdownClockDisplay({
              theme,
              duration,
              liveRemaining,
              liveRemainingFloat,
              isTimerRunning,
              secRot,
              clockDisplayMode,
              onToggleDisplayMode: () =>
                setClockDisplayMode((mode) =>
                  mode === 'minsec' ? 'seconds' : 'minsec'
                ),
            })}

            <CountdownStepperControl
              theme={theme}
              direction="next"
              onClick={() => onAdjustTime(TIME_STEP)}
              disabled={!isSetup || duration >= MAX_DURATION}
              ariaLabel="Increase timer by 5 minutes"
              visible={showVisualSetupControls}
              isSetup={isSetup}
            />
          </CountdownVisualRow>

          {/* ---- PLATE ROW ---- */}
          <CountdownVisualRow
            style={{
              marginTop: `${PLATE_VERTICAL_OVERFLOW}px`,
              marginBottom: `${PLATE_VERTICAL_OVERFLOW}px`,
            }}
          >
            <CountdownStepperControl
              theme={theme}
              direction="prev"
              onClick={() => onAdjustBites(-1)}
              disabled={!isSetup || totalBites <= MIN_DINNER_SLICES}
              ariaLabel="Decrease bites"
              visible={showVisualSetupControls}
              isSetup={isSetup}
            />

            {renderCountdownPlateDisplay({
              theme,
              plateImage,
              totalBites,
              bitesLeft,
              animSlice,
              biteVis,
              background: bg,
              liveCooldown,
              totalCooldownSeconds,
              biteIcon,
              onBiteIconClick,
            })}

            <CountdownStepperControl
              theme={theme}
              direction="next"
              onClick={() => onAdjustBites(1)}
              disabled={!isSetup || totalBites >= MAX_DINNER_SLICES}
              ariaLabel="Increase bites"
              visible={showVisualSetupControls}
              isSetup={isSetup}
            />
          </CountdownVisualRow>

          {showStarReward && isSetup && (
            <StarRewardControl
              theme={theme}
              starReward={starReward}
              onStarsChange={onStarsChange}
            />
          )}
        </>
      )}
    </div>
  )
}

export default DinnerCountdown
