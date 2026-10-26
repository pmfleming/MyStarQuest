import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import { themes } from '../../src/contexts/ThemeContext'
import {
  CALENDAR_SCHEDULE_STORAGE_KEY,
  DEFAULT_CALENDAR_SCHEDULE,
  saveCalendarSchedule,
} from '../../src/lib/calendarSchedule'
import {
  createSchoolCalendarStore,
  schoolCalendarStore,
} from '../../src/lib/schoolCalendarStore'
import { getSchoolEventImage } from '../../src/ui/schoolEventAssets'
import { getThemeAsset } from '../../src/ui/themeAssets'
import {
  buildCalendarHistory,
  type CalendarHistoryEntry,
} from '../../src/lib/calendarHistory'

const historyState = vi.hoisted(() => ({
  entries: [] as CalendarHistoryEntry[],
}))

vi.mock('../../src/hooks/useCalendarHistory', () => ({
  useCalendarHistory: () => ({
    entries: historyState.entries,
    childId: 'child',
    loading: false,
    error: false,
  }),
}))

const selection = vi.hoisted(() => ({
  selectedDateKey: '2026-09-09',
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => selection,
}))

beforeEach(() => {
  historyState.entries = []
  const store = createSchoolCalendarStore()
  vi.spyOn(schoolCalendarStore, 'getSnapshot').mockImplementation(
    store.getSnapshot
  )
  vi.spyOn(schoolCalendarStore, 'subscribe').mockImplementation(store.subscribe)
  vi.spyOn(schoolCalendarStore, 'start').mockImplementation(store.start)
  vi.spyOn(schoolCalendarStore, 'refresh').mockImplementation(store.refresh)
  selection.selectedDateKey = '2026-09-09'
  selection.setSelectedDateKey.mockClear()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('uses the same day, week and month for the grid, agenda, chores and tests across month boundaries', async () => {
  selection.selectedDateKey = '2026-09-30'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
  saveCalendarSchedule({
    version: 1,
    events: [
      {
        id: 'daily',
        title: 'Daily play',
        activity: 'playing',
        kind: 'routine',
        start: '16:00',
        end: '17:00',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        schoolDaysOnly: false,
      },
    ],
  })
  historyState.entries = buildCalendarHistory(
    ['2026-09-01', '2026-09-30', '2026-10-01', '2026-10-08'].flatMap(
      (dateKey) =>
        ['chores', 'tests'].map((kind) => ({
          id: `${kind}-${dateKey}`,
          data: {
            taskTitle: `${kind} ${dateKey}`,
            taskCollection: kind,
            dateKey,
            delta: 1,
          },
        }))
    ),
    [],
    [],
    [],
    [],
    'Europe/Amsterdam'
  )
  const { container, rerender } = render(
    <SchoolCalendar theme={themes.princess} />
  )
  const cases = [
    { period: 'Day', dates: ['2026-09-30'], days: 1 },
    { period: 'Week', dates: ['2026-09-30', '2026-10-01'], days: 7 },
    { period: 'Month', dates: ['2026-09-01', '2026-09-30'], days: 30 },
  ]
  for (const { period, dates, days } of cases) {
    fireEvent.click(
      screen.getByRole('radio', { name: 'All activity', exact: true })
    )
    fireEvent.click(screen.getByRole('radio', { name: period, exact: true }))
    const grid = screen.getByRole('group', { name: `${period} calendar` })
    expect(
      within(grid).getAllByRole('button', { name: /^Select / })
    ).toHaveLength(days)
    expect(grid.querySelectorAll('.calendar-weekday')).toHaveLength(
      period === 'Day' ? 1 : 7
    )
    const agenda = screen.getByRole('group', { name: `${period} agenda` })
    expect(
      within(agenda).getAllByRole('region', { name: /^Agenda for / })
    ).toHaveLength(days)
    expect(within(agenda).getAllByText('Daily play')).toHaveLength(days)
    if (period === 'Week') {
      expect(
        within(grid).getByRole('button', { name: 'Select 2026-09-28' })
      ).toBeVisible()
      expect(
        within(grid).getByRole('button', { name: 'Select 2026-10-04' })
      ).toBeVisible()
      expect(
        within(agenda).getByRole('region', { name: 'Agenda for 2026-10-01' })
      ).toBeVisible()
    }
    expect(
      screen.queryByRole('region', { name: 'Agenda for 2026-10-08' })
    ).not.toBeInTheDocument()
    for (const [label, kind] of [
      ['Chores completed', 'chores'],
      ['Tests completed', 'tests'],
    ] as const) {
      fireEvent.click(screen.getByRole('radio', { name: label, exact: true }))
      expect(
        container.querySelectorAll('.calendar-history__item')
      ).toHaveLength(dates.length)
      for (const date of dates) {
        expect(
          screen.getByRole('button', { name: new RegExp(`^${kind} ${date},`) })
        ).toBeVisible()
      }
      expect(
        screen.getByRole('group', { name: `${period} calendar` })
      ).toBeVisible()
      expect(
        screen.queryByRole('group', { name: `${period} agenda` })
      ).not.toBeInTheDocument()
    }
  }
  fireEvent.click(
    screen.getByRole('radio', { name: 'All activity', exact: true })
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Week', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Next calendar week' }))
  expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith('2026-10-07')
  selection.selectedDateKey = '2026-10-07'
  rerender(<SchoolCalendar theme={themes.princess} />)
  expect(
    screen.getByRole('button', { name: 'Select 2026-10-05' })
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Select 2026-10-11' })
  ).toBeVisible()
  expect(
    screen.getByRole('region', { name: 'Agenda for 2026-10-08' })
  ).toBeVisible()
  expect(
    screen.queryByRole('region', { name: 'Agenda for 2026-09-30' })
  ).not.toBeInTheDocument()
  expect(container.querySelectorAll('.calendar-history__item')).toHaveLength(2)
  await waitFor(() => expect(fetch).toHaveBeenCalled())
})

