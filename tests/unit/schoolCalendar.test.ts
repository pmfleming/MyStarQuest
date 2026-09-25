import { describe, expect, it, vi } from 'vitest'
import { buildSchoolCalendar } from '../../functions/src/schoolCalendar'
import { classifySchoolEvent } from '../../functions/src/schoolEventCatalog'

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
  it('normalizes known titles without closing school for unknown or inherited names', () => {
    expect(
      classifySchoolEvent('  ALLE leerlingen  om 12:00 uur vrij  ')
    ).toMatchObject({
      kind: 'early-finish',
      releaseTime: '12:00',
      artwork: 'early-finish',
    })
    expect(classifySchoolEvent('Studiedag extra')).toMatchObject({
      kind: 'day-off',
    })
    for (const summary of [
      'constructor',
      '__proto__',
      'Holiday extra',
      'Studiedagen',
    ])
      expect(classifySchoolEvent(summary)).toEqual({
        titleNl: summary,
        titleEn: 'School Event',
        kind: 'activity',
      })
  })

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
})
