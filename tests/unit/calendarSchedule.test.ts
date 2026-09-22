import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CALENDAR_SCHEDULE_STORAGE_KEY,
  DEFAULT_CALENDAR_SCHEDULE,
  calendarScheduleSchema,
  getActivityAtMinute,
  getAgendaForDate,
  loadCalendarSchedule,
  saveCalendarSchedule,
} from '../../src/lib/calendarSchedule'
import { parseDateKey } from '../../src/lib/today'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})
const agendaFor = (day: string) =>
  getAgendaForDate(DEFAULT_CALENDAR_SCHEDULE, parseDateKey(day))

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
})

describe('schedule storage contract', () => {
  it.each(['{broken'])(
    'preserves bad data and falls back safely: %s',
    (raw) => {
      localStorage.setItem(CALENDAR_SCHEDULE_STORAGE_KEY, raw)
      expect(loadCalendarSchedule()).toEqual(DEFAULT_CALENDAR_SCHEDULE)
      expect(localStorage.getItem(CALENDAR_SCHEDULE_STORAGE_KEY)).toBe(raw)
    }
  )

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
