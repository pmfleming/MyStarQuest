import { useCallback, useMemo, useState } from 'react'
import {
  formatTemperature,
  type WeatherConditions,
} from '../lib/weather/weatherConditions'
import {
  getWeatherVisuals,
  getWeatherWindLevel,
  type PrecipitationKind,
  type WeatherLevel,
  type WeatherVisuals,
} from '../lib/weather/weatherVisuals'

type Draft = { visuals: WeatherVisuals; windSpeed: number | null }
type Change = {
  temperature?: number
  windSpeed?: number
  precipitation?: { kind: PrecipitationKind; level: WeatherLevel }
}

// A simple temperature model for the explorer's rain/snow mix.
export function getExplorationPrecipitation(temperature: number) {
  if (temperature <= 0) return 'snow'
  return temperature <= 2 ? 'sleet' : 'rain'
}

export function useWeatherExploration(
  cityId: string,
  data: WeatherConditions | null
) {
  const liveVisuals = useMemo(
    () => ({
      ...getWeatherVisuals(data),
      temperature: data?.temperature ?? null,
    }),
    [data]
  )
  const [state, setState] = useState<{ cityId: string; draft: Draft | null }>({
    cityId,
    draft: null,
  })
  // Reset on city changes, including returning to a previously explored city.
  if (state.cityId !== cityId) setState({ cityId, draft: null })
  const draft = state.cityId === cityId ? state.draft : null
  const visuals = draft?.visuals ?? liveVisuals
  const windSpeed = draft ? draft.windSpeed : (data?.windSpeed ?? null)

  const adjust = useCallback(
    (change: Change) => {
      setState((previous) => {
        const current = previous.cityId === cityId ? previous.draft : null
        const nextVisuals = {
          ...(current?.visuals ?? liveVisuals),
          available: true,
        }
        nextVisuals.temperature =
          change.temperature ?? nextVisuals.temperature ?? 18
        const nextWind =
          change.windSpeed ?? current?.windSpeed ?? data?.windSpeed ?? 0
        nextVisuals.windLevel = getWeatherWindLevel(nextWind)
        if (change.precipitation) {
          const { kind, level } = change.precipitation
          nextVisuals.precipitation = kind
          nextVisuals.precipitationLevel = level
          if (level > 0) nextVisuals.cloudLevel = 3
          nextVisuals.thunder =
            level > 0 &&
            (kind === 'hail' ||
              (liveVisuals.thunder && kind === liveVisuals.precipitation))
        }
        if (change.temperature !== undefined || change.precipitation) {
          const kind = nextVisuals.precipitation
          if (
            kind !== 'none' &&
            kind !== 'hail' &&
            !(kind === 'freezing-rain' && nextVisuals.temperature <= 0)
          ) {
            nextVisuals.precipitation = getExplorationPrecipitation(
              nextVisuals.temperature
            )
          }
        }
        return { cityId, draft: { visuals: nextVisuals, windSpeed: nextWind } }
      })
    },
    [cityId, data?.windSpeed, liveVisuals]
  )

  const reset = useCallback(() => setState({ cityId, draft: null }), [cityId])
  const isExploring = draft !== null
  return useMemo(
    () => ({
      visuals,
      windSpeed,
      isExploring,
      adjust,
      reset,
    }),
    [visuals, windSpeed, isExploring, adjust, reset]
  )
}

export type WeatherExploration = ReturnType<typeof useWeatherExploration>

export function getExplorationDescription({
  visuals,
  windSpeed,
}: WeatherExploration) {
  const precipitation =
    visuals.precipitationLevel === 0
      ? 'no precipitation'
      : `${['', 'light', 'moderate', 'heavy'][visuals.precipitationLevel]} ${visuals.precipitation.replace('-', ' ')}`
  return `${formatTemperature(visuals.temperature)}, ${windSpeed ?? 0} km/h wind, ${precipitation}`
}
