import { describe, expect, it } from 'vitest'
import {
  getWeatherDescription,
  getWeatherScene,
  weatherDateKey,
  type WeatherConditions,
} from '../../src/lib/weather/weatherConditions'
import {
  getWeatherCharacterPose,
  getWeatherVisuals,
} from '../../src/lib/weather/weatherVisuals'

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
  it.each([
    [[0, 1], 'sunny'],
    [[2], 'partly-cloudy'],
    [[3], 'overcast'],
    [[45, 48], 'fog'],
    [[51, 53, 55], 'drizzle'],
    [[56, 57, 66, 67], 'freezing-rain'],
    [[61, 63, 80, 81], 'rain'],
    [[65, 82], 'heavy-rain'],
    [[71, 73, 77, 85], 'snow'],
    [[75, 86], 'heavy-snow'],
    [[95], 'thunderstorm'],
    [[96, 99], 'hail'],
  ] as const)('maps codes %s to %s', (codes, expected) => {
    for (const weatherCode of codes)
      expect(getWeatherScene({ ...base, weatherCode })).toBe(expected)
  })

  it('retains simultaneous cold, rain and strong wind', () => {
    const conditions = {
      ...base,
      temperature: 2,
      weatherCode: 65,
      windSpeed: 45,
      rain: 8,
    }
    expect(getWeatherScene(conditions)).toBe('heavy-rain')
    const visuals = getWeatherVisuals(conditions)
    expect(visuals).toMatchObject({
      temperature: 2,
      precipitation: 'rain',
      precipitationLevel: 3,
      windLevel: 3,
    })
    expect(getWeatherCharacterPose(visuals)).toBe('rain-cold')
    // The next exploration controls can change temperature alone.
    expect(getWeatherCharacterPose({ ...visuals, temperature: 24 })).toBe(
      'rain-warm'
    )
    expect(getWeatherCharacterPose({ ...visuals, precipitationLevel: 0 })).toBe(
      'cold'
    )
  })

  it('handles mixed and freezing precipitation without losing thunder', () => {
    expect(getWeatherScene({ ...base, weatherCode: 61, temperature: 1 })).toBe(
      'rain'
    )
    expect(
      getWeatherScene({ ...base, weatherCode: 61, rain: 1, snowfall: 0.2 })
    ).toBe('sleet')
    expect(
      getWeatherVisuals({ ...base, weatherCode: 66, rain: 1, snowfall: 0.2 })
    ).toMatchObject({ precipitation: 'freezing-rain' })
    expect(
      getWeatherVisuals({ ...base, weatherCode: 99, rain: 5, snowfall: 0.2 })
    ).toMatchObject({ precipitation: 'hail', thunder: true })
  })

  it('supports three precipitation and wind levels plus calm/dry', () => {
    expect(
      [51, 63, 65].map(
        (weatherCode) =>
          getWeatherVisuals({ ...base, weatherCode }).precipitationLevel
      )
    ).toEqual([1, 2, 3])
    expect(
      [0, 10, 25, 45].map(
        (windSpeed) => getWeatherVisuals({ ...base, windSpeed }).windLevel
      )
    ).toEqual([0, 1, 2, 3])
    expect(getWeatherVisuals(base).precipitationLevel).toBe(0)
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

  it('chooses nighttime sky while preserving independent temperature', () => {
    expect(getWeatherScene({ ...base, isDay: false })).toBe('clear-night')
    expect(getWeatherScene({ ...base, weatherCode: 2, isDay: false })).toBe(
      'partly-cloudy-night'
    )
    expect(
      getWeatherDescription({ ...base, temperature: 30, isDay: false })
    ).toBe('Hot · clear night')
    expect(
      getWeatherVisuals({ ...base, temperature: 30, isDay: false })
    ).toMatchObject({ temperature: 30, isDay: false })
  })

  it('uses each city’s date across midnight and daylight saving', () => {
    const instant = Date.parse('2026-09-13T16:30:00Z')
    expect(weatherDateKey(instant, 'Europe/Amsterdam')).toBe('2026-09-13')
    expect(weatherDateKey(instant, 'Asia/Taipei')).toBe('2026-09-14')
    expect(
      weatherDateKey(Date.parse('2026-03-28T23:30:00Z'), 'Europe/Amsterdam')
    ).toBe('2026-03-29')
  })
})
