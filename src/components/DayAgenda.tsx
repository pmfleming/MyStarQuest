import type { Theme } from '../contexts/ThemeContext'
import type { AgendaItem } from '../lib/calendarSchedule'
import './DayAgenda.css'

export default function DayAgenda({
  theme,
  date,
  agenda,
}: {
  theme: Theme
  date: Date
  agenda: AgendaItem[]
}) {
  return (
    <section
      className="day-agenda"
      aria-label="Day agenda"
      style={{ color: theme.colors.text }}
    >
      <h2 className="day-agenda__heading">Your day</h2>
      <p className="day-agenda__date">
        {date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </p>
      {agenda.length === 0 ? (
        <p>No events planned for this day.</p>
      ) : (
        <ol className="day-agenda__list">
          {agenda.map((event) => (
            <li
              key={`${event.id}-${event.start}`}
              className="day-agenda__item"
              style={{
                background:
                  event.kind === 'activity'
                    ? `${theme.colors.accent}30`
                    : `${theme.colors.primary}08`,
                borderColor: `${theme.colors.accent}70`,
              }}
            >
              {theme.activityImages && (
                <img
                  className="day-agenda__image"
                  src={theme.activityImages[event.activity]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="day-agenda__details">
                <span className="day-agenda__title">{event.title}</span>
                <span className="day-agenda__time">
                  <time>{event.start}</time> – <time>{event.end}</time>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
