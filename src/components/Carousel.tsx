import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import StepperButton from './StepperButton'

type CarouselItem = {
  id: string | number
  label: string
  icon: ReactNode
}

type CarouselProps = {
  items: CarouselItem[]
  title?: string
  initialIndex?: number
  onChange?: (index: number) => void
  className?: string
  style?: CSSProperties
}

const ANIMATION_MS = 350
const ITEM_SIZE = 90
const GAP = 16
const ACTIVE_SCALE = 1.3
const SIDE_SCALE = 1

const Carousel = ({
  items,
  title = 'Select Your Item',
  initialIndex = 0,
  onChange,
  className,
  style,
}: CarouselProps) => {
  const { theme } = useTheme()
  const safeItems = items ?? []
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, safeItems.length - 1))
  )
  const [isAnimating, setIsAnimating] = useState(false)
  const [slideOffset, setSlideOffset] = useState(0)
  const SLIDE_DISTANCE = ITEM_SIZE + GAP

  useEffect(() => {
    if (safeItems.length === 0) return
    setCurrentIndex((prev) => Math.max(0, Math.min(prev, safeItems.length - 1)))
  }, [safeItems.length])

  useEffect(() => {
    if (!onChange) return
    onChange(currentIndex)
  }, [currentIndex, onChange])

  const getPrevIndex = (index: number) =>
    index === 0 ? safeItems.length - 1 : index - 1
  const getNextIndex = (index: number) =>
    index === safeItems.length - 1 ? 0 : index + 1

  const visibleItems = useMemo(() => {
    if (safeItems.length === 0) return []
    const prevIndex = getPrevIndex(currentIndex)
    const nextIndex = getNextIndex(currentIndex)
    return [safeItems[prevIndex], safeItems[currentIndex], safeItems[nextIndex]]
  }, [safeItems, currentIndex])

  const handleNext = () => {
    if (isAnimating || safeItems.length <= 1) return
    setIsAnimating(true)
    // Move track LEFT to reveal next item
    setSlideOffset(-SLIDE_DISTANCE)
    setTimeout(() => {
      setIsAnimating(false)
      setSlideOffset(0) // Snap back to center
      setCurrentIndex(getNextIndex(currentIndex))
    }, ANIMATION_MS)
  }

  const handlePrev = () => {
    if (isAnimating || safeItems.length <= 1) return
    setIsAnimating(true)
    // Move track RIGHT to reveal prev item
    setSlideOffset(SLIDE_DISTANCE)
    setTimeout(() => {
      setIsAnimating(false)
      setSlideOffset(0) // Snap back to center
      setCurrentIndex(getPrevIndex(currentIndex))
    }, ANIMATION_MS)
  }

  if (safeItems.length === 0) return null

  const rootStyle: CSSProperties = {
    background: `linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.bg} 100%)`,
    border: `6px solid ${theme.colors.primary}`,
    padding: '14px 10px 18px',
    textAlign: 'center',
    boxShadow:
      theme.id === 'space'
        ? `0 0 16px ${theme.colors.primary}55`
        : `0 6px 0 ${theme.colors.accent}80`,
    borderRadius: 16,
  }

  const titleStyle: CSSProperties = {
    color: theme.colors.text,
    fontWeight: 700,
    letterSpacing: '2px',
    marginBottom: '10px',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
  }

  const stageStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '170px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const trackStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${GAP}px`,
    willChange: 'transform',
  }

  const baseItemStyle: CSSProperties = {
    width: `${ITEM_SIZE}px`,
    height: `${ITEM_SIZE}px`,
    background: theme.colors.surface,
    border: `4px solid ${theme.colors.primary}`,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      theme.id === 'space'
        ? `0 0 12px ${theme.colors.primary}55`
        : `0 6px 0 ${theme.colors.accent}80`,
    transform: 'scale(0.85)',
    transition: 'transform 0.35s ease, opacity 0.35s ease',
    opacity: 0.9,
    flexShrink: 0,
  }

  const iconStyle: CSSProperties = {
    fontSize: '3.5rem',
    lineHeight: 1,
    filter: 'drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.2))',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  }

  const labelStyle: CSSProperties = {
    marginTop: '10px',
    color: theme.colors.primary,
    fontFamily: theme.fonts.body,
    fontWeight: 700,
    fontSize: '1rem',
    minHeight: '1.2em',
  }

  const arrowPositionStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 3,
  }

  const getItemStyle = (index: number): CSSProperties => {
    if (index === 1) {
      return {
        ...baseItemStyle,
        transform: `scale(${ACTIVE_SCALE})`,
        opacity: 1,
        zIndex: 2,
      }
    }
    return {
      ...baseItemStyle,
      transform: `scale(${SIDE_SCALE})`,
      opacity: 0.95,
      zIndex: 1,
    }
  }

  return (
    <div className={className} style={{ ...rootStyle, ...style }}>
      <div style={titleStyle}>{title}</div>

      <div style={stageStyle}>
        <StepperButton
          theme={theme}
          direction="prev"
          onClick={handlePrev}
          ariaLabel="Previous"
          style={{ ...arrowPositionStyle, left: '4px' }}
        >
          ‹
        </StepperButton>

        <div
          style={{
            ...trackStyle,
            transform: `translateX(${slideOffset}px)`,
            transition: isAnimating
              ? `transform ${ANIMATION_MS}ms ease-out`
              : 'none',
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={`${item.id}-${index}`} style={getItemStyle(index)}>
              <span style={iconStyle}>{item.icon}</span>
            </div>
          ))}
        </div>

        <StepperButton
          theme={theme}
          direction="next"
          onClick={handleNext}
          ariaLabel="Next"
          style={{ ...arrowPositionStyle, right: '4px' }}
        >
          ›
        </StepperButton>
      </div>

      <div style={labelStyle}>{safeItems[currentIndex].label}</div>
    </div>
  )
}

export default Carousel
export type { CarouselItem, CarouselProps }
