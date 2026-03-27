import {
  buildLocationDateTime,
  DEFAULT_LOCATION,
  getDayOfYear,
  getLocationClockTime,
  getSolarDeclinationDegrees,
  getSolarTimes,
  getSunPosition,
} from '../../../src/lib/solar'

describe('solar helpers', () => {
  it('counts the day of year correctly', () => {
    expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1)
    expect(getDayOfYear(new Date(2026, 11, 31))).toBe(365)
  })

  it('keeps declination near zero around the March equinox', () => {
    const declination = getSolarDeclinationDegrees(new Date(2026, 2, 20))

    expect(Math.abs(declination)).toBeLessThan(1.5)
  })

  it('tilts north in June and south in December', () => {
    const juneDeclination = getSolarDeclinationDegrees(new Date(2026, 5, 21))
    const decemberDeclination = getSolarDeclinationDegrees(
      new Date(2026, 11, 21)
    )

    expect(juneDeclination).toBeGreaterThan(20)
    expect(decemberDeclination).toBeLessThan(-20)
  })

  it('returns opposite declination directions across the equinoxes', () => {
    const septemberDeclination = getSolarDeclinationDegrees(
      new Date(2026, 8, 22)
    )

    expect(Math.abs(septemberDeclination)).toBeLessThan(2)
  })

  it('returns ordered Amsterdam solar phases for a spring date', () => {
    const times = getSolarTimes(new Date(2026, 2, 25))

    expect(times.sunriseMinutes).toBeLessThan(times.daylightStartMinutes)
    expect(times.daylightStartMinutes).toBeLessThan(times.daylightEndMinutes)
    expect(times.daylightEndMinutes).toBeLessThan(times.sunsetMinutes)
    expect(times.phaseAtMinutes(times.sunriseMinutes)).toBe('sunrise')
    expect(times.phaseAtMinutes(times.daylightStartMinutes)).toBe('day')
    expect(times.phaseAtMinutes(times.daylightEndMinutes)).toBe('sunset')
  })

  it('uses sunrise and sunset as the expanded dawn and twilight windows', () => {
    const times = getSolarTimes(new Date(2026, 5, 21))

    expect(times.isNightAtMinutes(times.sunriseMinutes - 1)).toBe(true)
    expect(times.phaseAtMinutes(times.sunriseMinutes + 10)).toBe('sunrise')
    expect(times.isDaylightAtMinutes(times.daylightStartMinutes + 10)).toBe(
      true
    )
    expect(times.phaseAtMinutes(times.sunsetMinutes - 10)).toBe('sunset')
    expect(times.isNightAtMinutes(times.sunsetMinutes + 1)).toBe(true)
  })

  it('builds Amsterdam local noon as the correct UTC instant across offsets', () => {
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
  })

  it('reads the current clock time in Amsterdam from a UTC instant', () => {
    const locationClockTime = getLocationClockTime(
      new Date(Date.UTC(2026, 2, 29, 10, 15, 45)),
      DEFAULT_LOCATION
    )

    expect(locationClockTime.hours).toBe(12)
    expect(locationClockTime.minutes).toBe(15)
    expect(locationClockTime.seconds).toBe(45)
    expect(locationClockTime.totalMinutes).toBe(12 * 60 + 15)
  })

  it('aligns the subsolar longitude with Amsterdam at local solar noon', () => {
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

    expect(Math.abs(sunPosition.longitude - DEFAULT_LOCATION.longitude)).toBeLessThan(
      0.5
    )
  })

  it('keeps the subsolar latitude stable while longitude shifts by half a globe over 12 hours', () => {
    const midnightUtc = getSunPosition(new Date(Date.UTC(2026, 5, 21, 0, 0, 0)))
    const middayUtc = getSunPosition(new Date(Date.UTC(2026, 5, 21, 12, 0, 0)))
    const longitudeDifference = Math.abs(middayUtc.longitude - midnightUtc.longitude)

    expect(Math.abs(middayUtc.latitude - midnightUtc.latitude)).toBeLessThan(0.2)
    expect(Math.abs(longitudeDifference - 180)).toBeLessThan(1)
  })
})
