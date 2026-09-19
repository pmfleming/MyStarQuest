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

const selection = vi.hoisted(() => ({
  selectedDateKey: '2026-09-09',
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => selection,
}))

beforeEach(() => {
  selection.selectedDateKey = '2026-09-09'
  selection.setSelectedDateKey.mockClear()
})
afterEach(() => {
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

it('updates the agenda and themed artwork when a different date is selected', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
  const { rerender } = render(<SchoolCalendar theme={themes.princess} />)
  const agenda = within(screen.getByRole('region', { name: 'Day agenda' }))
  expect(agenda.getByText('Judo').closest('li')).toHaveTextContent(
    '14:15 – 15:00'
  )
  expect(agenda.getByText('School').closest('li')).toHaveTextContent(
    '08:30 – 12:15'
  )
  selection.selectedDateKey = '2026-09-12'
  rerender(<SchoolCalendar theme={themes.teenie} />)
  expect(agenda.queryByText('School')).not.toBeInTheDocument()
  expect(agenda.queryByText('Judo')).not.toBeInTheDocument()
  const ballet = agenda.getByText('Ballet').closest('li')!
  expect(ballet).toHaveTextContent('10:45 – 11:30')
  expect(ballet.querySelector('img')).toHaveAttribute(
    'src',
    themes.teenie.activityImages!.ballet
  )
  await waitFor(() => expect(fetch).toHaveBeenCalled())
})

it('removes school after holiday dates load but retains the weekly lesson', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ '2026-09-09': { isNonSchoolDay: true } }),
    })
  )
  render(<SchoolCalendar theme={themes.princess} />)
  const agenda = within(screen.getByRole('region', { name: 'Day agenda' }))
  await waitFor(() =>
    expect(agenda.queryByText('School')).not.toBeInTheDocument()
  )
  expect(agenda.queryByText('Going to school')).not.toBeInTheDocument()
  expect(agenda.getByText('Judo')).toBeInTheDocument()
})

it('reacts to saved changes in this window and other windows', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
  render(<SchoolCalendar theme={themes.princess} />)
  const edited = structuredClone(DEFAULT_CALENDAR_SCHEDULE)
  edited.events.find(({ id }) => id === 'judo')!.start = '14:30'
  act(() => saveCalendarSchedule(edited))
  expect(screen.getByText('Judo').closest('li')).toHaveTextContent(
    '14:30 – 15:00'
  )
  act(() => {
    localStorage.setItem(
      CALENDAR_SCHEDULE_STORAGE_KEY,
      JSON.stringify({ version: 1, events: [] })
    )
    window.dispatchEvent(
      new StorageEvent('storage', { key: CALENDAR_SCHEDULE_STORAGE_KEY })
    )
  })
  expect(
    screen.getByText('No events planned for this day.')
  ).toBeInTheDocument()
  await waitFor(() => expect(fetch).toHaveBeenCalled())
})