it.each([['2026-01-31', 31, '2026-02-28']])(
  'selects %s and clamps month navigation',
  async (dateKey, days, next) => {
    selection.selectedDateKey = dateKey
    saveCalendarSchedule({ version: 1, events: [] })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )
    const { rerender } = render(<SchoolCalendar theme={themes.princess} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Month' }))
    const dateButtons = screen.getAllByRole('button', { name: /^Select / })
    const selected = screen.getByLabelText(`Select ${dateKey}`)
    expect(dateButtons).toHaveLength(days)
    expect(dateButtons).toContain(selected)
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(selected)
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(dateKey)
    expect(
      screen.getAllByRole('group', { name: 'Calendar navigation' })
    ).toHaveLength(1)
    expect(screen.getAllByLabelText('Calendar date')).toHaveLength(1)
    expect(document.querySelector('input[type="date"]')).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'Month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next calendar month' }))
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(next)
    expect(
      screen.getAllByRole('button', { name: /^Previous calendar/ })
    ).toHaveLength(1)
    expect(
      screen.getAllByRole('button', { name: /^Next calendar/ })
    ).toHaveLength(1)
    selection.selectedDateKey = next
    rerender(<SchoolCalendar theme={themes.princess} />)
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(28)
    expect(screen.getByLabelText(`Select ${next}`)).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Rewards granted' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Year' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Previous calendar year' })
    )
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith('2025-02-28')
    expect(screen.getAllByLabelText('Calendar date')).toHaveLength(1)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  }
)

it.each(['teenie'] as const)(
  'shows short English school activities with %s artwork without removing school',
  async (themeId) => {
    selection.selectedDateKey = '2026-09-23'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          '2026-09-23': {
            isNonSchoolDay: true,
            hasAllDayEvent: true,
            summaries: ['Schoolfotograaf', 'Schoolfotograaf broertjes/zusjes'],
            events: [
              {
                id: 'photo',
                summary: 'Schoolfotograaf',
                allDay: true,
                start: '2026-09-22T00:00:00Z',
                end: '2026-09-24T00:00:00Z',
              },
              {
                id: 'siblings',
                summary: 'Schoolfotograaf broertjes/zusjes',
                allDay: false,
                start: '2026-09-23T10:30:00Z',
                end: '2026-09-23T14:00:00Z',
              },
            ],
          },
        }),
      })
    )
    render(<SchoolCalendar theme={themes[themeId]} />)
    const details = within(
      screen.getByRole('region', { name: 'School events' })
    )
    await waitFor(() =>
      expect(details.getByText('School Photos')).toBeInTheDocument()
    )
    expect(details.queryByText('Schoolfotograaf')).not.toBeInTheDocument()
    const siblings = within(details.getByText('Sibling Photos').closest('li')!)
    expect(siblings.getByLabelText('From 12:30 PM')).toBeVisible()
    expect(siblings.getByLabelText('To 4:00 PM')).toBeVisible()
    const allDay = details.getByText('School Photos').closest('li')!
    expect(within(allDay).getByText('All day')).toBeVisible()
    expect(allDay.querySelector('time')).toBeNull()
    expect(
      details.getByText('Sibling Photos').closest('li')!.querySelector('img')
    ).toHaveAttribute('src', getSchoolEventImage(themeId, 'sibling-photo'))
    expect(
      within(screen.getByRole('region', { name: 'Day agenda' })).getByText(
        'Table work'
      )
    ).toBeInTheDocument()
    const cell = screen.getByRole('button', { name: 'Select 2026-09-23' })
    expect(within(cell).getByRole('img')).toHaveAttribute(
      'src',
      getSchoolEventImage(themeId, 'school-photo')
    )
    expect(cell).not.toHaveTextContent('+1')
    expect(cell.querySelector('img[alt=""]')).toHaveAttribute(
      'src',
      getThemeAsset(themeId, 'calendarMoreIcon')
    )
    expect(cell).toHaveAttribute(
      'aria-description',
      expect.stringContaining('School day')
    )
    const row = screen.getByText('Table work').closest('[role="button"]')!
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(row).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(row, { key: ' ' })
    fireEvent.focusIn(cell)
    expect(row).toHaveAttribute('aria-expanded', 'false')
    const invalid = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    Object.assign(invalid.events[0], { start: '23:00', end: '07:00' })
    expect(() => saveCalendarSchedule(invalid)).toThrow()
    expect(localStorage.getItem(CALENDAR_SCHEDULE_STORAGE_KEY)).toBeNull()
    const edited = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
    edited.events.find(({ id }) => id === 'judo')!.start = '14:30'
    act(() => saveCalendarSchedule(edited))
    const judo = within(screen.getByText('Judo').closest('li')!)
    expect(judo.getByLabelText('From 2:30 PM')).toBeVisible()
    expect(judo.getByLabelText('To 3:00 PM')).toBeVisible()
    act(() => {
      localStorage.setItem(
        CALENDAR_SCHEDULE_STORAGE_KEY,
        JSON.stringify({ version: 1, events: [] })
      )
      window.dispatchEvent(
        new StorageEvent('storage', { key: CALENDAR_SCHEDULE_STORAGE_KEY })
      )
    })
    expect(screen.queryByText('Judo')).not.toBeInTheDocument()
  }
)

