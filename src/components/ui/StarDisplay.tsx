import { useEffect, useState, type CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import StepperButton from './StepperButton'
import { getStepperEdgePositionStyle } from './stepperLayout'
import { uiTokens } from '../../tokens'
import starSvgUrl from '../../assets/global/star.svg'
import starNegativeSvgUrl from '../../assets/global/star-negative.svg'

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

type StarDisplayProps = {
  count: number
  iconSrc?: string
  valueLabel?: string
  decreaseLabel?: string
  increaseLabel?: string
  animate?: boolean
  style?: CSSProperties
  className?: string
  emptyContent?: React.ReactNode
  editable?: boolean
  onChange?: (value: number) => void | Promise<void>
  min?: number
  max?: number
  theme?: Theme
}

const COUNT_SURFACE_STYLE: CSSProperties = {
  background: '#f1f5f9',
  borderRadius: uiTokens.surfaceRadius,
  padding: 12,
  minHeight: uiTokens.listActionHeight,
  border: '2px dashed #cbd5e1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
}

const DENSITY_SIZES = {
  low: { width: 32, gap: 8 },
  medium: { width: 20, gap: 4 },
}

const EMPTY_STAR_CONTENT = (
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
)

type StarIconProps = {
  size: number
  rotation?: number
  animationDelay?: number
  animate?: boolean
  assetUrl?: string
  style?: CSSProperties
  className?: string
}

type StarIconStyle = CSSProperties & {
  '--star-rot': string
}

const StarIcon = ({
  size,
  rotation = 0,
  animationDelay = 0,
  animate = true,
  assetUrl = starSvgUrl,
  style,
  className,
}: StarIconProps) => {
  const starStyle: StarIconStyle = {
    width: size,
    height: size,
    objectFit: 'contain',
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
  }

  return (
    <img
      src={assetUrl}
      alt=""
      className={className}
      style={starStyle}
      aria-hidden="true"
    />
  )
}

function useAnimatedCount(displayMagnitude: number, animate: boolean) {
  // Track previous count for animation direction
  const [prevCount, setPrevCount] = useState(displayMagnitude)
  const [animatingOut, setAnimatingOut] = useState<number[]>([])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      if (displayMagnitude < prevCount && animate) {
        const removedCount = prevCount - displayMagnitude
        const removedIndices = Array.from(
          { length: removedCount },
          (_, i) => displayMagnitude + i
        )
        setAnimatingOut(removedIndices)
        timer = setTimeout(() => {
          setAnimatingOut([])
          setPrevCount(displayMagnitude)
        }, 300)
      } else {
        setPrevCount(displayMagnitude)
      }
    })
    return () => {
      cancelAnimationFrame(frame)
      if (timer) clearTimeout(timer)
    }
  }, [displayMagnitude, prevCount, animate])

  return { displayCount: Math.max(displayMagnitude, prevCount), animatingOut }
}

const FieldVariant = ({
  count,
  iconSrc,
  valueLabel,
  animate = true,
  emptyContent = EMPTY_STAR_CONTENT,
  style,
  className,
}: StarDisplayProps) => {
  const displayMagnitude = Math.abs(count)
  const densityClass = displayMagnitude > 24 ? 'medium' : 'low'
  const { width, gap } = DENSITY_SIZES[densityClass]
  const assetUrl = iconSrc ?? (count < 0 ? starNegativeSvgUrl : starSvgUrl)

  const { displayCount, animatingOut } = useAnimatedCount(
    displayMagnitude,
    animate
  )

  const containerStyle: CSSProperties = {
    ...COUNT_SURFACE_STYLE,
    flexWrap: 'wrap',
    gap,
    ...style,
  }

  const stars = Array.from({ length: displayCount })

  return (
    <div
      style={containerStyle}
      className={className}
      role={valueLabel ? 'img' : undefined}
      aria-label={valueLabel}
    >
      {displayMagnitude === 0 && animatingOut.length === 0
        ? emptyContent
        : stars.map((_, i) => {
            const rot = ((i * 33) % 40) - 20
            const isExiting = animatingOut.includes(i)

            return (
              <StarIcon
                key={i}
                size={width}
                assetUrl={assetUrl}
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

const CompactCountVariant = ({
  count,
  iconSrc,
  valueLabel,
  style,
  className,
  theme,
}: StarDisplayProps) => {
  const assetUrl = iconSrc ?? (count < 0 ? starNegativeSvgUrl : starSvgUrl)

  return (
    <div
      style={{ ...COUNT_SURFACE_STYLE, ...style }}
      className={className}
      role="img"
      aria-label={valueLabel ?? `${count} stars`}
    >
      <span
        style={{
          color: theme?.colors.primary ?? '#EC4899',
          fontFamily: theme?.fonts.heading,
          fontSize: '2rem',
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {count}
      </span>
      <StarIcon size={38} assetUrl={assetUrl} animate={false} />
    </div>
  )
}

type StarStepperProps = {
  direction: 'prev' | 'next'
  theme: Theme
  onClick: () => void | Promise<void>
  disabled: boolean
  ariaLabel: string
}

const StarStepper = ({
  direction,
  theme,
  onClick,
  disabled,
  ariaLabel,
}: StarStepperProps) => (
  <div
    style={{
      ...getStepperEdgePositionStyle(direction),
      opacity: 1,
      pointerEvents: 'auto',
      zIndex: 3,
    }}
  >
    <StepperButton
      theme={theme}
      direction={direction}
      onClick={onClick}
      disabled={disabled}
      ariaLabel={ariaLabel}
      style={{ position: 'relative', zIndex: 3 }}
    />
  </div>
)

const StarDisplay = (props: StarDisplayProps) => {
  const {
    count,
    decreaseLabel = 'Decrease star value',
    increaseLabel = 'Increase star value',
    style,
    className,
    editable = false,
    onChange,
    min = 1,
    max,
    theme,
  } = props
  useEffect(() => {
    injectStarDisplayStyles()
  }, [])

  if (!editable || !theme) return <FieldVariant {...props} />

  const handleDecrement = () => {
    if (onChange && count > min) return onChange(count - 1)
  }

  const handleIncrement = () => {
    if (onChange && (max === undefined || count < max))
      return onChange(count + 1)
  }

  const compact = Math.abs(count) > 10
  const Value = compact ? CompactCountVariant : FieldVariant
  const value = (
    <Value
      {...props}
      emptyContent={undefined}
      className={undefined}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: compact ? 12 : `12px ${uiTokens.listUtilityActionWidth + 8}px`,
      }}
    />
  )

  return (
    <div
      style={{
        position: 'relative',
        width: `${uiTokens.controlRowWidth}px`,
        maxWidth: '100%',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      className={className}
    >
      <StarStepper
        theme={theme}
        direction="prev"
        onClick={handleDecrement}
        disabled={count <= min}
        ariaLabel={decreaseLabel}
      />

      <div style={{ width: '100%', minWidth: 0 }}>{value}</div>

      <StarStepper
        theme={theme}
        direction="next"
        onClick={handleIncrement}
        disabled={max !== undefined && count >= max}
        ariaLabel={increaseLabel}
      />
    </div>
  )
}

export default StarDisplay
