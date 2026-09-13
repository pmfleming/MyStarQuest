import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { ExplorerCityOption } from '../lib/dayNightExplorer/dayNightExplorerOptions'
import {
  getWeatherSnapshot,
  retryWeather,
  subscribeWeather,
} from '../lib/weather/weatherStore'

export function useCurrentWeather(city: ExplorerCityOption) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeWeather(city, listener),
    [city]
  )
  const getSnapshot = useCallback(() => getWeatherSnapshot(city), [city])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  const retry = useCallback(() => retryWeather(city), [city])
  return useMemo(() => ({ ...snapshot, retry }), [snapshot, retry])
}
