import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import CalendarActivityHistory from '../../src/components/CalendarActivityHistory'
import { themes } from '../../src/contexts/ThemeContext'
import type { HistoryPeriod, HistoryView } from '../../src/lib/calendarHistory'
import { buildCalendarHistory } from '../../src/lib/calendarHistory'
import { getThemeAsset } from '../../src/ui/themeAssets'

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

it.each(['teenie', 'princess'] as const)(
  'uses Dinner artwork for recorded and legacy completions in the %s theme',
  (themeId) => {
    const history = buildCalendarHistory(
      [
        {
          id: 'snapshot',
          data: {
            taskId: 'deleted-dinner',
            taskTitle: 'Dinner',
            taskCollection: 'chores',
            taskType: 'eating',
            imageKey: '',
            dateKey: '2026-10-22',
            occurredAt: Date.parse('2026-10-22T06:15:00Z'),
            delta: 2,
          },
        },
        {
          id: 'legacy',
          data: {
            taskId: 'dinner',
            dateKey: '2026-10-22',
            delta: 2,
          },
        },
        {
          id: 'tidy',
          data: {
            taskTitle: 'Tidy room',
            taskCollection: 'chores',
            taskType: 'standard',
            imageKey: 'tidyingUp',
            dateKey: '2026-10-22',
            delta: 1,
          },
        },
        {
          id: 'water',
          data: {
            taskTitle: 'Water check',
            taskCollection: 'chores',
            taskType: 'watertoiletcheck',
            dateKey: '2026-10-22',
            delta: 1,
          },
        },
      ],
      [],
      [{ id: 'dinner', data: { title: 'Dinner', taskType: 'eating' } }],
      [],
      [],
      'Europe/Amsterdam'
    )
    expect(history.find(({ id }) => id === 'task-snapshot')).toMatchObject({
      title: 'Dinner',
      taskType: 'eating',
      time: '08:15',
      stars: 2,
    })
    render(
      <CalendarActivityHistory
        theme={themes[themeId]}
        entries={history}
        view="completed"
        onViewChange={vi.fn()}
        period="day"
        onPeriodChange={vi.fn()}
        childId="child"
        loading={false}
        error={false}
      />
    )
    const dinners = screen.getAllByRole('button', { name: /^Dinner,/ })
    expect(dinners).toHaveLength(2)
    for (const row of dinners) {
      expect(
        row.querySelector('.calendar-history__artwork > img')
      ).toHaveAttribute('src', getThemeAsset(themeId, 'dinnerOverview'))
    }
    for (const [title, role] of [
      ['Tidy room', 'tidyingUp'],
      ['Water check', 'waterToiletOverview'],
    ] as const) {
      const row = screen.getByRole('button', { name: new RegExp(`^${title},`) })
      expect(
        row.querySelector('.calendar-history__artwork > img')
      ).toHaveAttribute('src', getThemeAsset(themeId, role))
    }
  }
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
  const [period, setPeriod] = useState<HistoryPeriod>('day')
  return (
    <CalendarActivityHistory
      theme={themes.princess}
      entries={entries}
      view={view}
      onViewChange={setView}
      period={period}
      onPeriodChange={setPeriod}
      childId={childId}
      loading={loading}
      error={error}
    />
  )
}
it('uses three bottom buttons and preserves the period while Calendar stays on the selected day', () => {
  render(<Harness />)
  expect(
    screen.queryByRole('radiogroup', { name: 'History type' })
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Calendar', exact: true })
  ).toHaveAttribute('aria-pressed', 'true')
  for (const title of ['Tidy room', 'Maths', 'Cards']) {
    expect(
      screen.getByRole('button', { name: new RegExp(`^${title},`) })
    ).toBeVisible()
  }
  fireEvent.click(screen.getByRole('radio', { name: 'Week' }))
  expect(
    screen.queryByRole('button', { name: /^Piano,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Chores/Tasks' }))
  expect(screen.getByRole('button', { name: /^Piano,/ })).toBeVisible()
  expect(screen.getByRole('button', { name: /^Maths,/ })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Cards,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Rewards', exact: true }))
  expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(screen.queryByRole('radio', { name: 'Year' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Cards,/ })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /^Maths,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('radio', { name: 'Month' }))
  expect(
    screen.queryByRole('button', { name: /^Birthday toy,/ })
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Calendar', exact: true }))
  expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(
    screen.queryByRole('button', { name: /^Piano,/ })
  ).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Cards,/ })).toBeVisible()
  fireEvent.click(
    screen.getByRole('button', { name: 'Previous calendar month' })
  )
  expect(selection.setSelectedDateKey).toHaveBeenLastCalledWith('2026-09-22')
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
  for (const name of ['Calendar', 'Chores/Tasks', 'Rewards']) {
    fireEvent.click(screen.getByRole('button', { name, exact: true }))
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
