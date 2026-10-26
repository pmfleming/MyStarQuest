import CalendarActivityHistory from './CalendarActivityHistory'
import { historyIcon } from '../ui/calendarHistoryAssets'
import { useCalendarHistory } from '../hooks/useCalendarHistory'
import {
  historyRange,
  type HistoryPeriod,
  type HistoryView,
} from '../lib/calendarHistory'
import { getThemeAsset } from '../ui/themeAssets'
import { getNonSchoolDayImages } from '../ui/seasonAssets'
import { useMemo, useState } from 'react'
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

import CalendarWeekdays from './CalendarWeekdays'
import './SchoolCalendar.css'

const getMondayFirstOffset = (date: Date) => {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

type SchoolCalendarProps = {
  theme: Theme
}

export default function SchoolCalendar({ theme }: SchoolCalendarProps) {
  const { selectedDateKey, setSelectedDateKey } = useSelectedDate()
  const { events, loadError, retry } = useSchoolCalendar()
  const schedule = useCalendarSchedule()
  const history = useCalendarHistory()
  const [historyView, setHistoryView] = useState<HistoryView>('all')
  const [taskPeriod, setTaskPeriod] = useState<HistoryPeriod>('day')
  const [rewardPeriod, setRewardPeriod] = useState<HistoryPeriod>('day')
  const period = historyView === 'rewards' ? rewardPeriod : taskPeriod
  const historyEntries = history.entries
  const historyByDay = useMemo(() => {
    const days = new Map<string, typeof historyEntries>()
    for (const entry of historyEntries) {
      if (
        historyView === 'completed'
          ? entry.kind === 'rewards'
          : historyView !== 'all' && entry.kind !== historyView
      )
        continue
      days.set(entry.dateKey, [...(days.get(entry.dateKey) ?? []), entry])
    }
    return days
  }, [historyEntries, historyView])
  const selectedDate = useMemo(
    () => parseDateKey(selectedDateKey),
    [selectedDateKey]
  )
  const todayDateKey = getTodayDescriptor().dateKey
  const calendarPeriod = period === 'year' ? 'month' : period
  // Nine of 21 shares is three ordinary day widths; the other six share the rest.
  const dateColumns =
    calendarPeriod === 'day'
      ? 'minmax(0, 1fr)'
      : Array.from(
          { length: 7 },
          (_, index) =>
            `minmax(0, ${
              calendarPeriod === 'week'
                ? index === getMondayFirstOffset(selectedDate)
                  ? 9
                  : 2
                : 3
            }fr)`
        ).join(' ')
  const monthStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  )
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate()
  const monthRows = Math.ceil(
    (getMondayFirstOffset(monthStart) + daysInMonth) / 7
  )
  const dates = useMemo(() => {
    const { start, end } = historyRange(selectedDateKey, calendarPeriod)
    const days: Date[] = []
    for (
      const date = parseDateKey(start);
      buildDateKey(date) <= end;
      date.setDate(date.getDate() + 1)
    ) {
      days.push(new Date(date))
    }
    return days
  }, [selectedDateKey, calendarPeriod])
  const firstDayOffset =
    calendarPeriod === 'month'
      ? getMondayFirstOffset(dates[0] ?? selectedDate)
      : 0
  const slotCount =
    calendarPeriod === 'month'
      ? Math.ceil((firstDayOffset + dates.length) / 7) * 7
      : dates.length
  const agendaDays = useMemo(
    () =>
      dates
        .map((date) => ({
          date,
          dateKey: buildDateKey(date),
          agenda: getAgendaForDate(schedule, date, events),
        }))
        .filter(
          ({ dateKey, agenda }) =>
            calendarPeriod === 'day' ||
            agenda.length > 0 ||
            getSchoolEvents(events[dateKey]).length > 0 ||
            getTheatreEvents(dateKey).length > 0
        ),
    [dates, schedule, events, calendarPeriod]
  )
  const schoolIcon = getThemeAsset(theme.id, 'schoolDayImage')

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
      <CalendarActivityHistory
        theme={theme}
        {...history}
        view={historyView}
        onViewChange={setHistoryView}
        period={period}
        onPeriodChange={
          historyView === 'rewards' ? setRewardPeriod : setTaskPeriod
        }
      >
        {/* Grid */}
        <div
          className="school-calendar-grid"
          data-period={calendarPeriod}
          role="group"
          aria-label={`${calendarPeriod.charAt(0).toUpperCase() + calendarPeriod.slice(1)} calendar`}
          style={{
            display: 'grid',
            width: '100%',
            containerType: 'inline-size',
            gap: 3,
            isolation: 'isolate',
          }}
        >
          <div
            className="calendar-weekday-row"
            style={{
              display: 'grid',
              gridTemplateColumns: dateColumns,
              gap: 3,
            }}
          >
            <CalendarWeekdays
              theme={theme}
              dayOfWeek={
                calendarPeriod === 'day' ? selectedDate.getDay() : undefined
              }
              highlightedDayOfWeek={
                calendarPeriod !== 'month' ? selectedDate.getDay() : undefined
              }
            />
          </div>
          <div
            className="calendar-date-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: dateColumns,
              gridTemplateRows: `repeat(${calendarPeriod === 'month' ? monthRows : 1}, minmax(0, 1fr))`,
              height: `calc((100cqw - 18px) / 7 * ${monthRows} + ${(monthRows - 1) * 3}px - var(--calendar-weekday-growth))`,
              gap: 3,
              width: '100%',
            }}
          >
            {/* One cell per slot keeps leading and trailing padding consistent. */}
            {Array.from({ length: slotCount }, (_, index) => {
              const date = dates[index - firstDayOffset]
              if (!date) {
                return <div key={index} />
              }
              const day = date.getDate()
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
                    : getNonSchoolDayImages(theme.id)[getSeasonForDate(date)]
              const dayHistory = historyByDay.get(dateKey) ?? []
              const description = [
                isSchool ? 'School day' : 'Day off',
                ...schoolEvents.map(({ titleEn }) => titleEn),
                ...theatreEvents.map(({ title }) => title),
                ...dayHistory.map(
                  (entry) =>
                    `${entry.title}: ${entry.kind === 'rewards' ? 'reward granted' : 'completed'}`
                ),
              ].join(' · ')
              const highlight = isSelected
                ? {
                    color: theme.colors.accent,
                    glow: `${theme.colors.accent}44`,
                  }
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
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: calendarPeriod === 'month' ? '25%' : 18,
                    position: 'relative',
                    transform:
                      isSelected && calendarPeriod === 'month'
                        ? 'scale(1.16)'
                        : undefined,
                    zIndex: isSelected ? 1 : undefined,
                    overflow: 'hidden',
                    background: isSchool
                      ? `${theme.colors.primary}18`
                      : '#ffffff',
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
                      padding: calendarPeriod === 'month' ? '10%' : 4,
                      opacity: hasIllustration ? 1 : 0.75,
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems:
                        hasIllustration || calendarPeriod !== 'month'
                          ? 'flex-start'
                          : 'center',
                      justifyContent: hasIllustration ? 'flex-start' : 'center',
                      padding:
                        calendarPeriod !== 'month'
                          ? '6px 2px'
                          : hasIllustration
                            ? '2px'
                            : undefined,
                      fontSize:
                        calendarPeriod === 'day'
                          ? '2rem'
                          : calendarPeriod === 'week' && !isSelected
                            ? 'clamp(0.85rem, 4cqw, 1.2rem)'
                            : hasIllustration
                              ? '0.85rem'
                              : '1.2rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      color: theme.colors.text,
                      textShadow: '0 0 3px #fff, 0 0 3px #fff',
                    }}
                  >
                    {day}
                  </span>
                  {dayHistory.length > 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        display: 'flex',
                        background: theme.colors.surface,
                        borderRadius: '0 6px 0 0',
                        maxWidth: '70%',
                      }}
                    >
                      {[...new Set(dayHistory.map((entry) => entry.kind))].map(
                        (kind) => (
                          <img
                            key={kind}
                            src={historyIcon(theme, kind)}
                            alt=""
                            style={{
                              width: 14,
                              height: 14,
                              objectFit: 'contain',
                            }}
                          />
                        )
                      )}
                    </span>
                  )}
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
        </div>
      </CalendarActivityHistory>
      {historyView === 'all' && (
        <div
          role="group"
          aria-label={`${calendarPeriod.charAt(0).toUpperCase() + calendarPeriod.slice(1)} agenda`}
        >
          {agendaDays.map(({ date, dateKey, agenda }) => (
            <section key={dateKey} aria-label={`Agenda for ${dateKey}`}>
              {calendarPeriod !== 'day' && (
                <h4
                  className="calendar-history__day"
                  style={{ color: theme.colors.text }}
                >
                  <time dateTime={dateKey}>
                    {date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </time>
                </h4>
              )}
              <SchoolEvents day={events[dateKey]} theme={theme} />
              <TheatreEvents dateKey={dateKey} theme={theme} />
              {(agenda.length > 0 || calendarPeriod === 'day') && (
                <DayAgenda theme={theme} agenda={agenda} />
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
