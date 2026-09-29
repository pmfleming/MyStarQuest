import { render, screen, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import SchoolCalendar from '../../src/components/SchoolCalendar'
import { themes } from '../../src/contexts/ThemeContext'
import type { SchoolCalendarData } from '../../src/lib/schoolCalendarData'

const state = vi.hoisted(() => ({
  selectedDateKey: '2026-09-27',
  events: {} as SchoolCalendarData,
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => state,
}))
vi.mock('../../src/hooks/useSchoolCalendar', () => ({
  useSchoolCalendar: () => ({ events: state.events, loadError: false }),
}))

beforeEach(() => {
  state.selectedDateKey = '2026-09-27'
  state.events = {}
  localStorage.clear()
})

it('keeps theatre activities across school-feed replacement without closing school', () => {
  state.selectedDateKey = '2026-10-13'
  state.events = {
    '2026-10-13': { isNonSchoolDay: false, summaries: ['Schoolfotograaf'] },
  }
  const { rerender } = render(<SchoolCalendar theme={themes.princess} />)
  expect(screen.getByText('School Photos')).toBeVisible()
  expect(screen.getByText('Meneer B en de grote Bubbelshow')).toBeVisible()
  expect(
    within(screen.getByRole('region', { name: 'Day agenda' })).getByText(
      'Table work'
    )
  ).toBeVisible()
  state.events = {}
  rerender(<SchoolCalendar theme={themes.princess} />)
  expect(screen.queryByText('School Photos')).toBeNull()
  expect(screen.getByText('Meneer B en de grote Bubbelshow')).toBeVisible()
})
