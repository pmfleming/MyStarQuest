import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createContext, useContext } from 'react'
import { ThemeProvider } from '../../src/contexts/ThemeProvider'
import AnimatedTabLayout from '../../src/routes/AnimatedTabLayout'
import DashboardPage from '../../src/pages/DashboardPage'
import TestsPage from '../../src/pages/TestsPage'
import { buildDefaultTests } from '../../src/data/taskDocuments'
import type { ChoreWithEphemeral } from '../../src/data/types'

const state = vi.hoisted(() => ({
  child: 'child',
  date: '2026-10-03',
  native: false,
  resetTest: vi.fn(),
  resetDinner: vi.fn(),
  applyBite: vi.fn(),
  startDinner: vi.fn(),
}))
const ScopeContext = createContext({
  activeChildId: 'child',
  dateKey: '2026-10-03',
})
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => state.native },
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => useContext(ScopeContext),
}))
vi.mock('../../src/data/useChildren', () => ({
  useChildren: () => ({
    children: [{ id: state.child, displayName: 'Explorer', totalStars: 0 }],
  }),
}))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
const tests = buildDefaultTests('child')
const allTests = [
  ...tests,
  { ...tests[0], id: 'second-math', title: 'Second arithmetic' },
]
const chores: ChoreWithEphemeral[] = [
  ...['Breakfast', 'Dinner'].map((title) => ({
    id: title,
    title,
    childId: 'child',
    category: 'eating',
    taskType: 'eating' as const,
    starValue: 2,
    isRepeating: true,
    schoolDayEnabled: true,
    nonSchoolDayEnabled: true,
    dinnerDurationSeconds: 600,
    dinnerTotalBites: 5,
  })),
  {
    id: 'water',
    title: 'Water',
    childId: 'child',
    category: 'watertoiletcheck',
    taskType: 'watertoiletcheck',
    starValue: 2,
    isRepeating: true,
    schoolDayEnabled: true,
    nonSchoolDayEnabled: true,
  },
]
vi.mock('../../src/data/useTests', () => ({
  useTests: () => ({
    tests: allTests,
    todayInfo: useContext(ScopeContext),
    updateTestField: vi.fn(),
    updateEphemeral: vi.fn(),
    completeTest: vi.fn(),
    failTest: vi.fn(),
    resetTest: state.resetTest,
  }),
}))
vi.mock('../../src/data/useChores', () => ({
  useChores: () => ({
    todos: chores,
    todayInfo: useContext(ScopeContext),
    updateChoreAndTodayTodoField: vi.fn(),
    updateEphemeral: vi.fn(),
    createChoreForToday: vi.fn(),
    applyBite: state.applyBite,
    startDinnerTimer: state.startDinner,
    expireDinnerTimer: vi.fn(),
    resetDinner: state.resetDinner,
    completeChore: vi.fn(),
    failChore: vi.fn(),
    resetChore: vi.fn(),
    deleteTask: vi.fn(),
  }),
}))

beforeEach(() => {
  state.child = 'child'
  state.date = '2026-10-03'
  state.native = false
  vi.useFakeTimers()
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    },
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.clearAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name, exact: true }))
  })
}
const tree = () => (
  <ScopeContext value={{ activeChildId: state.child, dateKey: state.date }}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/tabs/tests']}>
        <Routes>
          <Route path="/tabs" element={<AnimatedTabLayout />}>
            <Route path="chores" element={<DashboardPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="rewards" element={<h1>Rewards</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  </ScopeContext>
)

it('resets retained chores from the Tests menu without stopping its tests', async () => {
  render(tree())
  await act(async () => {
    vi.advanceTimersByTime(20)
  })
  await click('Run Arithmetic')
  await click('Chores tab')
  await act(async () => {
    vi.advanceTimersByTime(20)
  })
  for (const chore of chores) await click(`Run ${chore.title}`)
  await click('Tests tab')
  await click('Open menu')
  await click('Reset today')
  expect(state.resetDinner).toHaveBeenCalledTimes(2)
  expect(screen.getByRole('button', { name: 'Reset Arithmetic' })).toBeVisible()
  await click('Chores tab')
  for (const chore of chores)
    expect(
      screen.getByRole('button', { name: `Run ${chore.title}` })
    ).toBeVisible()
})

it.each([true])(
  'keeps all activities and duplicate types mounted across tabs (native: %s)',
  async (native) => {
    state.native = native
    const view = render(tree())
    await act(async () => {
      vi.advanceTimersByTime(20)
    })
    for (const test of allTests) await click(`Run ${test.title}`)
    await act(async () => {
      await vi.dynamicImportSettled()
      vi.advanceTimersByTime(400)
    })
    for (const test of allTests)
      expect(
        screen.getByRole('button', { name: `Reset ${test.title}`, exact: true })
      ).toBeVisible()

    // A partially answered real fraction puzzle must not restart when another
    // activity opens or its entire tab is hidden.
    const wrong = screen.getByRole('button', { name: '1 out of 4 equal parts' })
    fireEvent.click(wrong)
    const fraction = wrong.closest('article')!
    const scroll = fraction.closest('.app-scroll-region')!
    scroll.scrollTop = 700
    fireEvent.scroll(scroll)
    await click('Chores tab')
    await act(async () => {
      vi.advanceTimersByTime(650)
    })
    expect(fraction).toBeInTheDocument()
    expect(fraction).not.toBeVisible()
    for (const chore of chores) await click(`Run ${chore.title}`)
    await click('Bite Breakfast')
    expect(
      screen.getByRole('button', { name: 'Bite Breakfast' })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bite Dinner' })).toBeEnabled()
    await click('Bite Dinner')
    expect(state.applyBite).toHaveBeenCalledTimes(2)
    await click('Reset Breakfast')
    await click('Yes, reset')
    expect(state.resetDinner).toHaveBeenCalledWith(chores[0])
    expect(screen.getByRole('button', { name: 'Bite Dinner' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Finish Water' })).toBeVisible()

    await click('Rewards tab')
    await click('Tests tab')
    expect(fraction).toBeVisible()
    expect(scroll.scrollTop).toBe(700)
    expect(
      within(fraction).queryByRole('button', { name: '1 out of 4 equal parts' })
    ).not.toBeInTheDocument()
    for (const test of allTests)
      expect(
        screen.getByRole('button', { name: `Reset ${test.title}`, exact: true })
      ).toBeVisible()
    await click('Reset Arithmetic')
    await click('Yes, reset')
    expect(
      screen.getByRole('button', { name: 'Run Arithmetic', exact: true })
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Reset Second arithmetic' })
    ).toBeVisible()
    expect(fraction).toBeVisible()

    await click('Chores tab')
    expect(screen.getByRole('button', { name: 'Bite Dinner' })).toBeDisabled()
    await act(async () => {
      vi.advanceTimersByTime(15000)
    })
    expect(screen.getByRole('button', { name: 'Bite Dinner' })).toBeEnabled()
    // The date rollover resets both the visible page and the retained hidden page.
    state.date = '2026-10-04'
    view.rerender(tree())
    expect(screen.getByRole('button', { name: 'Run Dinner' })).toBeVisible()
    await click('Tests tab')
    for (const test of allTests)
      expect(
        screen.getByRole('button', { name: `Run ${test.title}`, exact: true })
      ).toBeVisible()
    await click('Run Arithmetic')
    state.child = 'other-child'
    view.rerender(tree())
    state.child = 'child'
    view.rerender(tree())
    expect(
      screen.getByRole('button', { name: 'Run Arithmetic', exact: true })
    ).toBeVisible()
  },
  20000
)
