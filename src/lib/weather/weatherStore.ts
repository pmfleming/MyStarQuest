import type { WeatherCity } from './weatherData'
import {
  fetchCurrentWeather,
  isWeatherUsable,
  WEATHER_FRESH_MS,
  type CurrentWeather,
} from './weatherData'
import { weatherDateKey } from './weatherConditions'
import {
  readWeatherCache,
  writeWeatherCache,
  weatherCityKey,
} from './weatherCache'

export type WeatherSnapshot = {
  now: number
  data: CurrentWeather | null
  loading: boolean
  error: string | null
  stale: boolean
}

type Entry = {
  city: WeatherCity
  snapshot: WeatherSnapshot
  listeners: Set<() => void>
  controller?: AbortController
  interval?: ReturnType<typeof setInterval>
  lastAttempt: number | null
  lastDate: string
}

const entries = new Map<string, Entry>()

function entryFor(city: WeatherCity): Entry {
  const key = weatherCityKey(city)
  let entry = entries.get(key)
  if (!entry) {
    entry = {
      city,
      snapshot: {
        now: Date.now(),
        data: readWeatherCache(city),
        loading: false,
        error: null,
        stale: false,
      },
      listeners: new Set(),
      lastAttempt: null,
      lastDate: weatherDateKey(Date.now(), city.location.timeZone),
    }
    entries.set(key, entry)
  }
  return entry
}

function publish(entry: Entry, patch: Partial<WeatherSnapshot>) {
  const next = { ...entry.snapshot, ...patch }
  if (
    Object.entries(patch).every(([key, value]) =>
      Object.is(Reflect.get(entry.snapshot, key), value)
    )
  )
    return
  entry.snapshot = next
  entry.listeners.forEach((listener) => listener())
}

function usableWeather(entry: Entry, now = Date.now()) {
  const data = entry.snapshot.data
  return data && isWeatherUsable(data, entry.city.location.timeZone, now)
    ? data
    : null
}

async function refresh(entry: Entry, force = false) {
  const now = Date.now()
  const zone = entry.city.location.timeZone
  const date = weatherDateKey(now, zone)
  const dateChanged = date !== entry.lastDate
  entry.lastDate = date
  const usable = usableWeather(entry, now)
  const stale = Boolean(usable && now - usable.fetchedAt >= WEATHER_FRESH_MS)
  publish(entry, { now, data: usable, stale })
  if (entry.controller) return
  if (
    !force &&
    !dateChanged &&
    entry.lastAttempt !== null &&
    now - entry.lastAttempt < WEATHER_FRESH_MS &&
    now >= entry.lastAttempt
  )
    return
  if (!force && usable && !stale) return

  const controller = new AbortController()
  entry.controller = controller
  entry.lastAttempt = now
  publish(entry, { loading: true, error: null })
  const timeout = setTimeout(
    () => controller.abort(new Error('Weather request timed out')),
    15_000
  )
  try {
    const next = await fetchCurrentWeather(entry.city, controller.signal)
    if (entry.controller !== controller) return
    writeWeatherCache(entry.city, next)
    publish(entry, { data: next, stale: false, error: null })
  } catch {
    if (entry.controller !== controller) return
    const data = usableWeather(entry)
    publish(entry, {
      data,
      stale: Boolean(data),
      error: 'Could not update the weather.',
    })
  } finally {
    clearTimeout(timeout)
    if (entry.controller === controller) {
      entry.controller = undefined
      publish(entry, { loading: false })
    }
  }
}

export const getWeatherSnapshot = (city: WeatherCity) => entryFor(city).snapshot
export const retryWeather = (city: WeatherCity) => refresh(entryFor(city), true)

export function subscribeWeather(city: WeatherCity, listener: () => void) {
  const entry = entryFor(city)
  entry.listeners.add(listener)
  const onVisible = () => {
    if (!document.hidden) void refresh(entry)
  }
  const onOnline = () => {
    void refresh(entry, true)
  }
  if (entry.listeners.size === 1 && entry.interval === undefined) {
    void refresh(entry)
    entry.interval = setInterval(onVisible, 60_000)
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('online', onOnline)
  return () => {
    entry.listeners.delete(listener)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('online', onOnline)
    // StrictMode re-subscribes in the same turn; retain that in-flight request.
    queueMicrotask(() => {
      if (entry.listeners.size) return
      clearInterval(entry.interval)
      entry.interval = undefined
      const controller = entry.controller
      entry.controller = undefined
      controller?.abort()
      if (controller) {
        entry.lastAttempt = null
        publish(entry, { loading: false })
      }
    })
  }
}
