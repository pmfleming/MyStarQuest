import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => ({
    selectedDateKey: '2026-09-09',
    setSelectedDateKey: vi.fn(),
  }),
}))
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
