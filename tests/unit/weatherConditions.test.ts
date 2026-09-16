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
