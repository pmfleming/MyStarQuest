import { useState, useEffect, type CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import StepperButton from './StepperButton'
import { uiTokens } from '../../tokens'
import starSvgUrl from '../../assets/global/star.svg'

// ============================================================================
// UNIFIED STAR DISPLAY COMPONENT
// Used by: StandardActionList (StarField)
// ============================================================================

// Inject CSS animations once
const STAR_DISPLAY_STYLES_ID = 'star-display-styles'
const injectStarDisplayStyles = () => {
  if (document.getElementById(STAR_DISPLAY_STYLES_ID)) return
  const style = document.createElement('style')
  style.id = STAR_DISPLAY_STYLES_ID
  style.textContent = `
    @keyframes star-pop-in {
      0% { transform: scale(0) rotate(-180deg); opacity: 0; }
      60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
      100% { transform: scale(1) rotate(var(--star-rot, 0deg)); opacity: 1; }
    }
    @keyframes star-pop-out {
      0% { transform: scale(1) rotate(var(--star-rot, 0deg)); opacity: 1; }
      100% { transform: scale(0) rotate(45deg); opacity: 0; }
    }
  `
  document.head.appendChild(style)
}

// ============================================================================
// TYPES
// ============================================================================

export type StarDisplayProps = {
  /** Number of stars to display */
  count: number
  /** Whether to animate stars when count changes */
  animate?: boolean
  /** Custom container style */
  style?: CSSProperties
  /** Custom class name */
  className?: string
  /** Empty state content when count is 0 */
  emptyContent?: React.ReactNode
  /** When true, renders +/- controls alongside the star field */
  editable?: boolean
  /** Called with the new value when +/- is pressed */
  onChange?: (value: number) => void
  /** Minimum value (inclusive). Defaults to 1. */
  min?: number
  /** Maximum value (inclusive). Defaults to 10. */
  max?: number
  /** Theme needed for editable stepper controls */
  theme?: Theme
}

const CONTROLS_DELAY_MS = 550
const STEPPER_WIDTH = 46
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const STAR_GEOMETRY_OVERHANG = 6
const STAR_CONTROL_WIDTH =
  CONTROL_ROW_WIDTH - STEPPER_WIDTH + STAR_GEOMETRY_OVERHANG * 2
const STAR_CONTROL_LEFT = (CONTROL_ROW_WIDTH - STAR_CONTROL_WIDTH) / 2
const STEPPER_OFFSET = STAR_CONTROL_LEFT - STEPPER_WIDTH / 2

// ============================================================================
// DENSITY CALCULATION
// ============================================================================

type DensityClass = 'low' | 'medium'

const getDensityClass = (count: number): DensityClass => {
  if (count > 24) return 'medium'
  return 'low'
}

const DENSITY_SIZES = {
  low: { width: 32, gap: 8 },
  medium: { width: 20, gap: 4 },
  // high: { width: 12, gap: 2 },
}

// ============================================================================
// STAR ICON COMPONENT
// ============================================================================

type StarIconProps = {
  size: number
  scale?: number
  rotation?: number
  animationDelay?: number
  animate?: boolean
  style?: CSSProperties
  className?: string
}

const StarIcon = ({
  size,
  scale = 1,
  rotation = 0,
  animationDelay = 0,
  animate = true,
  style,
  className,
}: StarIconProps) => {
  const finalSize = size * scale

  const starStyle: CSSProperties = {
    width: finalSize,
    height: finalSize,
    flexShrink: 0,
    filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.1))',
    '--star-rot': `${rotation}deg`,
    ...(animate
      ? {
          animation:
            'star-pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards',
          animationDelay: `${animationDelay}s`,
        }
      : {}),
    ...style,
  } as CSSProperties

  return (
    <img
      src={starSvgUrl}
      alt=""
      className={className}
      style={starStyle}
      aria-hidden="true"
    />
  )
}

// ============================================================================
// FIELD VARIANT - Flex wrapped grid of stars (for StandardActionList)
// ============================================================================

