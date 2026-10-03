import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CALENDAR_SCHEDULE,
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
    for (let i = 1; i < agenda.length; i++)
      expect(agenda[i].start).toBe(agenda[i - 1].end)
    for (const item of classroom) {
      expect(getActivityAtMinute(agenda, item.startMinute)?.id).toBe(item.id)
      expect(getActivityAtMinute(agenda, item.endMinute)?.id).not.toBe(item.id)
    }
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

  it.each(['2026-10-03', '2026-10-05'])(
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
