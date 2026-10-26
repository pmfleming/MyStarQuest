import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import CalendarActivityHistory from '../../src/components/CalendarActivityHistory'
import { themes } from '../../src/contexts/ThemeContext'
import type { HistoryPeriod, HistoryView } from '../../src/lib/calendarHistory'
import { buildCalendarHistory } from '../../src/lib/calendarHistory'

const selection = vi.hoisted(() => ({
  selectedDateKey: '2026-10-22',
  setSelectedDateKey: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => selection,
}))
const entries = buildCalendarHistory(
  [
    {
      id: 'tidy',
      data: {
        taskTitle: 'Tidy room',
        taskCollection: 'chores',
        dateKey: '2026-10-22',
        delta: 2,
      },
    },
    {
      id: 'piano',
      data: {
        taskTitle: 'Piano',
        taskCollection: 'chores',
        dateKey: '2026-10-19',
        delta: 1,
      },
    },
    {
      id: 'math',
      data: {
        taskTitle: 'Maths',
        taskCollection: 'tests',
        dateKey: '2026-10-22',
        delta: 3,
      },
    },
  ],
  [
    {
      id: 'gift',
      data: {
        rewardTitle: 'Cards',
        costStars: 4,
        createdAt: new Date('2026-10-22T12:00:00Z'),
      },
    },
    {
      id: 'old',
      data: {
        rewardTitle: 'Birthday toy',
        costStars: 10,
        createdAt: new Date('2026-01-01T12:00:00Z'),
      },
    },
  ],
  [],
  [],
  [],
  'Europe/London'
)
function Harness({
  childId = 'child',
  loading = false,
  error = false,
}: {
  childId?: string | null
  loading?: boolean
  error?: boolean
}) {
  const [view, setView] = useState<HistoryView>('all')
  const [taskPeriod, setTaskPeriod] = useState<HistoryPeriod>('day')
  const [rewardPeriod, setRewardPeriod] = useState<HistoryPeriod>('day')
  return (
    <CalendarActivityHistory
      theme={themes.princess}
      entries={entries}
      view={view}
      onViewChange={setView}
      period={view === 'rewards' ? rewardPeriod : taskPeriod}
      onPeriodChange={view === 'rewards' ? setRewardPeriod : setTaskPeriod}
      childId={childId}
      loading={loading}
      error={error}
    />
  )
}
it('shows the selected day and separately filters chores, tests and granted rewards', () => {
  render(<Harness />)
  expect(screen.getByRole('button', { name: /^Tidy room,/ })).toBeVisible()
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  expect(screen.getByRole('button', { name: /^Cards,/ })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Piano,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('radio', { name: 'Chores & tests completed' })
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Week' }))
  expect(screen.getByRole('button', { name: /^Piano,/ })).toBeVisible()
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Cards,/ })
  ).not.toBeInTheDocument()
  expect(
    within(screen.getByRole('status')).getByRole('img', {
      name: '6 stars earned',
    })
  ).toBeVisible()
  fireEvent.click(screen.getByRole('radio', { name: 'Chores completed' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Week' }))
  expect(screen.getByRole('button', { name: /^Piano,/ })).toBeVisible()
  expect(
    within(screen.getByRole('status')).getByRole('img', {
      name: '3 stars earned',
    })
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Maths,/ })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /^Cards,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'Tests completed' }))
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Piano,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'Rewards granted' }))
  expect(screen.queryByRole('radio', { name: 'Week' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'Year' }))
  expect(screen.getByRole('button', { name: /^Birthday toy,/ })).toBeVisible()
  expect(
    within(screen.getByRole('status')).getByRole('img', {
      name: '14 stars spent',
    })
  ).toBeVisible()
  fireEvent.click(
    screen.getByRole('button', { name: 'Previous calendar year' })
  )
  expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith('2025-10-22')
  expect(screen.getByLabelText('Calendar date')).toHaveAttribute(
    'datetime',
    '2026-10-22'
  )
  expect(document.querySelector('input[type="date"]')).toBeNull()
  fireEvent.click(screen.getByRole('radio', { name: 'Chores completed' }))
  expect(
    within(
      screen.getByRole('radiogroup', { name: 'History period' })
    ).getByRole('radio', { name: 'Week' })
  ).toHaveAttribute('aria-checked', 'true')
})
it('distinguishes no child, loading, failed loading, and an empty period', () => {
  const { rerender } = render(<Harness childId={null} />)
  expect(
    screen.getByRole('status', { name: 'Select a child to see their history' })
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Tidy room,/ })
  ).not.toBeInTheDocument()
  rerender(<Harness loading />)
  expect(screen.getByRole('status', { name: 'Loading history' })).toBeVisible()
  rerender(<Harness error />)
  expect(screen.getByRole('alert')).toHaveAccessibleName(
    expect.stringContaining('History could not be loaded')
  )
  selection.selectedDateKey = '2024-01-01'
  rerender(<Harness />)
  expect(
    screen.getByRole('status', { name: 'No activity recorded this day' })
  ).toBeVisible()
  selection.selectedDateKey = '2026-10-22'
})

it('uses artwork and numbers with no visible label longer than one word', () => {
  const { container } = render(<Harness />)
  for (const name of [
    'All activity',
    'Chores & tests completed',
    'Chores completed',
    'Tests completed',
    'Rewards granted',
  ]) {
    fireEvent.click(screen.getByRole('radio', { name }))
    const month = screen.queryByRole('radio', { name: 'Month' })
    if (month) fireEvent.click(month)
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const longLabels: string[] = []
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent?.trim() ?? ''
      if ((text.match(/\p{L}+/gu) ?? []).length > 1) longLabels.push(text)
    }
    expect(longLabels).toEqual([])
  }
})
