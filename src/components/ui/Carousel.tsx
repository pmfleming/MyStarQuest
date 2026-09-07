import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

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

const ITEM_SIZE = 90
const GAP = 16
const ACTIVE_SCALE = 1.3
const SIDE_SCALE = 1

const getWrappedIndex = (index: number, length: number) =>
  (index + length) % length

const getRequiredItem = (items: CarouselItem[], index: number) => {
  const item = items[index]
  if (!item) throw new Error(`Missing carousel item at index ${index}`)
  return item
}

const Carousel = ({
  items,
  initialIndex = 0,
  onChange,
  className,
  style,
}: CarouselProps) => {
  const { theme } = useTheme()
  const safeItems = useMemo(() => items ?? [], [items])
  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(0, Math.min(initialIndex, safeItems.length - 1))
  )
  const currentIndex = Math.max(
    0,
    Math.min(selectedIndex, safeItems.length - 1)
  )

  useEffect(() => {
    if (!onChange) return
    onChange(currentIndex)
  }, [currentIndex, onChange])

  const visibleItems = useMemo(() => {
    if (safeItems.length === 0) return []
    return [
      getRequiredItem(
        safeItems,
        getWrappedIndex(currentIndex - 1, safeItems.length)
      ),
      getRequiredItem(safeItems, currentIndex),
      getRequiredItem(
        safeItems,
        getWrappedIndex(currentIndex + 1, safeItems.length)
      ),
    ]
  }, [safeItems, currentIndex])

  const navigate = (delta: number) => {
    if (safeItems.length <= 1) return
    setSelectedIndex((index) =>
      getWrappedIndex(index + delta, safeItems.length)
    )
  }

  if (safeItems.length === 0) return null

  const rootStyle: CSSProperties = {
    background: `linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.bg} 100%)`,
    border: `6px solid ${theme.colors.primary}`,
    padding: '14px 0 18px',
    textAlign: 'center',
    boxShadow: `0 6px 0 ${theme.colors.accent}80`,
    borderRadius: 16,
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
    padding: 0,
    background: theme.colors.surface,
    border: `4px solid ${theme.colors.primary}`,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 6px 0 ${theme.colors.accent}80`,
    transform: 'scale(0.85)',
    transition: 'transform 0.35s ease, opacity 0.35s ease',
    opacity: 0.9,
    flexShrink: 0,
  }

  const sideButtonStyle: CSSProperties = {
    cursor: safeItems.length > 1 ? 'pointer' : 'default',
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
      <div style={stageStyle}>
        <div
          style={{
            ...trackStyle,
          }}
        >
          {visibleItems.map((item, index) => {
            const isCurrent = index === 1
            const direction = index === 0 ? 'Previous' : 'Next'
            const onClick = index === 0 ? () => navigate(-1) : () => navigate(1)
            const itemStyle = getItemStyle(index)

            if (isCurrent) {
              return (
                <div
                  key={`${item.id}-${index}`}
                  style={itemStyle}
                  aria-label={`Selected: ${item.label}`}
                >
                  <span style={iconStyle}>{item.icon}</span>
                </div>
              )
            }

            return (
              <button
                key={`${item.id}-${index}`}
                type="button"
                onClick={onClick}
                disabled={safeItems.length <= 1}
                style={{ ...itemStyle, ...sideButtonStyle }}
                aria-label={`${direction}: ${item.label}`}
              >
                <span style={iconStyle}>{item.icon}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Carousel
export type { CarouselItem, CarouselProps }
