import { getWeatherScene, type WeatherConditions } from './weatherConditions'

export type WeatherLevel = 0 | 1 | 2 | 3
export type PrecipitationKind =
  'none' | 'rain' | 'snow' | 'sleet' | 'hail' | 'freezing-rain'
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

export function getWeatherVisuals(
  conditions: WeatherConditions | null
): WeatherVisuals {
  if (!conditions || getWeatherScene(conditions) === 'unavailable')
    return EMPTY_WEATHER_VISUALS
  const code = conditions.weatherCode!
  const rainAmount = (conditions.rain ?? 0) + (conditions.showers ?? 0)
  const snowAmount = conditions.snowfall ?? 0
  const hail = code === 96 || code === 99
  const freezingRain = [56, 57, 66, 67].includes(code)
  const snow = [71, 73, 75, 77, 85, 86].includes(code) || snowAmount > 0
  const mixed = !hail && !freezingRain && rainAmount > 0 && snowAmount > 0
  const rain =
    [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code) || rainAmount > 0
  const precipitation: PrecipitationKind = hail
    ? 'hail'
    : freezingRain
      ? 'freezing-rain'
      : mixed
        ? 'sleet'
        : snow
          ? 'snow'
          : rain
            ? 'rain'
            : 'none'
  const heavy =
    [55, 57, 65, 67, 75, 82, 86, 99].includes(code) ||
    rainAmount >= 7.5 ||
    snowAmount >= 1
  const moderate =
    [53, 63, 73, 81, 95, 96].includes(code) ||
    rainAmount >= 2.5 ||
    snowAmount >= 0.3
  const precipitationLevel: WeatherLevel =
    precipitation === 'none' ? 0 : heavy ? 3 : moderate ? 2 : 1
  const speed = conditions.windSpeed ?? 0
  const windLevel: WeatherLevel =
    speed >= 40 ? 3 : speed >= 20 ? 2 : speed >= 5 ? 1 : 0
  return {
    available: true,
    temperature: conditions.temperature,
    precipitation,
    precipitationLevel,
    windLevel,
    cloudLevel: code === 0 ? 0 : code === 1 ? 1 : code === 2 ? 2 : 3,
    isDay: conditions.isDay ?? true,
    fog: code === 45 || code === 48,
    thunder: code === 95 || hail,
  }
}
