import type { CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import AgendaTime from './AgendaTime'
import AgendaTitle from './AgendaTitle'
import ExpandableAgendaItem from './ExpandableAgendaItem'
import './DayAgenda.css'

export type AgendaTiming =
  | {
      kind: 'range'
      start: string
      end: string
      startDate?: string
      endDate?: string
    }
  | { kind: 'single'; time: string }
  | { kind: 'all-day' | 'unknown' }

type AgendaEntry = {
  id: string
  title: string
  image?: string
  subtitle?: string
  details?: string[]
  timing: AgendaTiming
  background: string
}

function AllDayIndicator() {
  return (
    <div className="day-agenda__time">
      <svg
        className="day-agenda__clock"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="day-agenda__clock-face" cx="50" cy="50" r="47" />
        <g
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        >
          <circle cx="35" cy="39" r="10" />
          <path d="M35 20v4m0 30v4M16 39h4m30 0h4M22 26l3 3m20 20 3 3M22 52l3-3m20-20 3-3" />
          <path d="M72 43a16 16 0 1 0 9 24 18 18 0 0 1-9-24Z" />
        </g>
      </svg>
      <span className="day-agenda__all-day-label">All day</span>
    </div>
  )
}

const timingClasses: Record<AgendaTiming['kind'], string> = {
  range: '',
  single: 'day-agenda__item--single-time',
  'all-day': 'day-agenda__item--single-time',
  unknown: 'day-agenda__item--no-time',
}

export default function AgendaList({
  theme,
  entries,
  label,
  ordered = false,
  emptyText,
}: {
  theme: Theme
  entries: AgendaEntry[]
  label: string
  ordered?: boolean
  emptyText?: string
}) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <section
      className={entries.length || emptyText ? 'day-agenda' : undefined}
      aria-label={label}
      style={
        {
          color: theme.colors.text,
          '--agenda-surface': theme.colors.surface,
          '--agenda-accent': theme.colors.accent,
          '--agenda-heading-font': theme.fonts.heading,
        } as CSSProperties
      }
    >
      {entries.length === 0 ? (
        emptyText && <p>{emptyText}</p>
      ) : (
        <List className="day-agenda__list">
          {entries.map(
            ({ id, title, image, subtitle, details, timing, background }) => (
              <ExpandableAgendaItem
                key={id}
                className={`day-agenda__item ${timingClasses[timing.kind]}`}
                style={{ background, borderColor: `${theme.colors.accent}70` }}
              >
                {timing.kind === 'all-day' && <AllDayIndicator />}
                {timing.kind === 'single' && (
                  <AgendaTime value={timing.time} label="At" />
                )}
                {timing.kind === 'range' && (
                  <AgendaTime
                    value={timing.start}
                    label="From"
                    dateLabel={timing.startDate}
                  />
                )}
                <div className="day-agenda__details">
                  {image && (
                    <img
                      className="day-agenda__image"
                      src={image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <AgendaTitle title={title} />
                  {subtitle && (
                    <span className="day-agenda__subtitle">{subtitle}</span>
                  )}
                  {details && (
                    <span className="day-agenda__extra">
                      {details.map((detail) => (
                        <span key={detail} className="day-agenda__subtitle">
                          {detail}
                        </span>
                      ))}
                    </span>
                  )}
                  {timing.kind === 'unknown' && (
                    <span className="day-agenda__subtitle">
                      Time not provided
                    </span>
                  )}
                </div>
                {timing.kind === 'range' && (
                  <AgendaTime
                    value={timing.end}
                    label="To"
                    dateLabel={timing.endDate}
                  />
                )}
              </ExpandableAgendaItem>
            )
          )}
        </List>
      )}
    </section>
  )
}
