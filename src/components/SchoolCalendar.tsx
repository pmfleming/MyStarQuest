import { useEffect, useMemo, useState } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { getSeasonForDate, buildDateKey } from '../lib/today'
import {
  princessSchoolDayImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDayWinterImage,
} from '../assets/themes/princess/assets'

const CALENDAR_URL = 'https://getschoolcalendar-6ujocyt4pq-uc.a.run.app'

const CACHE_KEY = 'schoolCalendar'
const CACHE_TS_KEY = 'schoolCalendarTs'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 1 week

export function clearSchoolCalendarCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_TS_KEY)
}

const OFF_DAY_KEYWORDS = [
  'studiedag',
  'vakantie',
  'vrij',
  'holiday',
  'no school',
  'margedag',
  'pasen',
  'pinksteren',
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const getNonSchoolDayIcon = (season: ReturnType<typeof getSeasonForDate>) => {
  switch (season) {
    case 'spring':
      return princessNonSchoolDaySpringImage
    case 'summer':
      return princessNonSchoolDaySummerImage
    case 'autumn':
      return princessNonSchoolDayAutumnImage
    case 'winter':
    default:
      return princessNonSchoolDayWinterImage
  }
}

type SchoolCalendarProps = {
  theme: Theme
  todayDateKey: string
}

export default function SchoolCalendar({
  theme,
  todayDateKey,
}: SchoolCalendarProps) {
  const [events, setEvents] = useState<Record<string, string>>({})
  const [viewDate, setViewDate] = useState(() => new Date())

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    const cachedTs = localStorage.getItem(CACHE_TS_KEY)

    if (cached && cachedTs && Date.now() - Number(cachedTs) < CACHE_TTL_MS) {
      try {
        setEvents(JSON.parse(cached))
        return
      } catch {
        // fall through to fetch
      }
    }

    const controller = new AbortController()

    fetch(CALENDAR_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.json()
      })
      .then((data: Record<string, string>) => {
        setEvents(data)
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch school calendar', err)
        }
      })

    return () => controller.abort()
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Monday-based: 0=Mon … 6=Sun
  const rawFirstDay = new Date(year, month, 1).getDay()
  const firstDayOffset = rawFirstDay === 0 ? 6 : rawFirstDay - 1

  const monthLabel = viewDate.toLocaleString('default', { month: 'long' })

  const season = useMemo(() => getSeasonForDate(viewDate), [viewDate])
  const schoolIcon = princessSchoolDayImage
  const nonSchoolIcon = getNonSchoolDayIcon(season)

  const isDaySchool = (day: number, weekdayIndex: number) => {
    const dateKey = buildDateKey(new Date(year, month, day))
    const eventSummary = events[dateKey]
    const isWeekend = weekdayIndex >= 5
    let isSchool = !isWeekend

    if (isSchool && eventSummary) {
      const lower = eventSummary.toLowerCase()
      if (OFF_DAY_KEYWORDS.some((kw) => lower.includes(kw))) {
        isSchool = false
      }
    }
    return isSchool
  }

  const navMonth = (delta: number) =>
    setViewDate(new Date(year, month + delta, 1))

  return (
    <section
      style={{
        borderRadius: '28px',
        background: theme.colors.surface,
        padding: '16px',
        border: `3px solid ${theme.colors.accent}`,
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Month nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={() => navMonth(-1)}
          aria-label="Previous month"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          ◀
        </button>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: theme.colors.text,
          }}
        >
          {monthLabel} {year}
        </span>
        <button
          type="button"
          onClick={() => navMonth(1)}
          aria-label="Next month"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          ▶
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}
      >
        {/* Weekday headers */}
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: theme.colors.primary,
              textAlign: 'center',
              paddingBottom: 4,
            }}
          >
            {d}
          </div>
        ))}

        {/* Empty leading cells */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const weekdayIndex = (firstDayOffset + i) % 7
          const isSchool = isDaySchool(day, weekdayIndex)
          const dateKey = buildDateKey(new Date(year, month, day))
          const isToday = dateKey === todayDateKey
          const icon = isSchool ? schoolIcon : nonSchoolIcon

          return (
            <div
              key={day}
              style={{
                aspectRatio: '1',
                borderRadius: '25%',
                position: 'relative',
                overflow: 'hidden',
                background: isSchool ? `${theme.colors.primary}18` : '#ffffff',
                border: isToday
                  ? `3px solid ${theme.colors.secondary}`
                  : '3px solid transparent',
                boxShadow: isToday
                  ? `0 0 0 2px ${theme.colors.secondary}88`
                  : undefined,
              }}
            >
              <img
                src={icon}
                alt={isSchool ? 'School' : 'Home'}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '12%',
                  opacity: 0.75,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: isToday ? theme.colors.secondary : theme.colors.text,
                  textShadow: '0 0 3px #fff, 0 0 3px #fff',
                }}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
