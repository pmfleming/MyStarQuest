export type CurrentDayType = 'schoolday' | 'nonschoolday'

export type ChoreSchedule = {
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const APP_TIME_ZONE = 'Europe/London'

export const CURRENT_DAY_LABELS: Record<CurrentDayType, string> = {
  schoolday: 'Schoolday',
  nonschoolday: 'Non-school day',
}

export const DEFAULT_CHORE_SCHEDULE: ChoreSchedule = {
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
}

const padDatePart = (value: number) => String(value).padStart(2, '0')

const getDatePartsInTimeZone = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  })

  const parts = formatter.formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
    weekday:
      parts.find((part) => part.type === 'weekday')?.value ??
      date.toLocaleDateString('en-GB', { weekday: 'long', timeZone }),
  }
}

const getSeasonForMonth = (month: number): Season => {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export const buildDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  return `${year}-${month}-${day}`
}

export const parseDateKey = (dateKey: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) {
    throw new Error(`Invalid date key: ${dateKey}`)
  }

  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0)
}

export const buildDateFromDateKeyAndMinutes = (
  dateKey: string,
  totalMinutes: number,
  seconds = 0
) => {
  const date = parseDateKey(dateKey)
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60

  date.setHours(hours, minutes, seconds, 0)
  return date
}

export const getCurrentDayTypeForDate = (date: Date): CurrentDayType => {
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 ? 'nonschoolday' : 'schoolday'
}

export const getSeasonForDate = (date: Date): Season => {
  const month = date.getMonth()

  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export const normalizeChoreSchedule = (value: {
  schoolDayEnabled?: unknown
  nonSchoolDayEnabled?: unknown
  dayType?: unknown
}): ChoreSchedule => {
  const hasExplicitToggles =
    typeof value.schoolDayEnabled === 'boolean' ||
    typeof value.nonSchoolDayEnabled === 'boolean'

  if (hasExplicitToggles) {
    return {
      schoolDayEnabled: value.schoolDayEnabled === true,
      nonSchoolDayEnabled: value.nonSchoolDayEnabled === true,
    }
  }

  const dayType = String(value.dayType ?? '').toLowerCase()

  if (dayType === 'weekday' || dayType === 'schoolday') {
    return { schoolDayEnabled: true, nonSchoolDayEnabled: false }
  }

  if (dayType === 'weekend' || dayType === 'nonschoolday') {
    return { schoolDayEnabled: false, nonSchoolDayEnabled: true }
  }

  if (dayType === 'both' || dayType === 'any') {
    return { schoolDayEnabled: true, nonSchoolDayEnabled: true }
  }

  return { ...DEFAULT_CHORE_SCHEDULE }
}

export const isScheduledForDay = (
  schedule: ChoreSchedule,
  dayType: CurrentDayType
) =>
  dayType === 'schoolday'
    ? schedule.schoolDayEnabled
    : schedule.nonSchoolDayEnabled

export const getScheduleLabel = (schedule: ChoreSchedule) => {
  if (schedule.schoolDayEnabled && schedule.nonSchoolDayEnabled) {
    return 'Any day'
  }

  if (schedule.schoolDayEnabled) {
    return 'Schoolday'
  }

  if (schedule.nonSchoolDayEnabled) {
    return 'Non-school day'
  }

  return 'Inactive'
}

export const getTodayDescriptor = (
  date = new Date(),
  timeZone = APP_TIME_ZONE
) => {
  const parts = getDatePartsInTimeZone(date, timeZone)
  const dateKey = `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`
  const dayType: CurrentDayType =
    parts.weekday === 'Saturday' || parts.weekday === 'Sunday'
      ? 'nonschoolday'
      : 'schoolday'

  return {
    dateKey,
    dayType,
    season: getSeasonForMonth(parts.month),
    dayName: parts.weekday,
    formattedDate: date.toLocaleDateString(undefined, {
      timeZone,
      month: 'long',
      day: 'numeric',
    }),
  }
}
