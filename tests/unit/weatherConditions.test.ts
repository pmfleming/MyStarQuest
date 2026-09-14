import { describe, expect, it } from 'vitest'
import {
  getWeatherScene,
  type WeatherConditions,
} from '../../src/lib/weather/weatherConditions'
import { getWeatherVisuals } from '../../src/lib/weather/weatherVisuals'

const base: WeatherConditions = {
  weatherCode: 0,
  temperature: 18,
  windSpeed: 0,
  rain: 0,
  showers: 0,
  snowfall: 0,
  isDay: true,
}

describe('weather conditions and independent visual layers', () => {
  it('handles mixed and freezing precipitation without losing thunder', () => {
    expect(getWeatherScene({ ...base, weatherCode: 61, temperature: 1 })).toBe(
      'rain'
    )
    expect(
      getWeatherScene({ ...base, weatherCode: 61, rain: 1, snowfall: 0.2 })
    ).toBe('sleet')
    expect(
      getWeatherScene({ ...base, weatherCode: 66, rain: 1, snowfall: 0.2 })
    ).toBe('freezing-rain')
    expect(
      getWeatherScene({ ...base, weatherCode: 99, rain: 5, snowfall: 0.2 })
    ).toBe('hail')
    expect(
      getWeatherVisuals({ ...base, weatherCode: 66, rain: 1, snowfall: 0.2 })
    ).toMatchObject({ precipitation: 'freezing-rain' })
    expect(
      getWeatherVisuals({ ...base, weatherCode: 99, rain: 5, snowfall: 0.2 })
    ).toMatchObject({ precipitation: 'hail', thunder: true })
  })

  it('does not invent a sunny picture when code or daylight is unknown', () => {
    for (const weatherCode of [null, 999, NaN])
      expect(getWeatherScene({ ...base, weatherCode })).toBe('unavailable')
    expect(getWeatherScene({ ...base, isDay: null })).toBe('unavailable')
    expect(
      getWeatherScene({
        ...base,
        weatherCode: 63,
        temperature: null,
        windSpeed: null,
      })
    ).toBe('rain')
    expect(getWeatherVisuals(null).available).toBe(false)
  })
})
