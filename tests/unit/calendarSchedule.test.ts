import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CALENDAR_SCHEDULE_STORAGE_KEY,
  DEFAULT_CALENDAR_SCHEDULE,
  calendarScheduleSchema,
  getActivityAtMinute,
  getAgendaForDate,
  loadCalendarSchedule,
  saveCalendarSchedule,
  timeToMinutes,
} from '../../src/lib/calendarSchedule'
import { parseDateKey } from '../../src/lib/today'
import { themes } from '../../src/contexts/ThemeContext'
import { getImageForTime } from '../../src/features/dayNightExplorer/dayNightExplorerBackdrop'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})
const agendaFor = (day: string) =>
  getAgendaForDate(DEFAULT_CALENDAR_SCHEDULE, parseDateKey(day))

describe('weekly calendar', () => {
  it.each([
    ['2026-09-21', '14:45'],
    ['2026-09-22', '14:45'],
    ['2026-09-23', '12:15'],
    ['2026-09-24', '14:45'],
    ['2026-09-25', '12:00'],
  ])('uses the school hours for %s', (day, end) => {
    expect(
      agendaFor(day).filter(({ activity }) => activity === 'schooltime')
    ).toEqual([expect.objectContaining({ start: '08:30', end })])
  })

  it.each([
    ['2026-09-23', 'judo', '14:15', '15:00'],
    ['2026-09-24', 'piano', '16:20', '16:50'],
    ['2026-09-25', 'swimming', '15:30', '16:15'],
    ['2026-09-26', 'ballet', '10:45', '11:30'],
  ])(
    'shows the right lesson on %s and switches exactly at its boundaries',
    (day, activity, start, end) => {
      const agenda = agendaFor(day)
      expect(agenda.filter(({ kind }) => kind === 'activity')).toEqual([
        expect.objectContaining({ activity, start, end }),
      ])
      expect(
        getActivityAtMinute(agenda, timeToMinutes(start) - 1)?.activity
      ).toBe('playing')
      expect(getActivityAtMinute(agenda, timeToMinutes(start))?.activity).toBe(
        activity
      )
      expect(
        getActivityAtMinute(agenda, timeToMinutes(end) - 1)?.activity
      ).toBe(activity)
      expect(getActivityAtMinute(agenda, timeToMinutes(end))?.activity).toBe(
        'playing'
      )
      for (const theme of Object.values(themes)) {
        expect(
          getImageForTime(timeToMinutes(start), theme.activityImages, agenda)
        ).toBe(
          theme.activityImages?.[
            activity as 'judo' | 'piano' | 'swimming' | 'ballet'
          ]
        )
      }
    }
  )

  it('removes school and journeys on weekends and holidays, retaining lessons', () => {
    for (const day of ['2026-09-26', '2026-09-27']) {
      expect(agendaFor(day).some(({ kind }) => kind === 'school')).toBe(false)
    }
    const holiday = getAgendaForDate(
      DEFAULT_CALENDAR_SCHEDULE,
      parseDateKey('2026-09-23'),
      {
        '2026-09-23': { isNonSchoolDay: true },
      }
    )
    expect(holiday.some(({ kind }) => kind === 'school')).toBe(false)
    expect(holiday.some(({ activity }) => activity === 'judo')).toBe(true)
    expect(getActivityAtMinute(holiday, 510)?.activity).toBe('playing')
    expect(
      agendaFor('2026-09-27').some(({ kind }) => kind === 'activity')
    ).toBe(false)
  })

  it('resolves each default day without gaps, overlaps, or mutations', () => {
    const original = JSON.stringify(DEFAULT_CALENDAR_SCHEDULE)
    for (let day = 21; day <= 27; day++) {
      const agenda = agendaFor(`2026-09-${day}`)
      expect(agenda[0]?.startMinute).toBe(0)
      expect(agenda.at(-1)?.endMinute).toBe(1440)
      agenda.forEach((event, index) => {
        expect(event.endMinute).toBeGreaterThan(event.startMinute)
        if (index) expect(event.startMinute).toBe(agenda[index - 1]?.endMinute)
      })
    }
    expect(JSON.stringify(DEFAULT_CALENDAR_SCHEDULE)).toBe(original)
    expect(getActivityAtMinute(agendaFor('2026-09-21'), 450)?.activity).toBe(
      'eatingBreakfast'
    )
    expect(getActivityAtMinute(agendaFor('2026-09-21'), 510)?.activity).toBe(
      'schooltime'
    )
    expect(getActivityAtMinute(agendaFor('2026-09-21'), 1440)?.activity).toBe(
      'bedtime'
    )
  })

  it('leaves deliberate gaps and empty schedules empty', () => {
    const schedule = {
      version: 1 as const,
      events: DEFAULT_CALENDAR_SCHEDULE.events.filter(
        ({ id }) => id === 'piano'
      ),
    }
    const agenda = getAgendaForDate(schedule, parseDateKey('2026-09-24'))
    expect(agenda).toHaveLength(1)
    expect(
      getImageForTime(600, themes.princess.activityImages, agenda)
    ).toBeNull()
    expect(
      getAgendaForDate({ version: 1, events: [] }, parseDateKey('2026-09-24'))
    ).toEqual([])
  })
})

describe('schedule storage contract', () => {
  it('round-trips edited JSON through storage', () => {
    const edited = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    edited.events.find(({ id }) => id === 'piano')!.start = '16:10'
    saveCalendarSchedule(edited)
    expect(loadCalendarSchedule()).toEqual(edited)
    expect(
      JSON.parse(localStorage.getItem(CALENDAR_SCHEDULE_STORAGE_KEY)!)
    ).toEqual(edited)
  })

  it.each([
    '{broken',
    '{"version":2,"events":[]}',
    '{"version":1,"events":[{}]}',
  ])('preserves bad data and falls back safely: %s', (raw) => {
    localStorage.setItem(CALENDAR_SCHEDULE_STORAGE_KEY, raw)
    expect(loadCalendarSchedule()).toEqual(DEFAULT_CALENDAR_SCHEDULE)
    expect(localStorage.getItem(CALENDAR_SCHEDULE_STORAGE_KEY)).toBe(raw)
  })

  it('can read defaults with blocked storage and does not silently swallow save failure', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(loadCalendarSchedule()).toEqual(DEFAULT_CALENDAR_SCHEDULE)
    expect(() => saveCalendarSchedule(DEFAULT_CALENDAR_SCHEDULE)).toThrow(
      'full'
    )
  })

  it.each([
    { start: '08:80' },
    { end: '25:00' },
    { start: '24:00' },
    { start: '23:00', end: '07:00' },
    { weekdays: [7] },
    { weekdays: [1, 1] },
    { weekdays: [] },
    { activity: 'unknown' },
  ])('rejects invalid editor input %j before saving', (change) => {
    const data = {
      version: 1,
      events: [{ ...DEFAULT_CALENDAR_SCHEDULE.events[0], ...change }],
    }
    expect(calendarScheduleSchema.safeParse(data).success).toBe(false)
  })

  it('rejects duplicate IDs', () => {
    expect(
      calendarScheduleSchema.safeParse({
        version: 1,
        events: [
          DEFAULT_CALENDAR_SCHEDULE.events[0],
          DEFAULT_CALENDAR_SCHEDULE.events[0],
        ],
      }).success
    ).toBe(false)
  })
})
