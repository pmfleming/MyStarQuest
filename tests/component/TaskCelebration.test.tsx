import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import DashboardPage from '../../src/pages/DashboardPage'
import TestsPage from '../../src/pages/TestsPage'
import { themes } from '../../src/contexts/ThemeContext'
import { calculateAwardTaskPatch } from '../../src/lib/choreLogic'
import { getThemeAsset } from '../../src/ui/themeAssets'
import type {
  ChoreWithEphemeral,
  TestWithEphemeral,
} from '../../src/data/types'

const data = vi.hoisted(() => ({
  childId: 'child',
  themeId: 'princess' as 'princess' | 'teenie',
  chores: [] as ChoreWithEphemeral[],
  tests: [] as TestWithEphemeral[],
  complete: vi.fn(),
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: data.childId }),
}))
vi.mock('../../src/contexts/ThemeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/contexts/ThemeContext')>()),
  useTheme: () => ({ theme: themes[data.themeId] }),
}))
vi.mock('../../src/components/TabContent', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../src/data/useChildren', () => ({
  useChildren: () => ({ children: [{ id: 'child', totalStars: 10 }] }),
}))
vi.mock('../../src/data/useChores', () => ({
  useChores: () => ({
    todos: data.chores,
    todayInfo: { dateKey: '2026-09-15' },
    completeChore: data.complete,
  }),
}))
vi.mock('../../src/data/useTests', () => ({
  useTests: () => ({
    tests: data.tests,
    todayInfo: { dateKey: '2026-09-15' },
    completeTest: data.complete,
  }),
}))
// Complete the quiz without depending on randomly generated questions.
vi.mock('../../src/components/ArithmeticTester', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete}>Pass quiz</button>
  ),
}))

beforeEach(() => {
  vi.useFakeTimers()
  data.childId = 'child'
  data.themeId = 'princess'
  data.chores = [
    {
      id: 'chore',
      childId: 'child',
      title: 'Tidy room',
      category: 'chore',
      taskType: 'standard',
      starValue: 3,
      isRepeating: false,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
    },
  ]
  data.tests = [
    {
      ...data.chores[0]!,
      id: 'test',
      title: 'Math',
      taskType: 'math',
      category: 'math',
      mathTotalProblems: 1,
    },
  ]
  data.complete
    .mockReset()
    .mockImplementation(async (_item, onAward) => onAward(3, 20))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it.each([
  [DashboardPage, 'Give stars for Tidy room', 'Tidy room'],
  [TestsPage, 'Pass quiz', 'Math'],
] as const)(
  'celebrates a successful completion in its card and counts up',
  async (Page, button, title) => {
    render(<Page />)
    await act(async () => vi.dynamicImportSettled())
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: button }))
    )
    const celebration = screen.getByRole('status', {
      name: `${title} completed`,
    })
    expect(celebration.closest('article')).toBeInTheDocument()
    expect(celebration).toHaveClass(
      'reward-celebration',
      'reward-celebration--earned'
    )
    expect(celebration).toHaveTextContent('3 stars earned. 23 stars total.')
    expect(celebration.querySelector('strong')).toHaveTextContent('20')
    await act(async () => vi.advanceTimersByTimeAsync(1600))
    expect(celebration.querySelector('strong')).toHaveTextContent('23')
    await act(async () => vi.advanceTimersByTimeAsync(1950))
    expect(
      screen.queryByRole('status', { name: `${title} completed` })
    ).not.toBeInTheDocument()
    expect(data.complete).toHaveBeenCalledTimes(1)
  }
)

