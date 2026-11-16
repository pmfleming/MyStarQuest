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

const getMondayFirstOffset = (date: Date) => (date.getDay() + 6) % 7

type SchoolCalendarProps = {
  theme: Theme
}

export default function SchoolCalendar({ theme }: SchoolCalendarProps) {
  const { selectedDateKey, setSelectedDateKey } = useSelectedDate()
  const { events, loadError, retry } = useSchoolCalendar()
  const schedule = useCalendarSchedule()
  const [historyView, setHistoryView] = useState<HistoryView>('all')
  const [period, setPeriod] = useState<HistoryPeriod>('day')
  const history = useCalendarHistory(selectedDateKey, period)
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
  const agenda = useMemo(
    () => getAgendaForDate(schedule, selectedDate, events),
    [schedule, selectedDate, events]
  )
  const schoolIcon = getThemeAsset(theme.id, 'schoolDayImage')

  return (
    <section
      className="box-border px-3 pt-3 pb-2.5"
      style={{
        borderRadius: `${uiTokens.surfaceRadius}px`,
        background: theme.colors.surface,
        border: `3px solid ${theme.colors.accent}`,
        fontFamily: theme.fonts.heading,
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
        onPeriodChange={setPeriod}
        agenda={
          <div role="group" aria-label="Day agenda">
            <section aria-label={`Agenda for ${selectedDateKey}`}>
              <SchoolEvents day={events[selectedDateKey]} theme={theme} />
              <TheatreEvents dateKey={selectedDateKey} theme={theme} />
              <DayAgenda theme={theme} agenda={agenda} />
            </section>
          </div>
        }
      >
        {/* Grid */}
        <div
          className="school-calendar-grid [container-type:inline-size] isolate grid w-full gap-[3px]"
          data-period={calendarPeriod}
          role="group"
          aria-label={`${calendarPeriod.charAt(0).toUpperCase() + calendarPeriod.slice(1)} calendar`}
        >
          <div
            className="calendar-weekday-row grid gap-[3px]"
            style={{
              gridTemplateColumns: dateColumns,
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
            className="calendar-date-grid grid w-full gap-[3px]"
            style={{
              gridTemplateColumns: dateColumns,
              gridTemplateRows: `repeat(${calendarPeriod === 'month' ? monthRows : 1}, minmax(0, 1fr))`,
              height: `calc((100cqw - 18px) / 7 * ${monthRows} + ${(monthRows - 1) * 3}px - var(--calendar-weekday-growth))`,
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
                  className="calendar-date relative min-h-0 min-w-0 cursor-pointer overflow-hidden border-[3px] border-solid p-0"
                  data-illustrated={hasIllustration}
                  style={{
                    background: isSchool
                      ? `${theme.colors.primary}18`
                      : '#ffffff',
                    borderColor: highlight.color,
                    boxShadow: highlight.glow && `0 0 0 2px ${highlight.glow}`,
                    color: theme.colors.text,
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
                    className="calendar-date-artwork absolute inset-0 h-full w-full object-contain"
                  />
                  <span className="calendar-date-number absolute inset-0 flex items-center justify-center leading-none font-black">
                    {day}
                  </span>
                  {dayHistory.length > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 flex max-w-[70%] rounded-tr-[6px]"
                      style={{ background: theme.colors.surface }}
                    >
                      {[...new Set(dayHistory.map((entry) => entry.kind))].map(
                        (kind) => (
                          <img
                            key={kind}
                            src={historyIcon(theme, kind)}
                            alt=""
                            className="h-[14px] w-[14px] object-contain"
                          />
                        )
                      )}
                    </span>
                  )}
                  {schoolEvents.length + theatreEvents.length > 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 bottom-0 box-border flex h-[36%] max-h-[24px] w-[36%] max-w-[24px] rounded-tl-[6px] p-px"
                      style={{ background: theme.colors.surface }}
                    >
                      <img
                        src={getThemeAsset(theme.id, 'calendarMoreIcon')}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </CalendarActivityHistory>
    </section>
  )
}
