import { useDismissibleLayer } from '../hooks/useDismissibleLayer'
import { keyboardActivation } from './ui/keyboardActivation'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'

export default function ExpandableAgendaItem({
  children,
  className = 'day-agenda__item',
  style,
  ariaLabel,
}: {
  children: ReactNode
  ariaLabel?: string
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

  useDismissibleLayer({
    ref: itemRef,
    active: expanded,
    onDismiss: () => setExpandedHeight(null),
  })

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
        aria-label={ariaLabel}
        aria-description="Double-click, Enter, or Space toggles the size. Click outside or press Escape to collapse."
        onDoubleClick={toggleExpanded}
        onKeyDown={(event) => keyboardActivation(event, toggleExpanded)}
      >
        {children}
      </div>
    </li>
  )
}
