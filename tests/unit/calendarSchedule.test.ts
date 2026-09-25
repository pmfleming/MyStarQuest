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
    expect(
      agenda.find(({ activity }) => activity === 'schooltime')
    ).toMatchObject({ start: '08:30', end: '12:00' })
    expect(agenda.find(({ id }) => id === 'home-friday')).toMatchObject({
      start: '12:00',
      end: '12:30',
    })
    expect(
      agenda.find(({ activity }) => activity === 'swimming')
    ).toMatchObject({ start: '15:30', end: '16:15' })
    expect(getActivityAtMinute(agenda, 720)?.activity).toBe('commute')
    expect(getActivityAtMinute(agenda, 750)?.activity).toBe('playing')
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
