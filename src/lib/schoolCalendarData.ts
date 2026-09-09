import { z } from 'zod'
import { CACHE_KEY, CACHE_TS_KEY, CACHE_TTL_MS } from './schoolCalendarCache'

const CALENDAR_URL = 'https://getschoolcalendar-6ujocyt4pq-uc.a.run.app'
const calendarSchema = z.record(
  z.iso.date(),
  z.object({ isNonSchoolDay: z.boolean() })
)
export type SchoolCalendarData = z.infer<typeof calendarSchema>

const readCache = (): SchoolCalendarData | undefined => {
  try {
    const timestamp = Number(localStorage.getItem(CACHE_TS_KEY))
    const age = Date.now() - timestamp
    if (!timestamp || !Number.isFinite(age) || age < 0 || age >= CACHE_TTL_MS)
      return
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return
    const parsed = calendarSchema.safeParse(JSON.parse(raw) as unknown)
    return parsed.success ? parsed.data : undefined
  } catch {
    // Storage may be unavailable or contain incomplete data; use the network.
    return undefined
  }
}

export async function loadSchoolCalendar(
  signal: AbortSignal
): Promise<SchoolCalendarData> {
  const cached = readCache()
  if (cached) return cached
  const response = await fetch(CALENDAR_URL, { signal })
  if (!response.ok)
    throw new Error(`Calendar request failed (${response.status})`)
  const payload: unknown = await response.json()
  const events = calendarSchema.parse(payload)
  signal.throwIfAborted()
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(events))
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  } catch {
    // A valid response remains usable when storage is blocked or full.
  }
  return events
}
