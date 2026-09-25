import {
  buildLocationDateTime,
  DEFAULT_LOCATION,
  getLocationClockTime,
} from '../../../src/lib/solar'

const DUBLIN_LOCATION = {
  latitude: 53.35,
  longitude: -6.26,
  timeZone: 'Europe/Dublin',
} as const

const TAIPEI_LOCATION = {
  latitude: 25.03,
  longitude: 121.56,
  timeZone: 'Asia/Taipei',
} as const

describe('solar helpers', () => {
  it('converts location dates and clocks correctly across DST and cities', () => {
    const winterNoon = buildLocationDateTime(
      new Date(2026, 0, 15),
      12 * 60,
      0,
      DEFAULT_LOCATION
    )
    const dstTransitionNoon = buildLocationDateTime(
      new Date(2026, 2, 29),
      12 * 60,
      0,
      DEFAULT_LOCATION
    )

    expect(winterNoon.toISOString()).toBe('2026-01-15T11:00:00.000Z')
    expect(dstTransitionNoon.toISOString()).toBe('2026-03-29T10:00:00.000Z')

    const locationClockTime = getLocationClockTime(
      new Date(Date.UTC(2026, 2, 29, 10, 15, 45)),
      DEFAULT_LOCATION
    )

    expect(locationClockTime.hours).toBe(12)
    expect(locationClockTime.minutes).toBe(15)
    expect(locationClockTime.seconds).toBe(45)
    expect(locationClockTime.totalMinutes).toBe(12 * 60 + 15)

    const summerInstant = new Date(Date.UTC(2026, 5, 15, 10, 0, 0))
    const winterInstant = new Date(Date.UTC(2026, 0, 15, 10, 0, 0))

    expect(getLocationClockTime(summerInstant, DEFAULT_LOCATION).hours).toBe(12)
    expect(getLocationClockTime(summerInstant, DUBLIN_LOCATION).hours).toBe(11)
    expect(getLocationClockTime(summerInstant, TAIPEI_LOCATION).hours).toBe(18)

    expect(getLocationClockTime(winterInstant, DEFAULT_LOCATION).hours).toBe(11)
    expect(getLocationClockTime(winterInstant, DUBLIN_LOCATION).hours).toBe(10)
    expect(getLocationClockTime(winterInstant, TAIPEI_LOCATION).hours).toBe(18)
  })
})