it.each(['princess', 'teenie'] as const)(
  'keeps the same success image and background after expanding in %s',
  async (themeId) => {
    data.themeId = themeId
    data.chores[0]!.isRepeating = true
    const { rerender } = render(<DashboardPage />)
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Give stars for Tidy room' })
      )
    )
    const celebration = screen.getByRole('status', {
      name: 'Tidy room completed',
    })
    const image = celebration.querySelector('.reward-celebration__art img')!
    const card = celebration.closest('article')!
    expect(image).toHaveAttribute(
      'src',
      getThemeAsset(themeId, 'quizCorrectImage')
    )
    expect(card).toHaveAttribute('data-card-variant', 'highlighted')
    const background = card.style.background
    expect(background).toContain('linear-gradient')
    expect(celebration).toHaveStyle({ background: 'transparent' })
    data.chores = data.chores.map((item) => ({
      ...item,
      ...calculateAwardTaskPatch(item, Date.now()),
    }))
    rerender(<DashboardPage />)
    await act(async () => vi.advanceTimersByTimeAsync(3550))
    expect(
      screen
        .getByRole('status', { name: 'All done!' })
        .querySelector('.reward-celebration__art img')
    ).toBe(image)
    expect(card.style.background).toBe(background)
    expect(
      screen.getByRole('button', { name: 'Reset Tidy room' })
    ).toBeEnabled()
    data.chores = data.chores.map((item) => ({
      ...item,
      manageCompletedAt: null,
    }))
    rerender(<DashboardPage />)
    expect(image).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Give stars for Tidy room' })
    ).toBeEnabled()
  }
)

it('retains a removed chore through completion and prevents duplicate clicks', async () => {
  let finish!: () => void
  data.complete.mockImplementationOnce(
    (_item, onAward) =>
      new Promise<void>((resolve) => {
        finish = () => {
          onAward(3, 20)
          resolve()
        }
      })
  )
  const { rerender } = render(<DashboardPage />)
  const button = screen.getByRole('button', {
    name: 'Give stars for Tidy room',
  })
  fireEvent.click(button)
  fireEvent.click(button)
  data.chores = []
  rerender(<DashboardPage />)
  expect(screen.getByRole('heading', { name: 'Tidy room' })).toBeInTheDocument()
  await act(async () => finish())
  expect(
    screen.getByRole('status', { name: 'Tidy room completed' })
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Delete Tidy room' })
  ).toBeDisabled()
  await act(async () => vi.advanceTimersByTimeAsync(3550))
  expect(
    screen.queryByRole('heading', { name: 'Tidy room' })
  ).not.toBeInTheDocument()
  expect(data.complete).toHaveBeenCalledTimes(1)
})

it('does not celebrate an operation that awarded no stars', async () => {
  data.complete.mockResolvedValueOnce(undefined)
  render(<DashboardPage />)
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Give stars for Tidy room' })
    )
  )
  expect(
    screen.queryByRole('status', { name: 'Tidy room completed' })
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Give stars for Tidy room' })
  ).toBeEnabled()
})

it('releases a failed completion so it can be retried', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    data.complete.mockRejectedValueOnce(new Error('Offline'))
    render(<DashboardPage />)
    const button = screen.getByRole('button', {
      name: 'Give stars for Tidy room',
    })
    await act(async () => fireEvent.click(button))
    expect(screen.getByRole('alert')).toHaveTextContent('failed')
    expect(
      screen.queryByRole('status', { name: 'Tidy room completed' })
    ).not.toBeInTheDocument()
    await act(async () => fireEvent.click(button))
    expect(
      screen.getByRole('status', { name: 'Tidy room completed' })
    ).toBeInTheDocument()
    expect(data.complete).toHaveBeenCalledTimes(2)
  } finally {
    consoleError.mockRestore()
  }
})

it('discards a pending celebration after switching children, including switching back', async () => {
  let finish!: () => void
  data.complete.mockImplementationOnce(
    (_item, onAward) =>
      new Promise<void>((resolve) => {
        finish = () => {
          onAward(3, 20)
          resolve()
        }
      })
  )
  const { rerender } = render(<DashboardPage />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Give stars for Tidy room' })
  )
  data.childId = 'sibling'
  rerender(<DashboardPage />)
  data.childId = 'child'
  rerender(<DashboardPage />)
  await act(async () => finish())
  expect(
    screen.queryByRole('status', { name: 'Tidy room completed' })
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Give stars for Tidy room' })
  ).toBeEnabled()
})

it('shows the final earned balance immediately with reduced motion', async () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  )
  render(<DashboardPage />)
  await act(async () =>
    fireEvent.click(
      screen.getByRole('button', { name: 'Give stars for Tidy room' })
    )
  )
  expect(
    screen
      .getByRole('status', { name: 'Tidy room completed' })
      .querySelector('strong')
  ).toHaveTextContent('23')
})
