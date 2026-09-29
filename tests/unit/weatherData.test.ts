import { describe, expect, it } from 'vitest'
import { parseWeatherResponse } from '../../src/lib/weather/weatherData'

const now = Date.parse('2026-09-13T12:00:00Z')
const payload = () => ({
  current: {
    time: now / 1000,
    temperature_2m: 17.3,
    apparent_temperature: 16,
    weather_code: 63,
    rain: 1,
    showers: 0,
    snowfall: 0,
    wind_speed_10m: 20,
    is_day: 1,
  },
  daily: {
    time: [Date.parse('2026-09-12T22:00:00Z') / 1000],
    temperature_2m_max: [21],
    temperature_2m_min: [12],
  },
})

describe('weather data', () => {
  it('normalizes provider fields and rejects invalid or wrongly dated observations', () => {
    expect(
      parseWeatherResponse(payload(), 'Europe/Amsterdam', now)
    ).toMatchObject({
      temperature: 17.3,
      high: 21,
      low: 12,
      isDay: true,
      observedAt: now,
    })
    const invalid = payload()
    Object.assign(invalid.current, {
      temperature_2m: null,
      rain: -1,
      is_day: 'yes',
    })
    expect(
      parseWeatherResponse(invalid, 'Europe/Amsterdam', now)
    ).toMatchObject({ temperature: null, rain: null, isDay: null })
    expect(() => parseWeatherResponse({}, 'Europe/Amsterdam', now)).toThrow()
    const future = payload()
    future.current.time += 10 * 60
    expect(() => parseWeatherResponse(future, 'Europe/Amsterdam', now)).toThrow(
      'out of date'
    )
    // Fresh by age, but from the previous local calendar day.
    const midnight = Date.parse('2026-09-13T22:01:00Z')
    const yesterday = payload()
    yesterday.current.time = (midnight - 120_000) / 1000
    expect(() =>
      parseWeatherResponse(yesterday, 'Europe/Amsterdam', midnight)
    ).toThrow('out of date')
  })
})
