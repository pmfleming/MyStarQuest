import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import type { Theme } from '../contexts/ThemeContext'

type DragScrollRegionProps = {
  theme: Theme
  children: ReactNode
  className?: string
  contentClassName?: string
  contentStyle?: CSSProperties
  fadeHeight?: number
  as?: 'main' | 'div' | 'section'
}

type DragState = {
  startY: number
  startScrollTop: number
  hasMoved: boolean
}

const DRAG_THRESHOLD_PX = 8
const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, option, label, a, [role="button"], [data-no-drag-scroll="true"]'

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.trim().replace('#', '')

  if (normalized.length !== 3 && normalized.length !== 6) {
    return `rgba(253, 242, 248, ${alpha})`
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const DragScrollRegion = ({
  theme,
  children,
  className,
  contentClassName,
  contentStyle,
  fadeHeight = 96,
  as = 'main',
}: DragScrollRegionProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    const updateScrollState = () => {
      const nextCanScroll =
        scrollElement.scrollHeight > scrollElement.clientHeight + 1
      const remainingScroll =
        scrollElement.scrollHeight -
        scrollElement.clientHeight -
        scrollElement.scrollTop

      setCanScroll(nextCanScroll)
      setShowBottomFade(nextCanScroll && remainingScroll > 6)
    }

    updateScrollState()

    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(scrollElement)

    for (const child of Array.from(scrollElement.children)) {
      resizeObserver.observe(child)
    }

    scrollElement.addEventListener('scroll', updateScrollState, {
      passive: true,
    })
    window.addEventListener('resize', updateScrollState)

    return () => {
      resizeObserver.disconnect()
      scrollElement.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  })

  useEffect(() => {
    return () => {
      document.body.style.removeProperty('user-select')
    }
  }, [])

  const stopDragging = () => {
    dragStateRef.current = null
    setIsDragging(false)
    document.body.style.removeProperty('user-select')
    window.removeEventListener('mousemove', handleWindowMouseMove)
    window.removeEventListener('mouseup', handleWindowMouseUp)
  }

  const handleWindowMouseMove = (event: MouseEvent) => {
    const scrollElement = scrollRef.current
    const dragState = dragStateRef.current

    if (!scrollElement || !dragState) return

    const deltaY = event.clientY - dragState.startY

    if (!dragState.hasMoved && Math.abs(deltaY) >= DRAG_THRESHOLD_PX) {
      dragState.hasMoved = true
      suppressClickRef.current = true
      setIsDragging(true)
    }

    if (!dragState.hasMoved) return

    event.preventDefault()
    scrollElement.scrollTop = dragState.startScrollTop - deltaY * 1.5
  }

  const handleWindowMouseUp = () => {
    stopDragging()
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 0)
  }

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (!canScroll) return

    const target = event.target
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR)) {
      return
    }

    const scrollElement = scrollRef.current
    if (!scrollElement) return

    dragStateRef.current = {
      startY: event.clientY,
      startScrollTop: scrollElement.scrollTop,
      hasMoved: false,
    }

    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
  }

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return

    event.preventDefault()
    event.stopPropagation()
  }

  const fadeColor =
    theme.id === 'princess' ? theme.colors.bg : theme.colors.surface
  const ComponentTag = as

  const outerClasses = [
    'relative flex flex-col overflow-hidden',
    className || 'flex-1 min-h-0',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ComponentTag className={outerClasses}>
      <div
        ref={scrollRef}
        className={[
          'app-scroll-region',
          'min-h-0 flex-1',
          canScroll ? 'can-drag-scroll' : '',
          isDragging ? 'is-dragging' : '',
          contentClassName ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          ...contentStyle,
        }}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${fadeHeight}px`,
          opacity: showBottomFade ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 180ms ease',
          background: `linear-gradient(180deg, ${hexToRgba(fadeColor, 0)} 0%, ${hexToRgba(fadeColor, 0.76)} 72%, ${hexToRgba(fadeColor, 1)} 100%)`,
        }}
      />
    </ComponentTag>
  )
}

export default DragScrollRegion
