import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { WeatherCity } from '../lib/weather/weatherData'
import {
  getWeatherSnapshot,
  retryWeather,
  subscribeWeather,
} from '../lib/weather/weatherStore'

export function useCurrentWeather(city: WeatherCity) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeWeather(city, listener),
    [city]
  )
  const getSnapshot = useCallback(() => getWeatherSnapshot(city), [city])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const retry = useCallback(() => retryWeather(city), [city])
  return useMemo(() => ({ ...snapshot, retry }), [snapshot, retry])
}
