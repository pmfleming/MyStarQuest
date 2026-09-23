import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { uiTokens } from '../../tokens'

type DragScrollRegionProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  contentStyle?: CSSProperties
  as?: 'main' | 'div' | 'section'
  bottomNavPadding?: boolean
  topNavPadding?: boolean
}

type DragState = {
  startY: number
  startScrollTop: number
  hasMoved: boolean
}

const DRAG_THRESHOLD_PX = 8
const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, option, label, a, [role="button"], [data-no-drag-scroll="true"]'

const DragScrollRegion = ({
  children,
  className,
  contentClassName,
  contentStyle,
  as = 'main',
  bottomNavPadding = false,
  topNavPadding = false,
}: DragScrollRegionProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const ComponentTag = as

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const lifetime = new AbortController()
    const { signal } = lifetime
    let gesture: AbortController | undefined
    let suppressClick = false
    let clickTimer: ReturnType<typeof setTimeout> | undefined

    const updateScrollState = () =>
      setCanScroll(element.scrollHeight > element.clientHeight + 1)
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(element)
    Array.from(element.children).forEach((child) =>
      resizeObserver.observe(child)
    )
    updateScrollState()
    element.addEventListener('scroll', updateScrollState, {
      passive: true,
      signal,
    })

    const stopDragging = () => {
      gesture?.abort()
      gesture = undefined
      setIsDragging(false)
    }
    const startDragging = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        element.scrollHeight <= element.clientHeight + 1
      )
        return
      if (
        event.target instanceof Element &&
        event.target.closest(INTERACTIVE_SELECTOR)
      )
        return
      stopDragging()
      clearTimeout(clickTimer)
      suppressClick = false
      const drag: DragState = {
        startY: event.clientY,
        startScrollTop: element.scrollTop,
        hasMoved: false,
      }
      gesture = new AbortController()
      const { signal } = gesture
      const previousSelect = document.body.style.userSelect
      document.body.style.userSelect = 'none'
      signal.addEventListener(
        'abort',
        () => {
          document.body.style.userSelect = previousSelect
        },
        { once: true }
      )
      window.addEventListener(
        'mousemove',
        (move) => {
          const delta = move.clientY - drag.startY
          if (!drag.hasMoved && Math.abs(delta) >= DRAG_THRESHOLD_PX) {
            drag.hasMoved = true
            suppressClick = true
            setIsDragging(true)
          }
          if (!drag.hasMoved) return
          move.preventDefault()
          element.scrollTop = drag.startScrollTop - delta * 1.5
        },
        { signal }
      )
      window.addEventListener(
        'mouseup',
        () => {
          stopDragging()
          clickTimer = setTimeout(() => {
            suppressClick = false
          }, 0)
        },
        { signal }
      )
      window.addEventListener(
        'blur',
        () => {
          stopDragging()
          suppressClick = false
        },
        { signal }
      )
    }
    element.addEventListener('mousedown', startDragging, { signal })
    element.addEventListener(
      'click',
      (event) => {
        if (!suppressClick) return
        event.preventDefault()
        event.stopPropagation()
      },
      { capture: true, signal }
    )
    return () => {
      lifetime.abort()
      gesture?.abort()
      clearTimeout(clickTimer)
      resizeObserver.disconnect()
    }
  }, [])

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
          paddingTop: topNavPadding
            ? `${uiTokens.floatingNavHeight + 24}px`
            : undefined,
          paddingBottom: bottomNavPadding
            ? `${uiTokens.floatingNavHeight + 48}px`
            : undefined,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </ComponentTag>
  )
}

export default DragScrollRegion
