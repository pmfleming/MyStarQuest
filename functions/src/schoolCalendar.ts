import type { CalendarResponse, VEvent } from 'node-ical'

type CalendarDay = {
  summaries: string[]
  hasAllDayEvent: boolean
  isNonSchoolDay: boolean
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
  allDay: boolean
) => {
  const key = dateFormatter.format(date)
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay()
  const day = (calendar[key] ??= {
    summaries: [],
    hasAllDayEvent: false,
    isNonSchoolDay: weekday === 0 || weekday === 6,
  })
  if (!day.summaries.includes(summary)) day.summaries.push(summary)
  day.hasAllDayEvent ||= allDay
  day.isNonSchoolDay ||= allDay
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

  // iCal ends are exclusive. Preserve the existing 24-hour stepping rule.
  const current = new Date(start)
  while (current < end) {
    appendDay(calendar, current, summary, allDay)
    current.setUTCDate(current.getUTCDate() + 1)
  }
  // Also include zero-duration events on their local calendar date.
  if (dateFormatter.format(start) === dateFormatter.format(end)) {
    appendDay(calendar, end, summary, allDay)
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
