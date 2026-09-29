import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CALENDAR_SCHEDULE,
  calendarScheduleSchema,
  getActivityAtMinute,
  getAgendaForDate,
} from '../../src/lib/calendarSchedule'
import { parseDateKey } from '../../src/lib/today'

describe('weekly calendar', () => {
  it('shortens a custom school day at noon and moves the journey home, retaining lessons', () => {
    const schedule = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    schedule.events.find(({ id }) => id === 'school-friday')!.end = '14:45'
    Object.assign(
      schedule.events.find(({ id }) => id === 'home-friday')!,
      { start: '14:45', end: '15:15' }
    )
    const agenda = getAgendaForDate(schedule, parseDateKey('2026-12-18'), {
      '2026-12-18': {
        isNonSchoolDay: false,
        summaries: ['Alle leerlingen om 12:00 uur vrij'],
      },
    })
    const classroom = agenda.filter(({ id }) => id.startsWith('school-friday-'))
    expect(classroom).toHaveLength(6)
    expect(classroom[0].start).toBe('08:30')
    expect(classroom.at(-1)?.end).toBe('12:00')
    expect(classroom.map(({ end }) => end)).toEqual([
      '09:00',
      '09:45',
      '10:15',
      '10:45',
      '11:30',
      '12:00',
    ])
    expect(agenda.find(({ id }) => id === 'home-friday')).toMatchObject({
      start: '12:00',
      end: '12:30',
    })
    expect(
      agenda.find(({ activity }) => activity === 'swimming')
    ).toMatchObject({ start: '15:30', end: '16:15' })
    expect(getActivityAtMinute(agenda, 720)?.activity).toBe('goingHome')
    expect(getActivityAtMinute(agenda, 750)?.activity).toBe('playing')
  })

  it.each([
    ['2026-09-28', '14:45', 9],
    ['2026-09-29', '14:45', 9],
    ['2026-09-30', '12:15', 6],
    ['2026-10-01', '14:45', 9],
    ['2026-10-02', '12:00', 6],
  ])(
    'fills school hours on %s in poster order, ending at %s',
    (date, end, count) => {
      const agenda = getAgendaForDate(
        DEFAULT_CALENDAR_SCHEDULE,
        parseDateKey(date)
      )
      const classroom = agenda.filter(({ schoolDayPlan }) => schoolDayPlan)
      expect(classroom.map(({ activity }) => activity)).toEqual([
        'tableWork',
        'circleTime',
        'outdoorPlay',
        'fruitSnack',
        'choiceTime',
        'outdoorPlay',
        ...(count === 9 ? ['schoolLunch', 'circleTime', 'choiceTime'] : []),
      ])
      expect(classroom[0].start).toBe('08:30')
      expect(classroom.at(-1)?.end).toBe(end)
      const morningDurations = classroom
        .slice(0, 6)
        .map(({ startMinute, endMinute }) => endMinute - startMinute)
      expect(
        Math.max(...morningDurations) - Math.min(...morningDurations)
      ).toBeLessThanOrEqual(15)
      if (count === 9) {
        expect(classroom[6].start).toBe('12:15')
        expect(
          classroom
            .slice(6)
            .map(({ startMinute, endMinute }) => endMinute - startMinute)
        ).toEqual([45, 60, 45])
      }
      for (let i = 1; i < agenda.length; i++)
        expect(agenda[i].start).toBe(agenda[i - 1].end)
      for (const item of classroom) {
        expect(item.startMinute % 15).toBe(0)
        expect(item.endMinute % 15).toBe(0)
        expect(getActivityAtMinute(agenda, item.startMinute)?.id).toBe(item.id)
        expect(getActivityAtMinute(agenda, item.endMinute)?.id).not.toBe(
          item.id
        )
      }
      expect(
        agenda.find(({ activity }) => activity === 'goingHome')?.start
      ).toBe(end)
    }
  )

  it.each(['2026-10-03', '2026-10-04', '2026-10-05'])(
    'omits the classroom and school journeys on days off: %s',
    (date) => {
      const agenda = getAgendaForDate(
        DEFAULT_CALENDAR_SCHEDULE,
        parseDateKey(date),
        {
          '2026-10-05': { isNonSchoolDay: true, summaries: ['Studiedag'] },
        }
      )
      expect(agenda.some(({ schoolDaysOnly }) => schoolDaysOnly)).toBe(false)
    }
  )

  it('keeps generic saved school blocks and empty schedules compatible', () => {
    const schedule = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    for (const event of schedule.events) delete event.schoolDayPlan
    expect(
      getAgendaForDate(schedule, parseDateKey('2026-09-28')).find(
        ({ activity }) => activity === 'schooltime'
      )
    ).toMatchObject({ start: '08:30', end: '14:45' })
    expect(
      getAgendaForDate({ version: 1, events: [] }, parseDateKey('2026-09-28'))
    ).toEqual([])
  })

  it('lets lessons interrupt classroom activities without losing the surrounding time', () => {
    const schedule = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    Object.assign(
      schedule.events.find(({ id }) => id === 'piano')!,
      { start: '08:45', end: '09:00' }
    )
    const agenda = getAgendaForDate(schedule, parseDateKey('2026-10-01'))
    expect(getActivityAtMinute(agenda, 524)?.activity).toBe('tableWork')
    expect(getActivityAtMinute(agenda, 525)?.activity).toBe('piano')
    expect(getActivityAtMinute(agenda, 540)?.activity).toBe('tableWork')
  })
})

describe('schedule storage contract', () => {
  it.each([{ start: '23:00', end: '07:00' }])(
    'rejects invalid editor input %j before saving',
    (change) => {
      const data = {
        version: 1,
        events: [{ ...DEFAULT_CALENDAR_SCHEDULE.events[0], ...change }],
      }
      expect(calendarScheduleSchema.safeParse(data).success).toBe(false)
    }
  )
})
