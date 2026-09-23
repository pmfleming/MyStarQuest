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
import { getSchoolEventImage } from '../../src/ui/schoolEventAssets'
import { getThemeAsset } from '../../src/ui/themeAssets'
import {
  createSchoolCalendarStore,
  schoolCalendarStore,
} from '../../src/lib/schoolCalendarStore'

const selection = vi.hoisted(() => ({
  selectedDateKey: '2026-09-09',
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => selection,
}))

beforeEach(() => {
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

it.each([['2026-01-31', 31, '2026-02-28']])(
  'selects %s and clamps month navigation',
  async (dateKey, days, next) => {
    selection.selectedDateKey = dateKey
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )
    render(<SchoolCalendar theme={themes.princess} />)
    const selected = screen.getByRole('button', { name: `Select ${dateKey}` })
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(
      days
    )
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(selected)
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(dateKey)
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(next)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  }
)

it('reacts to saved changes in this window and other windows', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
  render(<SchoolCalendar theme={themes.princess} />)
  const edited = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
  edited.events.find(({ id }) => id === 'judo')!.start = '14:30'
  act(() => saveCalendarSchedule(edited))
  const judo = within(screen.getByText('Judo').closest('li')!)
  expect(judo.getByLabelText('From 14:30')).toBeVisible()
  expect(judo.getByLabelText('To 15:00')).toBeVisible()
  act(() => {
    localStorage.setItem(
      CALENDAR_SCHEDULE_STORAGE_KEY,
      JSON.stringify({ version: 1, events: [] })
    )
    window.dispatchEvent(
      new StorageEvent('storage', { key: CALENDAR_SCHEDULE_STORAGE_KEY })
    )
  })
  expect(screen.getByText('No plans.')).toBeInTheDocument()
  await waitFor(() => expect(fetch).toHaveBeenCalled())
})

it.each(['princess', 'teenie'] as const)(
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
    expect(siblings.getByLabelText('From 12:30')).toBeVisible()
    expect(siblings.getByLabelText('To 16:00')).toBeVisible()
    const allDay = details.getByText('School Photos').closest('li')!
    expect(within(allDay).getByText('All day')).toBeVisible()
    expect(allDay.querySelector('time')).toBeNull()
    expect(
      details.getByText('Sibling Photos').closest('li')!.querySelector('img')
    ).toHaveAttribute('src', getSchoolEventImage(themeId, 'sibling-photo'))
    expect(
      within(screen.getByRole('region', { name: 'Day agenda' })).getByText(
        'School'
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
  }
)

it('keeps school in the morning on an early finish and labels the partial day off', async () => {
  selection.selectedDateKey = '2026-12-18'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        '2026-12-18': {
          isNonSchoolDay: false,
          summaries: ['Alle leerlingen om 12:00 uur vrij'],
        },
      }),
    })
  )
  render(<SchoolCalendar theme={themes.princess} />)
  const details = within(screen.getByRole('region', { name: 'School events' }))
  await waitFor(() =>
    expect(details.getByText('Noon Finish')).toBeInTheDocument()
  )
  expect(details.getByText('Early finish')).toBeVisible()
  expect(details.getByLabelText('At 12:00')).toBeVisible()
  const school = within(
    within(screen.getByRole('region', { name: 'Day agenda' }))
      .getByText('School')
      .closest('li')!
  )
  expect(school.getByLabelText('From 08:30')).toBeVisible()
  expect(school.getByLabelText('To 12:00')).toBeVisible()
})

it.each(['teenie'] as const)(
  'illustrates training and breaks in %s while keeping them days off',
  async (themeId) => {
    const dates = [
      [
        '2026-09-09',
        'Studiedag (leerlingen vrij)',
        'Teacher Training',
        'teacher-training',
      ],
      ['2026-09-10', 'Herfstvakantie', 'Autumn Break', 'autumn-break'],
      ['2026-09-11', 'Kerstvakantie', 'Christmas Break', 'christmas-break'],
    ] as const
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          Object.fromEntries(
            dates.map(([date, summary]) => [
              date,
              {
                isNonSchoolDay: true,
                summaries: [summary],
              },
            ])
          ),
      })
    )
    const { rerender } = render(<SchoolCalendar theme={themes[themeId]} />)
    const details = within(
      screen.getByRole('region', { name: 'School events' })
    )
    await details.findByText('Teacher Training')
    for (const [date, , label, artwork] of dates) {
      selection.selectedDateKey = date
      rerender(<SchoolCalendar theme={themes[themeId]} />)
      const cell = screen.getByRole('button', { name: `Select ${date}` })
      expect(within(cell).getByRole('img', { name: label })).toHaveAttribute(
        'src',
        getSchoolEventImage(themeId, artwork)
      )
      expect(
        details.getByText(label).closest('li')!.querySelector('img')
      ).toHaveAttribute('src', getSchoolEventImage(themeId, artwork))
      expect(cell).toHaveAttribute(
        'aria-description',
        expect.stringContaining('Day off')
      )
      expect(
        within(screen.getByRole('region', { name: 'Day agenda' })).queryByText(
          'School'
        )
      ).not.toBeInTheDocument()
    }
  }
)
