export type CurrentDayType = 'schoolday' | 'nonschoolday'

export type ChoreSchedule = {
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export const CURRENT_DAY_LABELS: Record<CurrentDayType, string> = {
  schoolday: 'Schoolday',
  nonschoolday: 'Non-school day',
}

export const DEFAULT_CHORE_SCHEDULE: ChoreSchedule = {
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
}

const padDatePart = (value: number) => String(value).padStart(2, '0')

export const buildDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())
  return `${year}-${month}-${day}`
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

export const getTodayDescriptor = (date = new Date()) => ({
  dateKey: buildDateKey(date),
  dayType: getCurrentDayTypeForDate(date),
  season: getSeasonForDate(date),
  dayName: date.toLocaleDateString(undefined, { weekday: 'long' }),
  formattedDate: date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  }),
})
