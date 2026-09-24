import { getThemeAsset } from '../ui/themeAssets'
import { getNonSchoolDayImages } from '../ui/seasonAssets'
import { useEffect, useMemo, useState } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { useSelectedDate } from '../contexts/SelectedDateContext'
import {
  getSeasonForDate,
  buildDateKey,
  getTodayDescriptor,
  parseDateKey,
} from '../lib/today'
import { useSchoolCalendar } from '../hooks/useSchoolCalendar'
import { useCalendarSchedule } from '../hooks/useCalendarSchedule'
import { getAgendaForDate, isSchoolDate } from '../lib/calendarSchedule'
import DayAgenda from './DayAgenda'
import SchoolEvents from './SchoolEvents'
import TheatreEvents from './TheatreEvents'
import { getTheatreEvents } from '../lib/theatreEvents'
import { getTheatreEventImage } from '../ui/theatreEventAssets'
import { getSchoolEvents } from '../lib/schoolCalendarData'
import { getSchoolEventImage } from '../ui/schoolEventAssets'
import { uiTokens } from '../tokens'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const getMondayFirstOffset = (date: Date) => {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

const getClampedMonthDate = (date: Date, monthDelta: number) => {
  const targetYear = date.getFullYear()
  const targetMonth = date.getMonth() + monthDelta
  const targetDay = date.getDate()
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()

  return new Date(
    targetYear,
    targetMonth,
    Math.min(targetDay, daysInTargetMonth),
    12,
    0,
    0,
    0
  )
}

type SchoolCalendarProps = {
  theme: Theme
}

export default function SchoolCalendar({ theme }: SchoolCalendarProps) {
  const { selectedDateKey, setSelectedDateKey } = useSelectedDate()
  const { events, loadError, retry } = useSchoolCalendar()
  const schedule = useCalendarSchedule()
  const selectedDate = useMemo(
    () => parseDateKey(selectedDateKey),
    [selectedDateKey]
  )
  const agenda = useMemo(
    () => getAgendaForDate(schedule, selectedDate, events),
    [schedule, selectedDate, events]
  )
  const [viewDate, setViewDate] = useState(() => parseDateKey(selectedDateKey))
  const todayDateKey = getTodayDescriptor().dateKey

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setViewDate((currentDate) => {
        const selectedDate = parseDateKey(selectedDateKey)
        const sameMonth =
          currentDate.getFullYear() === selectedDate.getFullYear() &&
          currentDate.getMonth() === selectedDate.getMonth()

        return sameMonth ? currentDate : selectedDate
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedDateKey])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const firstDayOffset = getMondayFirstOffset(new Date(year, month, 1))
  const weekCount = Math.ceil((firstDayOffset + daysInMonth) / 7)

  const monthLabel = viewDate.toLocaleString('en-GB', { month: 'long' })

  const season = useMemo(() => getSeasonForDate(viewDate), [viewDate])
  const schoolIcon = getThemeAsset(theme.id, 'schoolDayImage')
  const nonSchoolIcon = getNonSchoolDayImages(theme.id)[season]

  const navMonth = (delta: number) => {
    const selectedDate = parseDateKey(selectedDateKey)
    const nextDate = getClampedMonthDate(selectedDate, delta)

    setSelectedDateKey(buildDateKey(nextDate))
    setViewDate(nextDate)
  }

  return (
    <section
      style={{
        borderRadius: `${uiTokens.surfaceRadius}px`,
        background: theme.colors.surface,
        padding: '12px 12px 10px',
        border: `3px solid ${theme.colors.accent}`,
        fontFamily: theme.fonts.heading,
        boxSizing: 'border-box',
      }}
    >
      {loadError && (
        <div role="alert">
          <span>
            {Object.keys(events).length
              ? 'Saved calendar'
              : 'Calendar unavailable.'}
          </span>{' '}
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {/* Month nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => navMonth(-1)}
          aria-label="Previous month"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.15rem',
            cursor: 'pointer',
            padding: 2,
          }}
        >
          ◀
        </button>
        <span
          style={{
            fontWeight: 800,
            fontSize: '1rem',
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
            fontSize: '1.15rem',
            cursor: 'pointer',
            padding: 2,
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
          gap: 3,
          isolation: 'isolate',
        }}
      >
        {/* Weekday headers */}
        {WEEKDAY_LABELS.map((d, index) => (
          <div
            key={d}
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: '0.9rem',
              fontWeight: 900,
              lineHeight: 1.4,
              color: index >= 5 ? theme.colors.secondary : theme.colors.text,
              textShadow: `0 1px 0 ${theme.colors.accent}66`,
              textAlign: 'center',
              paddingBlock: '4px 6px',
            }}
          >
            {d}
          </div>
        ))}

        {/* One cell per slot keeps leading and trailing padding consistent. */}
        {Array.from({ length: weekCount * 7 }, (_, index) => {
          const day = index - firstDayOffset + 1
          if (day < 1 || day > daysInMonth) {
            return (
              <div key={index} style={{ aspectRatio: '1', width: '100%' }} />
            )
          }
          const date = new Date(year, month, day)
          const dateKey = buildDateKey(date)
          const isSchool = isSchoolDate(date, events)
          const isToday = dateKey === todayDateKey
          const isSelected = dateKey === selectedDateKey
          const schoolEvents = getSchoolEvents(events[dateKey])
          const theatreEvents = getTheatreEvents(dateKey)
          const illustrated = schoolEvents.find(({ artwork }) => artwork)
          const theatreIllustration = theatreEvents[0]
          const hasIllustration = !!illustrated || !!theatreIllustration
          const icon = illustrated?.artwork
            ? getSchoolEventImage(theme.id, illustrated.artwork)
            : theatreIllustration
              ? getTheatreEventImage(theatreIllustration.id)
              : isSchool
                ? schoolIcon
                : nonSchoolIcon
          const description = [
            isSchool ? 'School day' : 'Day off',
            ...schoolEvents.map(({ titleEn }) => titleEn),
            ...theatreEvents.map(({ title }) => title),
          ].join(' · ')
          const highlight = isSelected
            ? { color: theme.colors.accent, glow: `${theme.colors.accent}44` }
            : isToday
              ? {
                  color: theme.colors.secondary,
                  glow: `${theme.colors.secondary}88`,
                }
              : { color: 'transparent', glow: undefined }

          return (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedDateKey(dateKey)}
              aria-pressed={isSelected}
              aria-label={`Select ${dateKey}`}
              aria-description={description}
              title={description}
              style={{
                aspectRatio: '1',
                borderRadius: '25%',
                position: 'relative',
                transform: isSelected ? 'scale(1.16)' : undefined,
                zIndex: isSelected ? 1 : undefined,
                overflow: 'hidden',
                background: isSchool ? `${theme.colors.primary}18` : '#ffffff',
                border: `3px solid ${highlight.color}`,
                boxShadow: highlight.glow && `0 0 0 2px ${highlight.glow}`,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <img
                src={icon}
                alt={
                  illustrated?.titleEn ??
                  theatreIllustration?.title ??
                  (isSchool ? 'School' : 'Home')
                }
                loading="lazy"
                decoding="async"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '10%',
                  opacity: hasIllustration ? 1 : 0.75,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: hasIllustration ? 'flex-start' : 'center',
                  justifyContent: hasIllustration ? 'flex-start' : 'center',
                  padding: hasIllustration ? '2px' : undefined,
                  fontSize: hasIllustration ? '0.85rem' : '1.2rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: theme.colors.text,
                  textShadow: '0 0 3px #fff, 0 0 3px #fff',
                }}
              >
                {day}
              </span>
              {schoolEvents.length + theatreEvents.length > 1 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    borderRadius: '6px 0 0 0',
                    background: theme.colors.surface,
                    width: '36%',
                    height: '36%',
                    maxWidth: 24,
                    maxHeight: 24,
                    padding: 1,
                    boxSizing: 'border-box',
                  }}
                >
                  <img
                    src={getThemeAsset(theme.id, 'calendarMoreIcon')}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <SchoolEvents day={events[selectedDateKey]} theme={theme} />
      <TheatreEvents dateKey={selectedDateKey} theme={theme} />
      <DayAgenda theme={theme} agenda={agenda} />
    </section>
  )
}
