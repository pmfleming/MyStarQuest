import { useDismissibleLayer } from '../hooks/useDismissibleLayer'
import type { Theme } from '../contexts/ThemeContext'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { calendarWeekdays as weekdays } from '../ui/calendarWeekdayAssets'
import './CalendarWeekdays.css'

export default function CalendarWeekdays({
  theme,
  dayOfWeek,
  highlightedDayOfWeek,
}: {
  theme: Theme
  dayOfWeek?: number
  highlightedDayOfWeek?: number
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const previewRef = useRef<HTMLButtonElement>(null)
  useDismissibleLayer({
    ref: previewRef,
    active: expandedDay,
    onDismiss: () => setExpandedDay(null),
    autoFocus: true,
  })
  const visibleWeekdays = weekdays.filter(
    (_, index) => dayOfWeek === undefined || index === (dayOfWeek + 6) % 7
  )
  return visibleWeekdays.map((weekday) => {
    const teenie = theme.id === 'teenie'
    const description = `${weekday.day}: ${weekday.meaning}${teenie ? `; ${weekday.name} represents ${weekday.link}` : `; ${weekday.link}`}`
    return (
      <button
        key={weekday.day}
        type="button"
        className="calendar-weekday"
        data-highlighted={
          highlightedDayOfWeek !== undefined &&
          weekday === weekdays[(highlightedDayOfWeek + 6) % 7]
        }
        aria-label={description}
        aria-expanded={expandedDay === weekday.day}
        aria-description="Double-click, Enter, or Space to enlarge. Double-click again, click outside, or press Escape to close."
        title={description}
        onDoubleClick={(event) => {
          event.currentTarget.focus({ preventScroll: true })
          setExpandedDay(weekday.day)
        }}
        onClick={(event) => {
          if (event.detail === 0) setExpandedDay(weekday.day)
        }}
      >
        <img
          src={teenie ? weekday.ping : weekday.symbol}
          alt=""
          aria-hidden="true"
        />
        {expandedDay === weekday.day &&
          createPortal(
            <button
              ref={previewRef}
              type="button"
              className="calendar-weekday-preview"
              aria-label={`Close enlarged ${weekday.day} image`}
              aria-description="Double-click or press Enter, Space, or Escape to close. Clicking outside also closes the image."
              onDoubleClick={(event) => {
                event.stopPropagation()
                setExpandedDay(null)
              }}
              onClick={(event) => {
                event.stopPropagation()
                if (event.detail === 0) setExpandedDay(null)
              }}
              style={{
                background: theme.colors.surface,
                borderColor: theme.colors.accent,
              }}
            >
              <img
                src={teenie ? weekday.ping : weekday.symbol}
                alt={`${weekday.day} enlarged`}
              />
            </button>,
            document.body
          )}
      </button>
    )
  })
}
