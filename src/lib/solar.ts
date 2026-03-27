const DAY_MS = 24 * 60 * 60 * 1000
const ACTUAL_SUN_EVENT_ZENITH = 90.833
const CIVIL_TWILIGHT_ZENITH = 96

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

const timeZoneFormatters = new Map<string, Intl.DateTimeFormat>()

export type SolarPhase = 'night' | 'sunrise' | 'day' | 'sunset'

export type SolarLocation = {
  latitude: number
  longitude: number
  timeZone: string
}

export type SunPosition = {
  latitude: number
  longitude: number
}

export type LocationClockTime = {
  hours: number
  minutes: number
  seconds: number
  totalMinutes: number
}

export const DEFAULT_LOCATION: SolarLocation = {
  latitude: 52.3676,
  longitude: 4.9041,
  timeZone: 'Europe/Amsterdam',
}

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

const getTimeZoneFormatter = (timeZone: string) => {
  const cached = timeZoneFormatters.get(timeZone)

  if (cached) {
    return cached
  }

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

  timeZoneFormatters.set(timeZone, formatter)
  return formatter
}

const getTimeZoneOffsetMinutes = (date: Date, timeZone: string) => {
  const formatter = getTimeZoneFormatter(timeZone)
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

export const getLocationClockTime = (
  date: Date,
  location: SolarLocation = DEFAULT_LOCATION
): LocationClockTime => {
  const formatter = getTimeZoneFormatter(location.timeZone)
  const parts = formatter.formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  const hours = getPart('hour')
  const minutes = getPart('minute')
  const seconds = getPart('second')

  return {
    hours,
    minutes,
    seconds,
    totalMinutes: hours * 60 + minutes,
  }
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

export const getSolarDeclinationDegrees = (date: Date) =>
  toDegrees(getSolarDeclinationRadians(date))

const normalizeMinutes = (minutes: number) => ((minutes % 1440) + 1440) % 1440

const normalizeLongitudeDegrees = (degrees: number) =>
  ((((degrees + 180) % 360) + 360) % 360) - 180

const normalizeClockTime = (totalMinutes: number, seconds: number) => {
  const totalSeconds = Math.round(totalMinutes * 60 + seconds)
  const normalizedTotalSeconds =
    ((totalSeconds % (24 * 60 * 60)) + 24 * 60 * 60) % (24 * 60 * 60)

  return {
    hours: Math.floor(normalizedTotalSeconds / 3600),
    minutes: Math.floor((normalizedTotalSeconds % 3600) / 60),
    seconds: normalizedTotalSeconds % 60,
  }
}

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

export const buildLocationDateTime = (
  date: Date,
  totalMinutes: number,
  seconds = 0,
  location: SolarLocation = DEFAULT_LOCATION
) => {
  const { hours, minutes, seconds: normalizedSeconds } = normalizeClockTime(
    totalMinutes,
    seconds
  )
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const localUtcMs = Date.UTC(
    year,
    month,
    day,
    hours,
    minutes,
    normalizedSeconds,
    0
  )

  let resolvedUtcMs = localUtcMs

  for (let i = 0; i < 3; i++) {
    const offsetMinutes = getTimeZoneOffsetMinutes(
      new Date(resolvedUtcMs),
      location.timeZone
    )
    const nextUtcMs = localUtcMs - offsetMinutes * 60 * 1000

    if (nextUtcMs === resolvedUtcMs) {
      break
    }

    resolvedUtcMs = nextUtcMs
  }

  return new Date(resolvedUtcMs)
}

export const getSolarTimes = (
  date: Date,
  location: SolarLocation = DEFAULT_LOCATION
): SolarTimes => {
  const declinationRadians = getSolarDeclinationRadians(date)
  const solarNoonMinutes = getSolarNoonMinutes(
    date,
    location.longitude,
    location.timeZone
  )
  const actualHourAngleDegrees = getHourAngleDegrees(
    location.latitude,
    declinationRadians,
    ACTUAL_SUN_EVENT_ZENITH
  )
  const civilHourAngleDegrees = getHourAngleDegrees(
    location.latitude,
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

export const getAmsterdamSolarTimes = getSolarTimes

export const getSunPosition = (date: Date): SunPosition => {
  const utcMinutes =
    date.getUTCHours() * 60 +
    date.getUTCMinutes() +
    date.getUTCSeconds() / 60 +
    date.getUTCMilliseconds() / (60 * 1000)
  const equationOfTimeMinutes = getEquationOfTimeMinutes(date)

  return {
    latitude: getSolarDeclinationDegrees(date),
    longitude: normalizeLongitudeDegrees(
      (720 - utcMinutes - equationOfTimeMinutes) / 4
    ),
  }
}
