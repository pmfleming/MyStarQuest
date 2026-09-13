import type { ExplorerCityOption } from '../dayNightExplorer/dayNightExplorerOptions'
import {
  fetchCurrentWeather,
  isWeatherUsable,
  WEATHER_FRESH_MS,
  type CurrentWeather,
} from './weatherData'
import { weatherDateKey } from './weatherConditions'

export type WeatherSnapshot = {
  now: number
  data: CurrentWeather | null
  loading: boolean
  error: string | null
  stale: boolean
}

type Entry = {
  city: ExplorerCityOption
  snapshot: WeatherSnapshot
  listeners: Set<() => void>
  controller?: AbortController
  interval?: ReturnType<typeof setInterval>
  lastAttempt: number | null
  lastDate: string
}

const entries = new Map<string, Entry>()
const cityKey = (city: ExplorerCityOption) =>
  `${city.id}:${city.location.latitude}:${city.location.longitude}:${city.location.timeZone}`

function entryFor(city: ExplorerCityOption): Entry {
  const key = cityKey(city)
  let entry = entries.get(key)
  if (!entry) {
    entry = {
      city,
      snapshot: {
        now: Date.now(),
        data: null,
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
    Object.keys(patch).every((key) =>
      Object.is(
        next[key as keyof WeatherSnapshot],
        entry.snapshot[key as keyof WeatherSnapshot]
      )
    )
  )
    return
  entry.snapshot = next
  entry.listeners.forEach((listener) => listener())
}

async function refresh(entry: Entry, force = false) {
  const now = Date.now()
  const zone = entry.city.location.timeZone
  const date = weatherDateKey(now, zone)
  const dateChanged = date !== entry.lastDate
  entry.lastDate = date
  const data = entry.snapshot.data
  const usable = data && isWeatherUsable(data, zone, now) ? data : null
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
    if (entry.controller === controller)
      publish(entry, { data: next, stale: false, error: null })
  } catch {
    if (entry.controller === controller) {
      const cached = entry.snapshot.data
      const stillUsable =
        cached && isWeatherUsable(cached, zone) ? cached : null
      publish(entry, {
        data: stillUsable,
        stale: Boolean(stillUsable),
        error: 'Could not update the weather.',
      })
    }
  } finally {
    clearTimeout(timeout)
    if (entry.controller === controller) {
      entry.controller = undefined
      publish(entry, { loading: false })
    }
  }
}

export const getWeatherSnapshot = (city: ExplorerCityOption) =>
  entryFor(city).snapshot
export const retryWeather = (city: ExplorerCityOption) =>
  refresh(entryFor(city), true)

export function subscribeWeather(
  city: ExplorerCityOption,
  listener: () => void
) {
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
