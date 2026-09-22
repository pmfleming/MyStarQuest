import { z } from 'zod'
import { CACHE_KEY, CACHE_TS_KEY, SNAPSHOT_KEY } from './schoolCalendarCache'
import { classifySchoolEvent } from '../../functions/src/schoolEventCatalog'

const CALENDAR_URL = 'https://getschoolcalendar-6ujocyt4pq-uc.a.run.app'
export const calendarSchema = z.record(
  z.iso.date(),
  z.object({
    isNonSchoolDay: z.boolean(),
    summaries: z.array(z.string()).optional(),
    hasAllDayEvent: z.boolean().optional(),
    events: z
      .array(
        z.object({
          id: z.string(),
          summary: z.string(),
          allDay: z.boolean(),
          start: z.iso.datetime(),
          end: z.iso.datetime(),
        })
      )
      .optional(),
  })
)
export type SchoolCalendarData = z.infer<typeof calendarSchema>
export type SchoolCalendarDay = SchoolCalendarData[string]

export const getSchoolEvents = (day?: SchoolCalendarDay) => {
  if (day?.events?.length)
    return day.events.map((event) => ({
      ...event,
      ...classifySchoolEvent(event.summary),
    }))
  return (day?.summaries ?? []).map((summary, index) => ({
    id: `summary-${index}`,
    summary,
    ...classifySchoolEvent(summary),
    allDay: undefined,
    start: undefined,
    end: undefined,
  }))
}

export const getSchoolReleaseTime = (day?: SchoolCalendarDay) =>
  getSchoolEvents(day)
    .map(({ releaseTime }) => releaseTime)
    .filter((time) => time !== undefined)
    .sort()[0]

export const normalizeCalendar = (
  data: SchoolCalendarData
): SchoolCalendarData =>
  Object.fromEntries(
    Object.entries(data).map(([date, day]) => {
      // Repair the old service's all-day = holiday rule while it is still deployed.
      if (!day.summaries?.length && !day.events?.length) return [date, day]
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
      return [
        date,
        {
          ...day,
          isNonSchoolDay:
            weekday === 0 ||
            weekday === 6 ||
            getSchoolEvents(day).some(({ kind }) => kind === 'day-off'),
        },
      ]
    })
  )

export type SchoolCalendarSnapshot = {
  data: SchoolCalendarData
  checkedAt: number
}

export const parseCalendarSnapshot = (
  value: unknown
): SchoolCalendarSnapshot => {
  const snapshot = z
    .object({
      data: calendarSchema,
      checkedAt: z.number().finite().nonnegative(),
    })
    .parse(value)
  return { ...snapshot, data: normalizeCalendar(snapshot.data) }
}

export const readSavedSchoolCalendar = ():
  SchoolCalendarSnapshot | undefined => {
  try {
    const saved = localStorage.getItem(SNAPSHOT_KEY)
    if (saved) {
      try {
        return parseCalendarSnapshot(JSON.parse(saved))
      } catch {
        /* Try the legacy cache. */
      }
    }
    const timestamp = Number(localStorage.getItem(CACHE_TS_KEY))
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const data: unknown = JSON.parse(raw)
    return parseCalendarSnapshot({
      data,
      checkedAt: Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0,
    })
  } catch {
    // Storage may be unavailable or contain incomplete data; use the network.
    return undefined
  }
}

export const saveSchoolCalendar = (snapshot: SchoolCalendarSnapshot) => {
  try {
    // One write keeps the calendar and its successful check time together.
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    /* The in-memory and bundled copies remain usable. */
  }
}

export async function fetchSchoolCalendar(
  signal: AbortSignal
): Promise<SchoolCalendarSnapshot> {
  signal.throwIfAborted()
  const response = await fetch(CALENDAR_URL, { signal, cache: 'no-store' })
  if (!response.ok)
    throw new Error(`Calendar request failed (${response.status})`)
  const data = normalizeCalendar(calendarSchema.parse(await response.json()))
  signal.throwIfAborted()
  return { data, checkedAt: Date.now() }
}
