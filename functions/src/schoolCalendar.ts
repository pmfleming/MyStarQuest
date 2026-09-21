import type { CalendarResponse, VEvent } from 'node-ical'
import { classifySchoolEvent } from './schoolEventCatalog'

type CalendarDay = {
  summaries: string[]
  hasAllDayEvent: boolean
  isNonSchoolDay: boolean
  events: {
    id: string
    summary: string
    allDay: boolean
    start: string
    end: string
  }[]
}

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Amsterdam',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const appendDay = (
  calendar: Record<string, CalendarDay>,
  date: Date,
  summary: string,
  entry: CalendarDay['events'][number]
) => {
  const key = dateFormatter.format(date)
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay()
  const day = (calendar[key] ??= {
    summaries: [],
    hasAllDayEvent: false,
    isNonSchoolDay: weekday === 0 || weekday === 6,
    events: [],
  })
  if (!day.summaries.includes(summary)) day.summaries.push(summary)
  day.hasAllDayEvent ||= entry.allDay
  day.isNonSchoolDay ||= classifySchoolEvent(summary).kind === 'day-off'
  if (!day.events.some(({ id }) => id === entry.id)) day.events.push(entry)
}

const appendOccurrence = (
  calendar: Record<string, CalendarDay>,
  event: VEvent,
  start: Date,
  end: Date
) => {
  const summary =
    typeof event.summary === 'string'
      ? event.summary
      : (event.summary?.val ?? 'School Event')
  const allDay = event.datetype === 'date'
  const entry = {
    id: `${event.uid}:${start.toISOString()}`,
    summary,
    allDay,
    start: start.toISOString(),
    end: end.toISOString(),
  }
  // Iterate calendar dates at UTC noon so DST changes cannot skip/repeat a day.
  // Subtract 1ms to respect exclusive iCal ends, including timed midnight ends.
  const firstKey = dateFormatter.format(start)
  const exclusiveEnd = allDay
    ? new Date(`${dateFormatter.format(end)}T12:00:00Z`)
    : new Date(end)
  if (allDay) exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() - 1)
  else exclusiveEnd.setTime(exclusiveEnd.getTime() - 1)
  const lastKey = end > start ? dateFormatter.format(exclusiveEnd) : firstKey
  const current = new Date(`${firstKey}T12:00:00Z`)
  while (dateFormatter.format(current) <= lastKey) {
    appendDay(calendar, current, summary, entry)
    current.setUTCDate(current.getUTCDate() + 1)
  }
}

export const buildSchoolCalendar = (
  events: CalendarResponse,
  now = new Date()
): Record<string, CalendarDay> => {
  const calendar: Record<string, CalendarDay> = {}
  const nextYear = new Date(
    now.getFullYear() + 1,
    now.getMonth(),
    now.getDate()
  )

  for (const event of Object.values(events)) {
    if (!event || event.type !== 'VEVENT' || !event.start) continue
    const start = new Date(event.start)
    const end = new Date(event.end ?? event.start)
    appendOccurrence(calendar, event, start, end)
    const duration = end.getTime() - start.getTime()
    for (const occurrence of event.rrule?.between(now, nextYear) ?? []) {
      appendOccurrence(
        calendar,
        event,
        occurrence,
        new Date(occurrence.getTime() + duration)
      )
    }
  }
  return calendar
}

// Keep the deadline active through response.text(), including a stalled body.
export async function fetchSchoolCalendarText(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok)
    throw new Error(`Parro responded with HTTP ${response.status}`)
  return response.text()
}