it('keeps calendar markers, history totals and selected-day results in sync with each filter', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
  historyState.entries = buildCalendarHistory(
    [
      {
        id: 'chore',
        data: {
          taskCollection: 'chores',
          taskTitle: 'Tidy',
          dateKey: '2026-09-09',
          delta: 2,
        },
      },
      {
        id: 'test',
        data: {
          taskCollection: 'tests',
          taskTitle: 'Maths',
          dateKey: '2026-09-10',
          delta: 3,
        },
      },
    ],
    [
      {
        id: 'reward',
        data: { rewardTitle: 'Cards', dateKey: '2026-09-09', costStars: 5 },
      },
    ],
    [],
    [],
    [],
    'Europe/Amsterdam'
  )
  const { rerender } = render(<SchoolCalendar theme={themes.teenie} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Week', exact: true }))
  const ninth = () => screen.getByRole('button', { name: 'Select 2026-09-09' })
  const tenth = () => screen.getByRole('button', { name: 'Select 2026-09-10' })
  expect(ninth()).toHaveAttribute(
    'aria-description',
    expect.stringContaining('Cards: reward granted')
  )
  expect(ninth()).toHaveAttribute(
    'aria-description',
    expect.stringContaining('Tidy: completed')
  )
  fireEvent.click(
    screen.getByRole('radio', { name: 'Chores completed', exact: true })
  )
  expect(ninth()).toHaveAttribute(
    'aria-description',
    expect.not.stringContaining('Cards')
  )
  expect(tenth()).toHaveAttribute(
    'aria-description',
    expect.not.stringContaining('Maths')
  )
  expect(
    screen.queryByRole('region', { name: 'Day agenda' })
  ).not.toBeInTheDocument()
  expect(
    within(screen.getByRole('status')).getByRole('img', {
      name: '2 stars earned',
    })
  ).toBeVisible()
  fireEvent.click(
    screen.getByRole('radio', { name: 'Tests completed', exact: true })
  )
  expect(ninth()).toHaveAttribute(
    'aria-description',
    expect.not.stringContaining('Tidy')
  )
  expect(tenth()).toHaveAttribute(
    'aria-description',
    expect.stringContaining('Maths: completed')
  )
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  fireEvent.click(screen.getByRole('radio', { name: 'Day', exact: true }))
  expect(
    screen.getByRole('status', { name: 'No tests completed this day' })
  ).toBeVisible()
  fireEvent.click(screen.getByRole('radio', { name: 'Week', exact: true }))
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  fireEvent.click(tenth())
  expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith('2026-09-10')
  selection.selectedDateKey = '2026-09-10'
  rerender(<SchoolCalendar theme={themes.teenie} />)
  expect(screen.getByLabelText('Calendar date')).toHaveAttribute(
    'datetime',
    '2026-09-10'
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Day', exact: true }))
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  fireEvent.click(
    screen.getByRole('radio', { name: 'Rewards granted', exact: true })
  )
  expect(
    screen.getByRole('status', { name: 'No rewards granted this day' })
  ).toBeVisible()
  fireEvent.click(screen.getByRole('radio', { name: 'Month', exact: true }))
  expect(ninth()).toHaveAttribute(
    'aria-description',
    expect.stringContaining('Cards: reward granted')
  )
  expect(ninth()).toHaveAttribute(
    'aria-description',
    expect.not.stringContaining('Tidy')
  )
  expect(tenth()).toHaveAttribute(
    'aria-description',
    expect.not.stringContaining('Maths')
  )
  expect(screen.getByRole('button', { name: /^Cards,/ })).toBeVisible()
  expect(
    within(screen.getByRole('status')).getByRole('img', {
      name: '5 stars spent',
    })
  ).toBeVisible()
  fireEvent.click(
    screen.getByRole('radio', { name: 'All activity', exact: true })
  )
  expect(screen.getByRole('region', { name: 'Day agenda' })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Select 2026-09-09' })
  ).not.toBeInTheDocument()
  expect(tenth()).toHaveAttribute(
    'aria-description',
    expect.stringContaining('Maths: completed')
  )
  await waitFor(() => expect(fetch).toHaveBeenCalled())
})
