const CACHE_KEY = 'schoolCalendar:v8'
const CACHE_TS_KEY = 'schoolCalendarTs:v8'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export { CACHE_KEY, CACHE_TS_KEY, CACHE_TTL_MS }

export function clearSchoolCalendarCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_TS_KEY)
}
