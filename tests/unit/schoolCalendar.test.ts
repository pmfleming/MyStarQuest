import { describe, expect, it, vi } from 'vitest'
import { buildSchoolCalendar } from '../../functions/src/schoolCalendar'

type Event = Extract<
  Parameters<typeof buildSchoolCalendar>[0][string],
  { type: 'VEVENT' }
>
const makeEvent = (patch: Partial<Event> = {}): Event => ({
  type: 'VEVENT',
  uid: 'school-event',
  dtstamp: new Date('2026-09-01T00:00:00Z'),
  start: new Date('2026-09-07T22:00:00Z'),
  end: new Date('2026-09-09T22:00:00Z'),
  datetype: 'date',
  summary: 'Holiday',
  ...patch,
})

describe('school calendar event expansion', () => {
  it('expands initial and recurring all-day events with exclusive ends across DST', () => {
    const now = new Date('2026-10-01T12:00:00Z')
    const between = vi.fn(() => [new Date('2026-10-30T00:00:00Z')])
    const event = makeEvent({
      start: new Date('2026-10-23T00:00:00Z'),
      end: new Date('2026-10-27T00:00:00Z'),
      rrule: { between } as Event['rrule'],
    })
    const assembly = makeEvent({
      start: new Date('2026-10-23T09:00:00Z'),
      end: undefined,
      datetype: 'date-time',
      summary: { params: { LANGUAGE: 'en' }, val: 'constructor' },
    })
    const calendar = buildSchoolCalendar(
      { event, assembly, duplicate: assembly },
      now
    )
    expect(Object.keys(calendar)).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ])
    expect(Object.values(calendar)).toEqual(
      Array(8).fill(
        expect.objectContaining({
          hasAllDayEvent: true,
          isNonSchoolDay: true,
        })
      )
    )
    expect(calendar['2026-10-23'].summaries).toEqual(['Holiday', 'constructor'])
    expect(buildSchoolCalendar({ assembly })['2026-10-23'].isNonSchoolDay).toBe(
      false
    )
    expect(between).toHaveBeenCalledWith(now, new Date(2027, 9, 1))
  })
})
