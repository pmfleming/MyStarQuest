import { describe, expect, it } from 'vitest'
import {
  type CalendarHistoryEntry,
  type HistoryPeriod,
  type HistoryView,
  buildCalendarHistory,
  historyRange,
  selectCalendarHistory,
  shiftHistoryDate,
} from '../../src/lib/calendarHistory'

const event = (id: string, dateKey: string, taskCollection = 'chores') => ({
  id,
  data: {
    taskId: 'task',
    taskTitle: 'Original title',
    childId: 'child',
    taskCollection,
    dateKey,
    delta: 2,
  },
})
describe('calendar history', () => {
  it.each([null, 'invalid', {}, new Date(NaN)])(
    'rejects malformed timestamp conversion results: %s',
    (result) => {
      expect(
        buildCalendarHistory(
          [],
          [{ id: 'bad', data: { createdAt: { toDate: () => result } } }],
          [],
          [],
          [],
          'Europe/London'
        )
      ).toEqual([])
    }
  )
  it('preserves historical titles after edits or deletion and includes zero-star completions', () => {
    const history = buildCalendarHistory(
      [
        event('one', '2026-10-22'),
        {
          ...event('two', '2026-10-22', 'tests'),
          data: { ...event('two', '2026-10-22', 'tests').data, delta: 0 },
        },
      ],
      [
        {
          id: 'gift',
          data: {
            rewardTitle: 'Deleted gift',
            costStars: 5,
            occurredAt: Date.parse('2026-10-22T10:00:00Z'),
          },
        },
      ],
      [{ id: 'task', data: { title: 'Renamed chore' } }],
      [],
      [],
      'Europe/Amsterdam'
    )
    expect(history.map((item) => item.title)).toEqual([
      'Deleted gift',
      'Original title',
      'Original title',
    ])
    expect(history.find((item) => item.kind === 'tests')?.stars).toBe(0)
    expect(history[0]?.dateKey).toBe('2026-10-22')
  })
  it('uses the child timezone and original offline occurrence, while respecting stored task days', () => {
    const history = buildCalendarHistory(
      [
        {
          id: 'test',
          data: {
            taskCollection: 'tests',
            dateKey: '2026-10-20',
            createdAt: { toDate: () => new Date('2026-10-22T23:30:00Z') },
          },
        },
      ],
      [
        {
          id: 'gift',
          data: {
            title: 'Gift',
            occurredAt: Date.parse('2026-10-21T22:30:00Z'),
            createdAt: Date.parse('2026-10-23T10:00:00Z'),
          },
        },
        { id: 'invalid', data: {} },
      ],
      [],
      [],
      [],
      'Europe/Amsterdam'
    )
    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({
      title: 'Gift',
      dateKey: '2026-10-22',
      time: '00:30',
    })
    expect(history[1]?.dateKey).toBe('2026-10-20')
  })
  it('resolves legacy records where possible without inventing a type for deleted tasks', () => {
    const history = buildCalendarHistory(
      [
        { id: 'old', data: { taskId: 'math', dateKey: '2026-10-22' } },
        { id: 'missing', data: { taskId: 'deleted', dateKey: '2026-10-22' } },
      ],
      [],
      [],
      [{ id: 'math', data: { title: 'Maths', taskType: 'math' } }],
      [],
      'Europe/London'
    )
    expect(history.find((item) => item.title === 'Maths')?.kind).toBe('tests')
    expect(history.find((item) => item.kind === 'activity')?.title).toBe(
      'Completed activity'
    )
  })
  it('filters exact calendar periods with Monday-first weeks across years and leap months', () => {
    expect(historyRange('2027-01-01', 'week')).toEqual({
      start: '2026-12-28',
      end: '2027-01-03',
    })
    expect(historyRange('2028-02-15', 'month')).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    })
    expect(historyRange('2026-10-22', 'year')).toEqual({
      start: '2026-01-01',
      end: '2026-12-31',
    })
    const history = buildCalendarHistory(
      [
        event('before', '2026-12-27'),
        event('start', '2026-12-28'),
        event('end', '2027-01-03'),
        event('after', '2027-01-04'),
        event('test', '2027-01-01', 'tests'),
      ],
      [],
      [],
      [],
      [],
      'Europe/London'
    )
    expect(
      selectCalendarHistory(history, '2027-01-01', 'chores', 'week').map(
        (item) => item.id
      )
    ).toEqual(['task-end', 'task-start'])
    expect(
      selectCalendarHistory(history, '2027-01-01', 'all', 'day')
    ).toHaveLength(1)
    expect(shiftHistoryDate('2028-02-29', 'year', 1)).toBe('2029-02-28')
    expect(shiftHistoryDate('2026-01-31', 'month', 1)).toBe('2026-02-28')
    expect(shiftHistoryDate('2026-03-29', 'week', 1)).toBe('2026-04-05')
  })
})

describe('calendar filter combinations', () => {
  const dates = [
    '2025-12-31',
    '2026-01-01',
    '2026-09-30',
    '2026-10-01',
    '2026-10-18',
    '2026-10-19',
    '2026-10-22',
    '2026-10-25',
    '2026-10-26',
    '2026-10-31',
    '2026-11-01',
    '2026-12-31',
    '2027-01-01',
  ]
  const entries: CalendarHistoryEntry[] = dates.flatMap((dateKey) =>
    (['chores', 'tests', 'rewards'] as const).map((kind, index) => ({
      id: `${dateKey}/${kind}`,
      kind,
      dateKey,
      title: kind,
      timestamp: 0,
      stars: index + 1,
      imageKey: '',
      taskType: '',
      pending: false,
      outcome: 'success',
    }))
  )
  const expectedDates = {
    day: ['2026-10-22'],
    week: ['2026-10-19', '2026-10-22', '2026-10-25'],
    month: [
      '2026-10-01',
      '2026-10-18',
      '2026-10-19',
      '2026-10-22',
      '2026-10-25',
      '2026-10-26',
      '2026-10-31',
    ],
    year: dates.slice(1, -1),
  }
  const cases: [HistoryView, HistoryPeriod, string[]][] = [
    ...(['all', 'completed', 'chores', 'tests'] as const).flatMap((view) =>
      (['day', 'week', 'month'] as const).map(
        (period) =>
          [
            view,
            period,
            view === 'all'
              ? ['chores', 'tests', 'rewards']
              : view === 'completed'
                ? ['chores', 'tests']
                : [view],
          ] as [HistoryView, HistoryPeriod, string[]]
      )
    ),
    ...(['day', 'month', 'year'] as const).map(
      (period) =>
        ['rewards', period, ['rewards']] as [
          HistoryView,
          HistoryPeriod,
          string[],
        ]
    ),
  ]
  it.each(cases)(
    '%s / %s includes only matching kinds within inclusive boundaries',
    (view, period, kinds) => {
      const selected = selectCalendarHistory(
        entries,
        '2026-10-22',
        view,
        period
      )
      expect(selected.map((entry) => entry.id)).toEqual(
        expectedDates[period].flatMap((date) =>
          kinds.map((kind) => `${date}/${kind}`)
        )
      )
      expect(new Set(selected.map((entry) => entry.id)).size).toBe(
        selected.length
      )
    }
  )
})
