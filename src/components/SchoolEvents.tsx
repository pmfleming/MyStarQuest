import type { Theme } from '../contexts/ThemeContext'
import {
  getSchoolEvents,
  type SchoolCalendarDay,
} from '../lib/schoolCalendarData'
import { getSchoolEventImage } from '../ui/schoolEventAssets'
import './DayAgenda.css'

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  hour: '2-digit',
  minute: '2-digit',
})
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  day: 'numeric',
  month: 'short',
})
const dateKeyFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const eventTiming = (event: ReturnType<typeof getSchoolEvents>[number]) => {
  if (event.kind === 'early-finish') return event.releaseTime
  if (event.allDay) return 'All day'
  if (!event.start || !event.end) return undefined
  const start = new Date(event.start)
  const end = new Date(event.end)
  if (start.getTime() === end.getTime()) return timeFormat.format(start)
  if (dateKeyFormat.format(start) !== dateKeyFormat.format(end))
    return `${dateFormat.format(start)} ${timeFormat.format(start)} – ${dateFormat.format(end)} ${timeFormat.format(end)}`
  return `${timeFormat.format(start)} – ${timeFormat.format(end)}`
}

export default function SchoolEvents({
  day,
  dateKey,
  theme,
  isSchool,
}: {
  day?: SchoolCalendarDay
  dateKey: string
  theme: Theme
  isSchool: boolean
}) {
  const events = getSchoolEvents(day)
  const date = new Date(`${dateKey}T12:00:00`)
  return (
    <section
      className="day-agenda"
      aria-label="School events"
      style={{ color: theme.colors.text }}
    >
      <h3 style={{ margin: '16px 0 4px', fontSize: '1rem' }}>
        {date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </h3>
      <p style={{ margin: '0 0 10px', fontSize: '0.85rem' }}>
        {isSchool ? 'School day' : 'Day off'}
      </p>
      {events.length > 0 && (
        <ul className="day-agenda__list">
          {events.map((event) => (
            <li
              key={event.id}
              className="day-agenda__item"
              style={{
                background: `${theme.colors.accent}20`,
                borderColor: `${theme.colors.accent}70`,
              }}
            >
              {event.artwork && (
                <img
                  className="day-agenda__image"
                  src={getSchoolEventImage(theme.id, event.artwork)}
                  alt=""
                  decoding="async"
                />
              )}
              <div className="day-agenda__details">
                <span className="day-agenda__title">{event.titleEn}</span>
                <span className="day-agenda__time">
                  {event.kind === 'day-off'
                    ? 'Day off'
                    : event.kind === 'early-finish'
                      ? 'Early finish'
                      : 'Activity'}
                  {eventTiming(event) && ` · ${eventTiming(event)}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
