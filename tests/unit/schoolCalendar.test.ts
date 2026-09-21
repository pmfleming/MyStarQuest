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
  it('uses the same exclusive date range for initial and recurring events', () => {
    const now = new Date('2026-09-01T12:00:00Z')
    const between = vi.fn(() => [new Date('2026-09-14T22:00:00Z')])
    const event = makeEvent({ rrule: { between } as Event['rrule'] })
    const calendar = buildSchoolCalendar({ event }, now)
    expect(Object.keys(calendar)).toEqual([
      '2026-09-08',
      '2026-09-09',
      '2026-09-15',
      '2026-09-16',
    ])
    expect(Object.values(calendar)).toEqual(
      Array(4).fill(
        expect.objectContaining({
          summaries: ['Holiday'],
          hasAllDayEvent: true,
          isNonSchoolDay: true,
        })
      )
    )
    expect(between).toHaveBeenCalledWith(now, new Date(2027, 8, 1))
  })

  it('merges overlapping summaries and all-day flags, including zero-duration events', () => {
    const assembly = makeEvent({
      start: new Date('2026-09-08T09:00:00Z'),
      end: undefined,
      datetype: 'date-time',
      summary: { params: { LANGUAGE: 'en' }, val: 'Assembly' },
    })
    const calendar = buildSchoolCalendar({
      assembly,
      duplicate: assembly,
      holiday: makeEvent(),
    })
    expect(calendar['2026-09-08']).toMatchObject({
      summaries: ['Assembly', 'Holiday'],
      hasAllDayEvent: true,
      isNonSchoolDay: true,
    })
    expect(buildSchoolCalendar({ assembly })['2026-09-08'].isNonSchoolDay).toBe(
      false
    )
  })

  it.each(['Unknown school assembly'])(
    'keeps all-day %s as a school activity',
    (summary) => {
      const calendar = buildSchoolCalendar({ event: makeEvent({ summary }) })
      expect(calendar['2026-09-08'].isNonSchoolDay).toBe(false)
      expect(calendar['2026-09-08'].events[0]).toMatchObject({
        summary,
        allDay: true,
      })
    }
  )

  it('keeps early finishes as school days and preserves their times', () => {
    const calendar = buildSchoolCalendar({
      event: makeEvent({
        summary: 'Alle leerlingen om 12:00 uur vrij',
        datetype: 'date-time',
        start: new Date('2026-12-18T11:00:00Z'),
        end: new Date('2026-12-18T13:45:00Z'),
      }),
    })
    expect(calendar['2026-12-18']).toMatchObject({
      isNonSchoolDay: false,
      events: [{ start: '2026-12-18T11:00:00.000Z', allDay: false }],
    })
  })

  it('respects floating all-day ends across the autumn DST transition', () => {
    const calendar = buildSchoolCalendar({
      event: makeEvent({
        summary: 'Herfstvakantie',
        start: new Date('2026-10-23T00:00:00Z'),
        end: new Date('2026-10-27T00:00:00Z'),
      }),
    })
    expect(Object.keys(calendar)).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ])
  })

  it('retains both an activity and a day off on the same date', () => {
    const calendar = buildSchoolCalendar({
      meeting: makeEvent({
        uid: 'meeting',
        summary: '1-2a startgesprekken (met kind)',
      }),
      training: makeEvent({
        uid: 'training',
        summary: 'Studiedag (leerlingen vrij)',
      }),
    })
    expect(calendar['2026-09-08'].isNonSchoolDay).toBe(true)
    expect(calendar['2026-09-08'].events).toHaveLength(2)
  })
})
