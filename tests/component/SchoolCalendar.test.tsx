import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import { themes } from '../../src/contexts/ThemeContext'

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

it('shows a retryable failure and recovers from an unavailable calendar', async () => {
  localStorage.clear()
  const fetchCalendar = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ '2026-09-09': { isNonSchoolDay: true } }),
    })
  vi.stubGlobal('fetch', fetchCalendar)
  render(<SchoolCalendar theme={themes.princess} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Holiday dates could not be loaded'
  )
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(fetchCalendar).toHaveBeenCalledTimes(2))
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  )
  expect(
    within(
      screen.getByRole('button', { name: 'Select 2026-09-09' })
    ).getByAltText('Home')
  ).toBeInTheDocument()
})

it.each([
  ['2028-02-29', 29, '2028-03-29'],
  ['2026-01-31', 31, '2026-02-28'],
  ['2026-12-31', 31, '2027-01-31'],
])('selects %s and clamps month navigation', async (dateKey, days, next) => {
  selection.selectedDateKey = dateKey
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  )
  render(<SchoolCalendar theme={themes.princess} />)
  const selected = screen.getByRole('button', { name: `Select ${dateKey}` })
  expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(days)
  expect(selected).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(selected)
  expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(dateKey)
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
  expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith(next)
  await waitFor(() => expect(fetch).toHaveBeenCalled())
})
