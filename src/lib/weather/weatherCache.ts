import { z } from 'zod'
import type { CurrentWeather, WeatherCity } from './weatherData'
import { isWeatherUsable } from './weatherData'

const numberOrNull = z.number().finite().nullable()
const schema = z.object({
  observedAt: z.number().finite(),
  fetchedAt: z.number().finite(),
  temperature: numberOrNull,
  weatherCode: numberOrNull,
  windSpeed: numberOrNull,
  rain: numberOrNull,
  showers: numberOrNull,
  snowfall: numberOrNull,
  isDay: z.boolean().nullable(),
  feelsLike: numberOrNull,
  high: numberOrNull,
  low: numberOrNull,
})
export const weatherCityKey = (city: WeatherCity) =>
  `msq-weather:${city.id}:${city.location.latitude}:${city.location.longitude}:${city.location.timeZone}`
export function readWeatherCache(city: WeatherCity): CurrentWeather | null {
  try {
    const parsed = schema.safeParse(
      JSON.parse(localStorage.getItem(weatherCityKey(city)) ?? 'null')
    )
    return parsed.success &&
      isWeatherUsable(parsed.data, city.location.timeZone)
      ? parsed.data
      : null
  } catch {
    return null
  }
}
export function writeWeatherCache(city: WeatherCity, data: CurrentWeather) {
  try {
    localStorage.setItem(weatherCityKey(city), JSON.stringify(data))
  } catch {
    /* Live weather remains usable when optional caching is unavailable. */
  }
}
