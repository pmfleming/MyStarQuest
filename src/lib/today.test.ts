import {
  APP_TIME_ZONE,
  buildDateKey,
  getCurrentDayTypeForDate,
  getScheduleLabel,
  getSeasonForDate,
  getTodayDescriptor,
  isScheduledForDay,
  normalizeChoreSchedule,
} from './today'

describe('today utilities', () => {
  it('builds a stable local date key', () => {
    expect(buildDateKey(new Date(2026, 2, 6))).toBe('2026-03-06')
  })

  it('classifies schooldays and non-school days', () => {
    expect(getCurrentDayTypeForDate(new Date(2026, 2, 6))).toBe('schoolday')
    expect(getCurrentDayTypeForDate(new Date(2026, 2, 7))).toBe('nonschoolday')
  })

  it('normalizes legacy and explicit chore schedules', () => {
    expect(normalizeChoreSchedule({ dayType: 'weekday' })).toEqual({
      schoolDayEnabled: true,
      nonSchoolDayEnabled: false,
    })
    expect(
      normalizeChoreSchedule({
        schoolDayEnabled: false,
        nonSchoolDayEnabled: false,
      })
    ).toEqual({
      schoolDayEnabled: false,
      nonSchoolDayEnabled: false,
    })
  })

  it('matches chores against the current day type', () => {
    expect(
      isScheduledForDay(
        { schoolDayEnabled: true, nonSchoolDayEnabled: true },
        'schoolday'
      )
    ).toBe(true)
    expect(
      isScheduledForDay(
        { schoolDayEnabled: true, nonSchoolDayEnabled: false },
        'schoolday'
      )
    ).toBe(true)
    expect(
      isScheduledForDay(
        { schoolDayEnabled: false, nonSchoolDayEnabled: true },
        'schoolday'
      )
    ).toBe(false)
  })

  it('derives season and schedule labels', () => {
    expect(getSeasonForDate(new Date(2026, 6, 8))).toBe('summer')
    expect(
      getScheduleLabel({ schoolDayEnabled: true, nonSchoolDayEnabled: true })
    ).toBe('Any day')
    expect(
      getScheduleLabel({ schoolDayEnabled: false, nonSchoolDayEnabled: false })
    ).toBe('Inactive')
  })

  it('returns a descriptor for today screens', () => {
    const descriptor = getTodayDescriptor(
      new Date('2026-03-08T12:00:00Z'),
      APP_TIME_ZONE
    )

    expect(descriptor.dateKey).toBe('2026-03-08')
    expect(descriptor.dayType).toBe('nonschoolday')
    expect(descriptor.season).toBe('spring')
    expect(descriptor.dayName).toBe('Sunday')
    expect(descriptor.formattedDate).toContain('8')
    expect(descriptor.formattedDate).toMatch(/march/i)
  })

  it('uses the app timezone for the current day boundary', () => {
    const descriptor = getTodayDescriptor(
      new Date('2026-03-20T23:30:00-07:00'),
      APP_TIME_ZONE
    )

    expect(descriptor.dateKey).toBe('2026-03-21')
    expect(descriptor.dayType).toBe('nonschoolday')
  })
})