const FieldVariant = ({
  count,
  animate = true,
  emptyContent,
  style,
  className,
}: Omit<StarDisplayProps, 'variant'>) => {
  const densityClass = getDensityClass(count)
  const { width, gap } = DENSITY_SIZES[densityClass]

  // Track previous count for animation direction
  const [prevCount, setPrevCount] = useState(count)
  const [animatingOut, setAnimatingOut] = useState<number[]>([])

  useEffect(() => {
    if (count < prevCount && animate) {
      // Stars removed - animate out the difference
      const removedCount = prevCount - count
      const removedIndices = Array.from(
        { length: removedCount },
        (_, i) => count + i
      )
      setAnimatingOut(removedIndices)
      const timer = setTimeout(() => {
        setAnimatingOut([])
        setPrevCount(count)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setPrevCount(count)
    }
  }, [count, prevCount, animate])

  const containerStyle: CSSProperties = {
    background: '#f1f5f9',
    borderRadius: '20px',
    padding: '12px',
    minHeight: '60px',
    border: '2px dashed #cbd5e1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${gap}px`,
    ...style,
  }

  if (count === 0 && animatingOut.length === 0) {
    return (
      <div style={containerStyle} className={className}>
        {emptyContent ?? (
          <span
            style={{
              opacity: 0.5,
              fontStyle: 'italic',
              color: '#64748b',
              fontSize: '0.9rem',
            }}
          >
            No stars yet...
          </span>
        )}
      </div>
    )
  }

  const displayCount = Math.max(count, prevCount)
  const stars = Array.from({ length: displayCount })

  return (
    <div style={containerStyle} className={className}>
      {stars.map((_, i) => {
        const rot = ((i * 33) % 40) - 20
        const isExiting = animatingOut.includes(i)

        return (
          <StarIcon
            key={i}
            size={width}
            rotation={rot}
            animationDelay={animate && !isExiting ? i * 0.03 : 0}
            animate={animate && !isExiting}
            style={
              isExiting
                ? {
                    animation: 'star-pop-out 0.3s ease-out forwards',
                  }
                : undefined
            }
          />
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StarDisplay = ({
  count,
  animate = true,
  style,
  className,
  emptyContent,
  editable = false,
  onChange,
  min = 1,
  max = 10,
  theme,
}: StarDisplayProps) => {
  const [controlsVisible, setControlsVisible] = useState(false)

  // Inject styles on mount
  useEffect(() => {
    injectStarDisplayStyles()
  }, [])

  useEffect(() => {
    if (!editable) {
      setControlsVisible(false)
      return
    }
    const timer = setTimeout(() => setControlsVisible(true), CONTROLS_DELAY_MS)
    return () => clearTimeout(timer)
  }, [editable])

  const handleDecrement = () => {
    if (onChange && count > min) onChange(count - 1)
  }

  const handleIncrement = () => {
    if (onChange && count < max) onChange(count + 1)
  }

  const showControls = editable && controlsVisible

  if (editable && theme) {
    return (
      <div
        style={{
          position: 'relative',
          width: `${CONTROL_ROW_WIDTH}px`,
          maxWidth: '100%',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
        className={className}
      >
        <div
          style={{
            position: 'absolute',
            left: `${STEPPER_OFFSET}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: showControls ? 'auto' : 'none',
            zIndex: showControls ? 3 : 1,
          }}
        >
          <StepperButton
            theme={theme}
            direction="prev"
            onClick={handleDecrement}
            disabled={count <= min}
            ariaLabel="Decrease star value"
            style={{ position: 'relative', zIndex: 3 }}
          />
        </div>

        <div style={{ width: `${STAR_CONTROL_WIDTH}px`, minWidth: 0 }}>
          <FieldVariant
            count={count}
            animate={animate}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            right: `${STEPPER_OFFSET}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: showControls ? 'auto' : 'none',
            zIndex: showControls ? 3 : 1,
          }}
        >
          <StepperButton
            theme={theme}
            direction="next"
            onClick={handleIncrement}
            disabled={count >= max}
            ariaLabel="Increase star value"
            style={{ position: 'relative', zIndex: 3 }}
          />
        </div>
      </div>
    )
  }

  return (
    <FieldVariant
      count={count}
      animate={animate}
      emptyContent={emptyContent}
      style={style}
      className={className}
    />
  )
}

export default StarDisplay
