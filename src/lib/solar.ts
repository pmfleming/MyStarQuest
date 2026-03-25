const DAY_MS = 24 * 60 * 60 * 1000
const EARTH_AXIAL_TILT_DEGREES = 23.44
const DEFAULT_LATITUDE = 52.3676
const DEFAULT_LONGITUDE = 4.9041
const DEFAULT_TIME_ZONE = 'Europe/Amsterdam'
const ACTUAL_SUN_EVENT_ZENITH = 90.833
const CIVIL_TWILIGHT_ZENITH = 96

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

export type SolarPhase = 'night' | 'sunrise' | 'day' | 'sunset'

export type SolarTimes = {
  sunriseMinutes: number
  daylightStartMinutes: number
  daylightEndMinutes: number
  sunsetMinutes: number
  isDaylightAtMinutes: (minutes: number) => boolean
  isNightAtMinutes: (minutes: number) => boolean
  phaseAtMinutes: (minutes: number) => SolarPhase
}

export const getDayOfYear = (date: Date) => {
  const year = date.getFullYear()
  const startOfYearUtc = Date.UTC(year, 0, 0)
  const currentDayUtc = Date.UTC(
    year,
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0
  )

  return Math.floor((currentDayUtc - startOfYearUtc) / DAY_MS)
}

export const getSolarDeclinationDegrees = (date: Date) => {
  const dayOfYear = getDayOfYear(date)
  return (
    EARTH_AXIAL_TILT_DEGREES *
    Math.sin(toRadians((360 / 365) * (dayOfYear - 81)))
  )
}

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  const zonedUtcMs = Date.UTC(
    getPart('year'),
    getPart('month') - 1,
    getPart('day'),
    getPart('hour'),
    getPart('minute'),
    getPart('second')
  )

  return (zonedUtcMs - date.getTime()) / (60 * 1000)
}

const getFractionalYearRadians = (date: Date) => {
  const dayOfYear = getDayOfYear(date)
  return (2 * Math.PI * (dayOfYear - 1)) / 365
}

const getEquationOfTimeMinutes = (date: Date) => {
  const gamma = getFractionalYearRadians(date)
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  )
}

const getSolarDeclinationRadians = (date: Date) => {
  const gamma = getFractionalYearRadians(date)
  return (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  )
}

const normalizeMinutes = (minutes: number) => ((minutes % 1440) + 1440) % 1440

const getHourAngleDegrees = (
  latitudeDegrees: number,
  declinationRadians: number,
  zenithDegrees: number
) => {
  const latitudeRadians = toRadians(latitudeDegrees)
  const cosHourAngle =
    Math.cos(toRadians(zenithDegrees)) /
      (Math.cos(latitudeRadians) * Math.cos(declinationRadians)) -
    Math.tan(latitudeRadians) * Math.tan(declinationRadians)

  if (cosHourAngle <= -1) return 180
  if (cosHourAngle >= 1) return 0

  return toDegrees(Math.acos(cosHourAngle))
}

const getSolarNoonMinutes = (
  date: Date,
  longitudeDegrees: number,
  timeZone: string
) => {
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone)
  const equationOfTimeMinutes = getEquationOfTimeMinutes(date)

  return 720 - 4 * longitudeDegrees - equationOfTimeMinutes + offsetMinutes
}

export const getAmsterdamSolarTimes = (
  date: Date,
  options?: {
    latitude?: number
    longitude?: number
    timeZone?: string
  }
): SolarTimes => {
  const latitude = options?.latitude ?? DEFAULT_LATITUDE
  const longitude = options?.longitude ?? DEFAULT_LONGITUDE
  const timeZone = options?.timeZone ?? DEFAULT_TIME_ZONE
  const declinationRadians = getSolarDeclinationRadians(date)
  const solarNoonMinutes = getSolarNoonMinutes(date, longitude, timeZone)
  const actualHourAngleDegrees = getHourAngleDegrees(
    latitude,
    declinationRadians,
    ACTUAL_SUN_EVENT_ZENITH
  )
  const civilHourAngleDegrees = getHourAngleDegrees(
    latitude,
    declinationRadians,
    CIVIL_TWILIGHT_ZENITH
  )

  const daylightStartMinutes = normalizeMinutes(
    solarNoonMinutes - actualHourAngleDegrees * 4
  )
  const daylightEndMinutes = normalizeMinutes(
    solarNoonMinutes + actualHourAngleDegrees * 4
  )
  const sunriseMinutes = normalizeMinutes(
    solarNoonMinutes - civilHourAngleDegrees * 4
  )
  const sunsetMinutes = normalizeMinutes(
    solarNoonMinutes + civilHourAngleDegrees * 4
  )

  const phaseAtMinutes = (minutes: number): SolarPhase => {
    const normalized = normalizeMinutes(minutes)

    if (normalized < sunriseMinutes || normalized >= sunsetMinutes) {
      return 'night'
    }

    if (normalized < daylightStartMinutes) {
      return 'sunrise'
    }

    if (normalized < daylightEndMinutes) {
      return 'day'
    }

    return 'sunset'
  }

  return {
    sunriseMinutes,
    daylightStartMinutes,
    daylightEndMinutes,
    sunsetMinutes,
    isDaylightAtMinutes: (minutes) => phaseAtMinutes(minutes) === 'day',
    isNightAtMinutes: (minutes) => phaseAtMinutes(minutes) === 'night',
    phaseAtMinutes,
  }
}
