import { describe, expect, it } from 'vitest'
import {
  buildWeatherUrl,
  isWeatherUsable,
  parseWeatherResponse,
} from '../../src/lib/weather/weatherData'
import { EXPLORER_CITY_OPTIONS } from '../../src/lib/dayNightExplorer/dayNightExplorerOptions'

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
  it('normalizes provider fields and treats missing temperatures as unknown', () => {
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
  })

  it('rejects yesterday, overly old and future observations', () => {
    const weather = parseWeatherResponse(payload(), 'Europe/Amsterdam', now)
    expect(
      isWeatherUsable(weather, 'Europe/Amsterdam', now + 60 * 60_000)
    ).toBe(true)
    expect(
      isWeatherUsable(weather, 'Europe/Amsterdam', now + 2 * 60 * 60_000)
    ).toBe(false)
    expect(
      isWeatherUsable(
        { ...weather, observedAt: now + 10 * 60_000 },
        'Europe/Amsterdam',
        now
      )
    ).toBe(false)
    const midnight = Date.parse('2026-09-13T22:01:00Z')
    expect(
      isWeatherUsable(
        {
          ...weather,
          observedAt: midnight - 120_000,
          fetchedAt: midnight - 60_000,
        },
        'Europe/Amsterdam',
        midnight
      )
    ).toBe(false)
    expect(() =>
      parseWeatherResponse(
        payload(),
        'Europe/Amsterdam',
        now + 24 * 60 * 60_000
      )
    ).toThrow('out of date')
  })

  it('requests the selected city, explicit units and epoch timestamps', () => {
    for (const city of EXPLORER_CITY_OPTIONS) {
      const url = new URL(buildWeatherUrl(city))
      expect(url.searchParams.get('timezone')).toBe(city.location.timeZone)
      expect(url.searchParams.get('latitude')).toBe(
        String(city.location.latitude)
      )
      expect(url.searchParams.get('timeformat')).toBe('unixtime')
      expect(url.searchParams.get('temperature_unit')).toBe('celsius')
    }
  })
})
