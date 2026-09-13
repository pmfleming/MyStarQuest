import { getWeatherCode, getPrecipitationKind } from './weatherCodes'
export const WEATHER_LABELS = {
  sunny: 'Sunny',
  'partly-cloudy': 'Partly cloudy',
  overcast: 'Cloudy',
  drizzle: 'Drizzle',
  rain: 'Rain',
  'heavy-rain': 'Heavy rain',
  thunderstorm: 'Thunderstorm',
  hail: 'Hail and thunder',
  fog: 'Foggy',
  sleet: 'Rain and snow',
  'freezing-rain': 'Freezing rain',
  snow: 'Snow',
  'heavy-snow': 'Heavy snow',
  windy: 'Windy',
  hot: 'Hot',
  cold: 'Cold',
  'clear-night': 'Clear night',
  'partly-cloudy-night': 'Partly cloudy night',
  unavailable: 'Weather unavailable',
} as const

export type WeatherScene = keyof typeof WEATHER_LABELS
export const formatTemperature = (value: number | null | undefined) =>
  value == null ? '—' : `${Math.round(value)}°C`
export type WeatherConditions = {
  temperature: number | null
  weatherCode: number | null
  windSpeed: number | null
  rain: number | null
  showers: number | null
  snowfall: number | null
  isDay: boolean | null
}

const skyScenes = new Set<WeatherScene>(['sunny', 'partly-cloudy', 'overcast'])
const severeScenes = new Set<WeatherScene>([
  'thunderstorm',
  'hail',
  'freezing-rain',
])

const getSkyScene = (
  scene: WeatherScene,
  isDay: boolean | null
): WeatherScene => {
  if (scene !== 'sunny' && scene !== 'partly-cloudy') return scene
  if (isDay === null) return 'unavailable'
  if (isDay) return scene
  return scene === 'sunny' ? 'clear-night' : 'partly-cloudy-night'
}

// A pure selector: future exploration controls can supply a separate set of
// conditions without mutating the fetched weather or its cache.
export function getWeatherScene(conditions: WeatherConditions): WeatherScene {
  const code = getWeatherCode(conditions.weatherCode)
  if (!code) return 'unavailable'
  const { scene } = code
  if (severeScenes.has(scene)) return scene
  const precipitation = getPrecipitationKind(
    code.precipitation,
    (conditions.rain ?? 0) + (conditions.showers ?? 0),
    conditions.snowfall ?? 0
  )
  if (precipitation === 'sleet') return 'sleet'
  if (!skyScenes.has(scene)) return scene
  if (precipitation !== 'none') return precipitation
  const { windSpeed, temperature, isDay } = conditions
  if (windSpeed !== null && windSpeed >= 30) return 'windy'
  if (temperature !== null && temperature >= 28) return 'hot'
  if (temperature !== null && temperature <= 5) return 'cold'
  return getSkyScene(scene, isDay)
}

export function getWeatherDescription(conditions: WeatherConditions): string {
  const scene = getWeatherScene(conditions)
  const label = WEATHER_LABELS[scene]
  if (scene !== 'hot' && scene !== 'cold' && scene !== 'windy') return label
  const codeScene = getWeatherCode(conditions.weatherCode)?.scene
  const sky = codeScene
    ? getSkyScene(codeScene, conditions.isDay)
    : 'unavailable'
  return sky === 'unavailable'
    ? label
    : `${label} · ${WEATHER_LABELS[sky].toLowerCase()}`
}

export const weatherDateKey = (instant: number, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
