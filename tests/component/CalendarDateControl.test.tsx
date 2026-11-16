import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CalendarDateControl from '../../src/components/CalendarDateControl'
import { SelectedDateContext } from '../../src/contexts/SelectedDateContext'
import { themes, type Theme } from '../../src/contexts/ThemeContext'
import { parseDateKey } from '../../src/lib/today'
import type { HistoryPeriod } from '../../src/lib/calendarHistory'
import twinkle from '../../src/assets/teenie/twinkle.webp'
import mondaySymbol from '../../src/assets/calendar/weekdays/mon-princess.svg'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-16T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

function Harness({
  initialDate = '2026-11-16',
  theme = themes.teenie,
}: {
  initialDate?: string
  theme?: Theme
}) {
  const [selectedDateKey, setSelectedDateKey] = useState(initialDate)
  const [period, setPeriod] = useState<HistoryPeriod>('day')
  return (
    <SelectedDateContext.Provider
      value={{
        selectedDateKey,
        setSelectedDateKey,
        selectedDate: parseDateKey(selectedDateKey),
        nightlyResetKey: '2026-11-16',
        setSelectedDate: vi.fn(),
        resetSelectedDate: vi.fn(),
      }}
    >
      <CalendarDateControl
        theme={theme}
        period={period}
        onPeriodChange={setPeriod}
      >
        <div data-testid="calendar-grid">Existing calendar</div>
      </CalendarDateControl>
    </SelectedDateContext.Provider>
  )
}

it('keeps the illustrated date while removing the day header, reset button and duplicate card', () => {
  render(<Harness initialDate="2027-01-01" />)
  expect(screen.getByLabelText('Calendar date')).toHaveAttribute(
    'datetime',
    '2027-01-01'
  )
  expect(screen.getByLabelText('Friday, 1 January 2027')).toHaveTextContent(
    '1January2027'
  )
  expect(
    screen.queryByRole('group', { name: 'Calendar navigation' })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Back to today' })
  ).not.toBeInTheDocument()
  expect(screen.getByTestId('calendar-grid')).not.toBeVisible()
  fireEvent.click(screen.getByRole('radio', { name: 'Week' }))
  expect(screen.getByTestId('calendar-grid')).toBeVisible()
  for (const name of ['Week', 'Month']) {
    fireEvent.click(screen.getByRole('radio', { name }))
    expect(
      screen.queryByRole('group', { name: 'Calendar navigation' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^(Previous|Next) calendar/ })
    ).not.toBeInTheDocument()
  }
})

it('switches portraits with the theme and uses seven weekday pictures for Week', () => {
  const { container, rerender } = render(<Harness />)
  expect(
    container.querySelector('.character-calendar__portrait')
  ).toHaveAttribute('src', twinkle)
  expect(
    within(screen.getByRole('radio', { name: 'Week' })).getAllByRole(
      'presentation',
      { hidden: true }
    )
  ).toHaveLength(7)
  rerender(<Harness theme={themes.princess} />)
  expect(
    container.querySelector('.character-calendar__portrait')
  ).toHaveAttribute('src', mondaySymbol)
})

it('supports keyboard view selection without replacing the existing calendar grid', () => {
  render(<Harness />)
  const grid = screen.getByTestId('calendar-grid')
  const day = screen.getByRole('radio', { name: 'Day' })
  day.focus()
  fireEvent.keyDown(day, { key: 'ArrowLeft' })
  const week = screen.getByRole('radio', { name: 'Week' })
  expect(week).toHaveFocus()
  expect(week).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByTestId('calendar-grid')).toBe(grid)
  fireEvent.keyDown(week, { key: 'Home' })
  expect(screen.getByRole('radio', { name: 'Month' })).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('radio', { name: 'Month' }), {
    key: 'ArrowLeft',
  })
  expect(day).toHaveFocus()
  expect(screen.getByTestId('calendar-grid')).toBe(grid)
})
