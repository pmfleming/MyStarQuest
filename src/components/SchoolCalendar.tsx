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
import {
  loadSchoolCalendar,
  type SchoolCalendarData,
} from '../lib/schoolCalendarData'
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

const isWeekend = (date: Date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}

type SchoolCalendarProps = {
  theme: Theme
}

export default function SchoolCalendar({ theme }: SchoolCalendarProps) {
  const { selectedDateKey, setSelectedDateKey } = useSelectedDate()
  const [events, setEvents] = useState<SchoolCalendarData>({})
  const [loadError, setLoadError] = useState(false)
  const [request, setRequest] = useState(0)
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

  useEffect(() => {
    const controller = new AbortController()
    void loadSchoolCalendar(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setEvents(data)
        setLoadError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [request])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const firstDayOffset = getMondayFirstOffset(new Date(year, month, 1))
  const weekCount = Math.ceil((firstDayOffset + daysInMonth) / 7)
  const trailingDayOffset = weekCount * 7 - firstDayOffset - daysInMonth

  const monthLabel = viewDate.toLocaleString('default', { month: 'long' })

  const season = useMemo(() => getSeasonForDate(viewDate), [viewDate])
  const schoolIcon = getThemeAsset(theme.id, 'schoolDayImage')
  const nonSchoolIcon = getNonSchoolDayImages(theme.id)[season]

  const isDaySchool = (day: number) => {
    const date = new Date(year, month, day)

    if (isWeekend(date)) return false

    if (events[buildDateKey(date)]?.isNonSchoolDay) return false

    return true
  }

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
          Holiday dates could not be loaded. Only weekends are marked as
          non-school days.
          <button
            type="button"
            onClick={() => {
              setLoadError(false)
              setRequest((value) => value + 1)
            }}
          >
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
        }}
      >
        {/* Weekday headers */}
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              color: theme.colors.primary,
              textAlign: 'center',
              paddingBottom: 2,
            }}
          >
            {d}
          </div>
        ))}

        {/* Empty leading cells */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div
            key={`pad-${i}`}
            style={{
              aspectRatio: '1',
              width: '100%',
            }}
          />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isSchool = isDaySchool(day)
          const dateKey = buildDateKey(new Date(year, month, day))
          const isToday = dateKey === todayDateKey
          const isSelected = dateKey === selectedDateKey
          const icon = isSchool ? schoolIcon : nonSchoolIcon

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDateKey(dateKey)}
              aria-pressed={isSelected}
              aria-label={`Select ${dateKey}`}
              style={{
                aspectRatio: '1',
                borderRadius: '25%',
                position: 'relative',
                overflow: 'hidden',
                background: isSchool ? `${theme.colors.primary}18` : '#ffffff',
                border: isSelected
                  ? `3px solid ${theme.colors.accent}`
                  : isToday
                    ? `3px solid ${theme.colors.secondary}`
                    : '3px solid transparent',
                boxShadow: isSelected
                  ? `0 0 0 2px ${theme.colors.accent}44`
                  : isToday
                    ? `0 0 0 2px ${theme.colors.secondary}88`
                    : undefined,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <img
                src={icon}
                alt={isSchool ? 'School' : 'Home'}
                loading="lazy"
                decoding="async"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '10%',
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
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: isSelected
                    ? theme.colors.accent
                    : isToday
                      ? theme.colors.secondary
                      : theme.colors.text,
                  textShadow: '0 0 3px #fff, 0 0 3px #fff',
                }}
              >
                {day}
              </span>
            </button>
          )
        })}

        {/* Empty trailing cells */}
        {Array.from({ length: trailingDayOffset }).map((_, i) => (
          <div
            key={`trail-${i}`}
            style={{
              aspectRatio: '1',
              width: '100%',
            }}
          />
        ))}
      </div>
    </section>
  )
}
