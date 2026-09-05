import {
  APP_TIME_ZONE,
  buildDateFromDateKeyAndMinutes,
  buildDateKey,
  getCurrentDayTypeForDate,
  getScheduleLabel,
  getSeasonForDate,
  getTodayDescriptor,
  isScheduledForDay,
  normalizeChoreSchedule,
  parseDateKey,
} from '../../../src/lib/today'

describe('today utilities', () => {
  it.each([
    { season: 'spring', month: 2 },
    { season: 'summer', month: 5 },
    { season: 'autumn', month: 8 },
    { season: 'winter', month: 11 },
  ])('classifies the start of $season', ({ season, month }) => {
    // Each local and timezone-aware entry point must agree at month boundaries.
    expect(getSeasonForDate(new Date(2026, month, 1))).toBe(season)
    expect(
      getTodayDescriptor(new Date(Date.UTC(2026, month, 1, 12)), APP_TIME_ZONE)
        .season
    ).toBe(season)
  })

  it('builds and parses local dates without shifting the day', () => {
    expect(buildDateKey(new Date(2026, 2, 6))).toBe('2026-03-06')

    const date = parseDateKey('2026-03-06')

    expect(buildDateKey(date)).toBe('2026-03-06')
    expect(date.getHours()).toBe(12)

    const timedDate = buildDateFromDateKeyAndMinutes(
      '2026-03-06',
      23 * 60 + 15,
      42
    )

    expect(buildDateKey(timedDate)).toBe('2026-03-06')
    expect(timedDate.getHours()).toBe(23)
    expect(timedDate.getMinutes()).toBe(15)
    expect(timedDate.getSeconds()).toBe(42)
  })

  it('normalizes, classifies, and labels chore schedules', () => {
    expect(getCurrentDayTypeForDate(new Date(2026, 2, 6))).toBe('schoolday')
    expect(getCurrentDayTypeForDate(new Date(2026, 2, 7))).toBe('nonschoolday')

    expect(
      normalizeChoreSchedule({
        schoolDayEnabled: false,
        nonSchoolDayEnabled: false,
      })
    ).toEqual({
      schoolDayEnabled: false,
      nonSchoolDayEnabled: false,
    })

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

    expect(getSeasonForDate(new Date(2026, 6, 8))).toBe('summer')
    expect(
      getScheduleLabel({ schoolDayEnabled: true, nonSchoolDayEnabled: true })
    ).toBe('Any day')
    expect(
      getScheduleLabel({ schoolDayEnabled: false, nonSchoolDayEnabled: false })
    ).toBe('Inactive')
  })

  it('describes today using the app timezone and its day boundary', () => {
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

    const boundaryDescriptor = getTodayDescriptor(
      new Date('2026-03-20T23:30:00-07:00'),
      APP_TIME_ZONE
    )

    expect(boundaryDescriptor.dateKey).toBe('2026-03-21')
    expect(boundaryDescriptor.dayType).toBe('nonschoolday')
  })
})
