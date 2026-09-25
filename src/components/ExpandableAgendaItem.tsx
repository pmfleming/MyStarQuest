import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

export default function ExpandableAgendaItem({
  children,
  className = 'day-agenda__item',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const itemRef = useRef<HTMLLIElement>(null)
  const [expandedHeight, setExpandedHeight] = useState<number | null>(null)
  const expanded = expandedHeight !== null

  const toggleExpanded = () => {
    if (expanded) {
      setExpandedHeight(null)
    } else {
      setExpandedHeight(
        (itemRef.current?.getBoundingClientRect().height || 88) * 3
      )
    }
  }

  useEffect(() => {
    if (!expanded) return
    const collapseOutside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !itemRef.current?.contains(event.target)
      ) {
        setExpandedHeight(null)
      }
    }
    const collapseOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedHeight(null)
    }
    document.addEventListener('pointerdown', collapseOutside, true)
    document.addEventListener('focusin', collapseOutside)
    document.addEventListener('keydown', collapseOnEscape)
    return () => {
      document.removeEventListener('pointerdown', collapseOutside, true)
      document.removeEventListener('focusin', collapseOutside)
      document.removeEventListener('keydown', collapseOnEscape)
    }
  }, [expanded])

  return (
    <li
      ref={itemRef}
      className={className}
      data-expanded={expanded}
      style={{ ...style, minHeight: expandedHeight ?? undefined }}
    >
      <div
        className="day-agenda__content"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-description="Double-click, Enter, or Space toggles the size. Click outside or press Escape to collapse."
        onDoubleClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggleExpanded()
          }
        }}
      >
        {children}
      </div>
    </li>
  )
}
