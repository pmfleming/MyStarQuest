import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { useSelectedDate } from '../contexts/SelectedDateContext'
import type { HistoryPeriod } from '../lib/calendarHistory'
import { getTodayDescriptor, parseDateKey } from '../lib/today'
import { calendarWeekdays } from '../ui/calendarWeekdayAssets'
import './CalendarDateControl.css'

const periods = ['month', 'week', 'day'] as const
const monthName = (date: Date) =>
  date.toLocaleDateString('en-GB', { month: 'long' })

export default function CalendarDateControl({
  theme,
  period,
  onPeriodChange,
  children,
}: {
  theme: Theme
  period: HistoryPeriod
  onPeriodChange: (period: HistoryPeriod) => void
  children?: ReactNode
}) {
  const { selectedDateKey } = useSelectedDate()
  const date = parseDateKey(selectedDateKey)
  const todayKey = getTodayDescriptor().dateKey
  const today = parseDateKey(todayKey)
  const weekday = calendarWeekdays[(date.getDay() + 6) % 7]!
  const portrait = theme.id === 'teenie' ? weekday.portrait : weekday.symbol
  const badge = (day: (typeof calendarWeekdays)[number]) =>
    theme.id === 'teenie' ? day.ping : day.symbol
  const fullDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate()
  const monthOffset =
    (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7

  const chooseWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? 2
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (index + 1) % 3
            : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
              ? (index + 2) % 3
              : undefined
    if (next === undefined) return
    event.preventDefault()
    onPeriodChange(periods[next]!)
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus()
  }

  return (
    <div
      className="character-calendar"
      data-period={period}
      data-theme={theme.id}
      style={
        {
          '--calendar-month-rows': Math.ceil((monthOffset + daysInMonth) / 7),
          '--character-primary': theme.colors.primary,
          '--character-secondary': theme.colors.secondary,
          '--character-accent': theme.colors.accent,
          '--character-surface': theme.colors.surface,
          '--character-tint': `${theme.colors.primary}0c`,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
        } as CSSProperties
      }
    >
      <div
        className="character-calendar__periods"
        role="radiogroup"
        aria-label="History period"
      >
        {periods.map((value, index) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={period === value}
            aria-label={value.charAt(0).toUpperCase() + value.slice(1)}
            tabIndex={period === value ? 0 : -1}
            onKeyDown={(event) => chooseWithKeyboard(event, index)}
            onClick={() => onPeriodChange(value)}
          >
            <span
              className={`character-calendar__preview character-calendar__preview--${value}`}
              aria-hidden="true"
            >
              {value === 'day' ? (
                <img src={badge(weekday)} alt="" />
              ) : value === 'week' ? (
                calendarWeekdays.map((day) => (
                  <img key={day.day} src={badge(day)} alt="" />
                ))
              ) : (
                <>
                  <img src={portrait} alt="" />
                  <span className="character-calendar__mini-month">
                    {Array.from({ length: monthOffset }, (_, i) => (
                      <i key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <b key={i} data-selected={i + 1 === date.getDate()} />
                    ))}
                  </span>
                </>
              )}
            </span>
            <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
          </button>
        ))}
      </div>

      <time
        dateTime={selectedDateKey}
        aria-label="Calendar date"
        aria-live="polite"
        className="sr-only"
      >
        {fullDate}
      </time>

      {period === 'day' || !children ? (
        <div className="character-calendar__hero" aria-label={fullDate}>
          <strong className="character-calendar__day-number">
            {date.getDate()}
          </strong>
          <img className="character-calendar__portrait" src={portrait} alt="" />
          <div className="character-calendar__sticker">
            <svg
              className="character-calendar__month-frame"
              viewBox="0 0 400 120"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              {theme.id === 'teenie' ? (
                <>
                  <path
                    className="character-calendar__month-panel"
                    d="M42 27 Q58 10 86 24 Q139 13 200 24 Q261 13 314 24 Q342 10 358 27 Q389 24 388 54 Q404 73 383 89 Q379 113 349 108 Q276 118 200 111 Q124 118 51 108 Q21 113 17 89 Q-4 73 12 54 Q11 24 42 27Z"
                  />
                  <path
                    className="character-calendar__month-heart"
                    d="M200 34 C165 15 184 -2 200 12 C216 -2 235 15 200 34Z"
                  />
                  <path
                    className="character-calendar__month-sparkles"
                    d="M29 45 L33 57 L43 61 L33 65 L29 77 L25 65 L15 61 L25 57Z M371 45 L375 57 L385 61 L375 65 L371 77 L367 65 L357 61 L367 57Z"
                  />
                </>
              ) : (
                <>
                  <path
                    className="character-calendar__month-ribbon"
                    d="M40 39 L4 34 L15 67 L4 100 L48 91 M360 39 L396 34 L385 67 L396 100 L352 91"
                  />
                  <path
                    className="character-calendar__month-panel"
                    d="M45 26 Q200 8 355 26 L361 100 Q200 119 39 100Z"
                  />
                  <path
                    className="character-calendar__month-crown"
                    d="M176 27 L170 5 L188 16 L200 1 L212 16 L230 5 L224 27Z"
                  />
                </>
              )}
            </svg>
            <span>{monthName(date)}</span>
            {date.getFullYear() !== today.getFullYear() && (
              <small>{date.getFullYear()}</small>
            )}
          </div>
        </div>
      ) : null}
      {children && (
        <div className="character-calendar__calendar" hidden={period === 'day'}>
          {children}
        </div>
      )}
    </div>
  )
}
