import { getWeatherScene, type WeatherConditions } from './weatherConditions'

import {
  getWeatherCode,
  getPrecipitationKind,
  getPrecipitationLevel,
  type WeatherLevel,
  type PrecipitationKind,
} from './weatherCodes'
export type { WeatherLevel, PrecipitationKind } from './weatherCodes'

export type WeatherCharacterPose =
  'hot' | 'mild' | 'cool' | 'cold' | 'rain-warm' | 'rain-cold'

// This is the independent input to the compositor. Future exploration controls
// can change any one field while retaining the others and the live response.
export type WeatherVisuals = {
  available: boolean
  temperature: number | null
  precipitation: PrecipitationKind
  precipitationLevel: WeatherLevel
  windLevel: WeatherLevel
  cloudLevel: WeatherLevel
  isDay: boolean
  fog: boolean
  thunder: boolean
}

export const EMPTY_WEATHER_VISUALS: WeatherVisuals = {
  available: false,
  temperature: null,
  precipitation: 'none',
  precipitationLevel: 0,
  windLevel: 0,
  cloudLevel: 0,
  isDay: true,
  fog: false,
  thunder: false,
}

export const getWeatherWindLevel = (speed: number): WeatherLevel =>
  speed >= 40 ? 3 : speed >= 20 ? 2 : speed >= 5 ? 1 : 0

export const getWeatherCharacterPose = (
  visuals: WeatherVisuals
): WeatherCharacterPose => {
  const temperature = visuals.temperature ?? 18
  if (
    visuals.precipitationLevel > 0 &&
    (visuals.precipitation === 'rain' ||
      visuals.precipitation === 'sleet' ||
      visuals.precipitation === 'freezing-rain' ||
      visuals.precipitation === 'hail')
  ) {
    return temperature <= 10 ? 'rain-cold' : 'rain-warm'
  }
  if (temperature <= 5) return 'cold'
  if (temperature < 16) return 'cool'
  return temperature >= 28 ? 'hot' : 'mild'
}

const severeThunderScenes = new Set(['thunderstorm', 'hail'])

export function getWeatherVisuals(
  conditions: WeatherConditions | null
): WeatherVisuals {
  if (!conditions) return EMPTY_WEATHER_VISUALS
  const code = getWeatherCode(conditions.weatherCode)
  if (!code || getWeatherScene(conditions) === 'unavailable')
    return EMPTY_WEATHER_VISUALS
  const rain = (conditions.rain ?? 0) + (conditions.showers ?? 0)
  const snow = conditions.snowfall ?? 0
  const precipitation = getPrecipitationKind(code.precipitation, rain, snow)
  const precipitationLevel = getPrecipitationLevel(
    precipitation,
    code.level,
    rain,
    snow
  )
  const speed = conditions.windSpeed ?? 0
  const windLevel = getWeatherWindLevel(speed)
  return {
    available: true,
    temperature: conditions.temperature,
    precipitation,
    precipitationLevel,
    windLevel,
    cloudLevel: code.cloudLevel,
    isDay: conditions.isDay ?? true,
    fog: code.scene === 'fog',
    thunder: severeThunderScenes.has(code.scene),
  }
}
