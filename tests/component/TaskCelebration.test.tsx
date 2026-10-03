import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { themes } from '../../src/contexts/ThemeContext'
import type {
  ChoreWithEphemeral,
  TestWithEphemeral,
} from '../../src/data/types'
import { useTaskCelebration } from '../../src/hooks/useTaskCelebration'
import { celebrateSuccess } from '../../src/lib/celebrate'
import DashboardPage from '../../src/pages/DashboardPage'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

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
  vi.mocked(celebrateSuccess).mockClear()
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

it('retries failed or unawarded completions and celebrates a saved result only once', async () => {
  const item = data.tests[0]!
  const { result } = renderHook(() =>
    useTaskCelebration({
      activeChildId: 'child',
      dateKey: '2026-10-01',
      totalStars: 10,
      items: data.tests,
    })
  )
  await act(async () => {
    await expect(
      result.current.run(item, data.tests, async () => {
        throw new Error('Save failed')
      })
    ).rejects.toThrow('Save failed')
  })
  expect(celebrateSuccess).not.toHaveBeenCalled()
  await act(async () => {
    await result.current.run(item, data.tests, async (onAward) => {
      onAward(0)
    })
  })
  expect(celebrateSuccess).not.toHaveBeenCalled()
  let save!: () => void
  const action = vi.fn(
    (onAward: (delta: number) => void) =>
      new Promise<void>((resolve) => {
        save = () => {
          onAward(3)
          resolve()
        }
      })
  )
  let pending!: Promise<void>
  act(() => {
    pending = result.current.run(item, data.tests, action)
  })
  expect(celebrateSuccess).not.toHaveBeenCalled()
  await act(async () => {
    await result.current.run(item, data.tests, action)
  })
  expect(action).toHaveBeenCalledTimes(1)
  await act(async () => {
    save()
    await pending
  })
  expect(celebrateSuccess).toHaveBeenCalledTimes(1)
})
