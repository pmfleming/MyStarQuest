import { getWeatherScene, type WeatherConditions } from './weatherConditions'

import {
  getWeatherCode,
  getPrecipitationKind,
  getPrecipitationLevel,
  type WeatherLevel,
  type PrecipitationKind,
} from './weatherCodes'
export type { WeatherLevel, PrecipitationKind } from './weatherCodes'

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

const EMPTY_WEATHER_VISUALS: WeatherVisuals = {
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

// Ordered pairs correspond to the dry/waterproof cells in each wardrobe atlas.
const outfits = [
  [
    'an expedition parka, mittens and snow boots',
    'a waterproof expedition parka, mittens and snow boots',
  ],
  [
    'a down coat, hat, scarf and gloves',
    'a hooded waterproof down coat and insulated boots',
  ],
  [
    'a padded jacket, beanie and gloves',
    'a hooded insulated rain jacket and boots',
  ],
  ['a wool coat and scarf', 'a lined waterproof coat with its hood up'],
  ['a fleece jacket and trousers', 'a warm hooded raincoat and rain boots'],
  [
    'a light cardigan and leggings',
    'a light hooded rain jacket and waterproof shoes',
  ],
  [
    'a long-sleeve cotton dress',
    'a breathable hooded rain cape over a cotton dress',
  ],
  [
    'a short-sleeve summer dress and sun hat',
    'a light hooded rain cape over a summer dress',
  ],
  [
    'an airy summer dress, sun hat and sandals',
    'a thin hooded poncho over a summer dress',
  ],
  [
    'a loose cotton top, shorts, sun hat and sandals',
    'a thin hooded poncho over a cotton top and shorts',
  ],
] as const

export function getWeatherOutfit(visuals: WeatherVisuals) {
  // An educational layering rule, not a meteorological wind-chill calculation.
  const windLayers = Math.max(0, visuals.windLevel - 1)
  const temperature = (visuals.temperature ?? 18) - windLayers * 5
  const band = Math.max(
    0,
    Math.min(outfits.length - 1, Math.floor((temperature + 10) / 5))
  )
  const waterproof =
    visuals.precipitationLevel > 0 && visuals.precipitation !== 'none'
  return { band, waterproof, description: outfits[band]![waterproof ? 1 : 0] }
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
