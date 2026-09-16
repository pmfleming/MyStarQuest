import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
