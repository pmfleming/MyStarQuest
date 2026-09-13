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

const codeScenes: Readonly<Record<number, WeatherScene>> = {
  0: 'sunny',
  1: 'sunny',
  2: 'partly-cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'freezing-rain',
  57: 'freezing-rain',
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'freezing-rain',
  67: 'freezing-rain',
  71: 'snow',
  73: 'snow',
  75: 'heavy-snow',
  77: 'snow',
  80: 'rain',
  81: 'rain',
  82: 'heavy-rain',
  85: 'snow',
  86: 'heavy-snow',
  95: 'thunderstorm',
  96: 'hail',
  99: 'hail',
}

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
  const {
    weatherCode,
    rain,
    showers,
    snowfall,
    windSpeed,
    temperature,
    isDay,
  } = conditions
  const scene = weatherCode === null ? undefined : codeScenes[weatherCode]
  if (!scene) return 'unavailable'
  if (scene === 'thunderstorm' || scene === 'hail' || scene === 'freezing-rain')
    return scene
  if ((rain ?? 0) + (showers ?? 0) > 0 && (snowfall ?? 0) > 0) return 'sleet'
  if (scene !== 'sunny' && scene !== 'partly-cloudy' && scene !== 'overcast')
    return scene
  // Provider cloud codes can coexist with nonzero precipitation. Do not
  // replace wet conditions with a heat/cold/wind illustration.
  if ((snowfall ?? 0) > 0) return 'snow'
  if ((rain ?? 0) + (showers ?? 0) > 0) return 'rain'
  if (windSpeed !== null && windSpeed >= 30) return 'windy'
  if (temperature !== null && temperature >= 28) return 'hot'
  if (temperature !== null && temperature <= 5) return 'cold'
  return getSkyScene(scene, isDay)
}

export function getWeatherDescription(conditions: WeatherConditions): string {
  const scene = getWeatherScene(conditions)
  const label = WEATHER_LABELS[scene]
  if (scene !== 'hot' && scene !== 'cold' && scene !== 'windy') return label
  const codeScene =
    conditions.weatherCode === null
      ? undefined
      : codeScenes[conditions.weatherCode]
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
