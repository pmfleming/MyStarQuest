import { useState, useEffect, type CSSProperties } from 'react'
import starSvgUrl from '../assets/global/star.svg'

// ============================================================================
// UNIFIED STAR DISPLAY COMPONENT
// Used by: StarInfoBox, StarCost, StandardActionList (StarField)
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

export type StarDisplayVariant = 'field' | 'hero'

export type StarDisplayProps = {
  /** Number of stars to display */
  count: number
  /** Visual variant - affects layout and sizing behavior */
  variant?: StarDisplayVariant
  /** Color tint for the stars (uses CSS filter). Default uses gold tint. */
  tintColor?: string
  /** Fixed star size in pixels (overrides density-based sizing) */
  starSize?: number
  /** Whether to animate stars when count changes */
  animate?: boolean
  /** Custom container style */
  style?: CSSProperties
  /** Custom class name */
  className?: string
  /** Empty state content when count is 0 */
  emptyContent?: React.ReactNode
  /** Max width for the container (for 'field' variant) */
  maxWidth?: number
}

// ============================================================================
// DENSITY CALCULATION
// ============================================================================

type DensityClass = 'low' | 'medium' | 'high'

const getDensityClass = (count: number): DensityClass => {
  if (count > 40) return 'high'
  if (count > 10) return 'medium'
  return 'low'
}

const DENSITY_SIZES = {
  low: { width: 32, height: 32, gap: 8 },
  medium: { width: 20, height: 20, gap: 4 },
  high: { width: 12, height: 12, gap: 2 },
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
    padding: densityClass === 'high' ? '8px' : '12px',
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
// HERO VARIANT - Single large star (for StarInfoBox)
// ============================================================================

const HeroVariant = ({
  starSize = 100,
  animate = true,
  style,
  className,
}: Omit<StarDisplayProps, 'variant' | 'count'> & { count?: number }) => {
  const containerStyle: CSSProperties = {
    position: 'relative',
    width: starSize,
    height: starSize,
    flexShrink: 0,
    ...style,
  }

  return (
    <div style={containerStyle} className={className}>
      <StarIcon size={starSize} animate={animate} />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const StarDisplay = ({
  count,
  variant = 'field',
  animate = true,
  style,
  className,
  emptyContent,
  starSize,
}: StarDisplayProps) => {
  // Inject styles on mount
  useEffect(() => {
    injectStarDisplayStyles()
  }, [])

  switch (variant) {
    case 'field':
      return (
        <FieldVariant
          count={count}
          animate={animate}
          emptyContent={emptyContent}
          style={style}
          className={className}
        />
      )
    case 'hero':
      return (
        <HeroVariant
          count={count}
          animate={animate}
          starSize={starSize}
          style={style}
          className={className}
        />
      )
    default:
      return null
  }
}

// Also export the StarIcon for direct use in complex animations
export { StarIcon, injectStarDisplayStyles }
export default StarDisplay
