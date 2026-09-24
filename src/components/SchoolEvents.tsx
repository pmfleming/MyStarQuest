import type { Theme } from '../contexts/ThemeContext'
import {
  getSchoolEvents,
  type SchoolCalendarDay,
} from '../lib/schoolCalendarData'
import { getSchoolEventImage } from '../ui/schoolEventAssets'
import AgendaList, { type AgendaTiming } from './AgendaList'

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
const eventTiming = (
  event: ReturnType<typeof getSchoolEvents>[number]
): AgendaTiming => {
  if (event.kind === 'early-finish' && event.releaseTime)
    return { kind: 'single', time: event.releaseTime }
  if (event.allDay || (event.kind === 'day-off' && !event.start && !event.end))
    return { kind: 'all-day' }
  if (!event.start || !event.end) return { kind: 'unknown' }
  const start = new Date(event.start)
  const end = new Date(event.end)
  if (start.getTime() === end.getTime())
    return { kind: 'single', time: timeFormat.format(start) }
  const spansDates = dateKeyFormat.format(start) !== dateKeyFormat.format(end)
  return {
    kind: 'range',
    start: timeFormat.format(start),
    end: timeFormat.format(end),
    startDate: spansDates ? dateFormat.format(start) : undefined,
    endDate: spansDates ? dateFormat.format(end) : undefined,
  }
}

export default function SchoolEvents({
  day,
  theme,
}: {
  day?: SchoolCalendarDay
  theme: Theme
}) {
  return (
    <AgendaList
      theme={theme}
      label="School events"
      entries={getSchoolEvents(day).map((event) => ({
        id: event.id,
        title: event.titleEn,
        image: event.artwork
          ? getSchoolEventImage(theme.id, event.artwork)
          : undefined,
        subtitle: event.kind === 'early-finish' ? 'Early finish' : undefined,
        timing: eventTiming(event),
        background: `${theme.colors.accent}20`,
      }))}
    />
  )
}
