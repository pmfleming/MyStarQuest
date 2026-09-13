import { z } from 'zod'
import type { ExplorerCityOption } from '../../features/dayNightExplorer/dayNightExplorerOptions'
import { weatherDateKey, type WeatherConditions } from './weatherConditions'

const nullableNumber = z.number().finite().nullable().catch(null)
const amount = z.number().finite().nonnegative().nullable().catch(null)
const timestamp = z.number().finite().positive().max(8_640_000_000_000)
const responseSchema = z.object({
  current: z.object({
    time: timestamp,
    temperature_2m: nullableNumber,
    apparent_temperature: nullableNumber,
    weather_code: z.number().int().nonnegative().nullable().catch(null),
    wind_speed_10m: amount,
    rain: amount,
    showers: amount,
    snowfall: amount,
    is_day: z
      .union([z.literal(0), z.literal(1)])
      .nullable()
      .catch(null),
  }),
  daily: z
    .object({
      time: z.array(timestamp),
      temperature_2m_max: z.array(nullableNumber),
      temperature_2m_min: z.array(nullableNumber),
    })
    .optional()
    .catch(undefined),
})

export type CurrentWeather = WeatherConditions & {
  observedAt: number
  fetchedAt: number
  feelsLike: number | null
  high: number | null
  low: number | null
}

export const WEATHER_FRESH_MS = 15 * 60_000
export const WEATHER_MAX_AGE_MS = 2 * 60 * 60_000

export function parseWeatherResponse(
  payload: unknown,
  timeZone: string,
  now = Date.now()
): CurrentWeather {
  const { current, daily } = responseSchema.parse(payload)
  const observedAt = current.time * 1000
  const index =
    daily?.time.findIndex(
      (time) =>
        weatherDateKey(time * 1000, timeZone) ===
        weatherDateKey(observedAt, timeZone)
    ) ?? -1
  const weather: CurrentWeather = {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    weatherCode: current.weather_code,
    windSpeed: current.wind_speed_10m,
    rain: current.rain,
    showers: current.showers,
    snowfall: current.snowfall,
    isDay: current.is_day === null ? null : current.is_day === 1,
    observedAt,
    fetchedAt: now,
    high: daily?.temperature_2m_max[index] ?? null,
    low: daily?.temperature_2m_min[index] ?? null,
  }
  if (!isWeatherUsable(weather, timeZone, now))
    throw new Error('Weather data is out of date')
  return weather
}

export function isWeatherUsable(
  weather: CurrentWeather,
  timeZone: string,
  now = Date.now()
) {
  const observedAge = now - weather.observedAt
  const fetchAge = now - weather.fetchedAt
  return (
    observedAge >= -5 * 60_000 &&
    observedAge < WEATHER_MAX_AGE_MS &&
    fetchAge >= 0 &&
    fetchAge < WEATHER_MAX_AGE_MS &&
    weatherDateKey(weather.observedAt, timeZone) ===
      weatherDateKey(now, timeZone)
  )
}

export function buildWeatherUrl(city: ExplorerCityOption) {
  const params = new URLSearchParams({
    latitude: String(city.location.latitude),
    longitude: String(city.location.longitude),
    timezone: city.location.timeZone,
    current:
      'temperature_2m,apparent_temperature,weather_code,rain,showers,snowfall,wind_speed_10m,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    timeformat: 'unixtime',
    forecast_days: '1',
  })
  return `https://api.open-meteo.com/v1/forecast?${params}`
}

export async function fetchCurrentWeather(
  city: ExplorerCityOption,
  signal: AbortSignal
) {
  const response = await fetch(buildWeatherUrl(city), { signal })
  if (!response.ok)
    throw new Error(`Weather request failed (${response.status})`)
  const payload: unknown = await response.json()
  signal.throwIfAborted()
  return parseWeatherResponse(payload, city.location.timeZone)
}
