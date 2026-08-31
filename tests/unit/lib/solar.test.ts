import {
  buildLocationDateTime,
  DEFAULT_LOCATION,
  getDayOfYear,
  getLocationClockTime,
  getSolarDeclinationDegrees,
  getSolarTimes,
  getSunPosition,
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
  it('derives day number and seasonal solar declination', () => {
    expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(getDayOfYear(new Date(2026, 11, 31))).toBe(365)

    const declination = getSolarDeclinationDegrees(new Date(2026, 2, 20))

    expect(Math.abs(declination)).toBeLessThan(1.5)

    const juneDeclination = getSolarDeclinationDegrees(new Date(2026, 5, 21))
    const decemberDeclination = getSolarDeclinationDegrees(
      new Date(2026, 11, 21)
    )

    expect(juneDeclination).toBeGreaterThan(20)
    expect(decemberDeclination).toBeLessThan(-20)

    const septemberDeclination = getSolarDeclinationDegrees(
      new Date(2026, 8, 22)
    )

    expect(Math.abs(septemberDeclination)).toBeLessThan(2)
  })

  it('returns ordered solar phases and expanded twilight windows', () => {
    const times = getSolarTimes(new Date(2026, 2, 25))

    expect(times.sunriseMinutes).toBeLessThan(times.daylightStartMinutes)
    expect(times.daylightStartMinutes).toBeLessThan(times.daylightEndMinutes)
    expect(times.daylightEndMinutes).toBeLessThan(times.sunsetMinutes)
    expect(times.phaseAtMinutes(times.sunriseMinutes)).toBe('sunrise')
    expect(times.phaseAtMinutes(times.daylightStartMinutes)).toBe('day')
    expect(times.phaseAtMinutes(times.daylightEndMinutes)).toBe('sunset')

    const solsticeTimes = getSolarTimes(new Date(2026, 5, 21))

    expect(
      solsticeTimes.isNightAtMinutes(solsticeTimes.sunriseMinutes - 1)
    ).toBe(true)
    expect(
      solsticeTimes.phaseAtMinutes(solsticeTimes.sunriseMinutes + 10)
    ).toBe('sunrise')
    expect(
      solsticeTimes.isDaylightAtMinutes(solsticeTimes.daylightStartMinutes + 10)
    ).toBe(true)
    expect(solsticeTimes.phaseAtMinutes(solsticeTimes.sunsetMinutes - 10)).toBe(
      'sunset'
    )
    expect(
      solsticeTimes.isNightAtMinutes(solsticeTimes.sunsetMinutes + 1)
    ).toBe(true)
  })

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

  it('tracks subsolar latitude and longitude over place and time', () => {
    const date = new Date(2026, 2, 25)
    const solarTimes = getSolarTimes(date, DEFAULT_LOCATION)
    const solarNoonMinutes =
      (solarTimes.daylightStartMinutes + solarTimes.daylightEndMinutes) / 2
    const solarNoonInstant = buildLocationDateTime(
      date,
      solarNoonMinutes,
      0,
      DEFAULT_LOCATION
    )
    const sunPosition = getSunPosition(solarNoonInstant)

    expect(
      Math.abs(sunPosition.longitude - DEFAULT_LOCATION.longitude)
    ).toBeLessThan(0.5)

    const midnightUtc = getSunPosition(new Date(Date.UTC(2026, 5, 21, 0, 0, 0)))
    const middayUtc = getSunPosition(new Date(Date.UTC(2026, 5, 21, 12, 0, 0)))
    const longitudeDifference = Math.abs(
      middayUtc.longitude - midnightUtc.longitude
    )

    expect(Math.abs(middayUtc.latitude - midnightUtc.latitude)).toBeLessThan(
      0.2
    )
    expect(Math.abs(longitudeDifference - 180)).toBeLessThan(1)
  })
})
