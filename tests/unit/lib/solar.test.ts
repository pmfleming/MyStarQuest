import {
  getAmsterdamSolarTimes,
  getDayOfYear,
  getSolarDeclinationDegrees,
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
    const times = getAmsterdamSolarTimes(new Date(2026, 2, 25))

    expect(times.sunriseMinutes).toBeLessThan(times.daylightStartMinutes)
    expect(times.daylightStartMinutes).toBeLessThan(times.daylightEndMinutes)
    expect(times.daylightEndMinutes).toBeLessThan(times.sunsetMinutes)
    expect(times.phaseAtMinutes(times.sunriseMinutes)).toBe('sunrise')
    expect(times.phaseAtMinutes(times.daylightStartMinutes)).toBe('day')
    expect(times.phaseAtMinutes(times.daylightEndMinutes)).toBe('sunset')
  })

  it('uses sunrise and sunset as the expanded dawn and twilight windows', () => {
    const times = getAmsterdamSolarTimes(new Date(2026, 5, 21))

    expect(times.isNightAtMinutes(times.sunriseMinutes - 1)).toBe(true)
    expect(times.phaseAtMinutes(times.sunriseMinutes + 10)).toBe('sunrise')
    expect(times.isDaylightAtMinutes(times.daylightStartMinutes + 10)).toBe(
      true
    )
    expect(times.phaseAtMinutes(times.sunsetMinutes - 10)).toBe('sunset')
    expect(times.isNightAtMinutes(times.sunsetMinutes + 1)).toBe(true)
  })
})
