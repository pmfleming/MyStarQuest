import { lazy, Suspense, type ComponentType } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import AnimatedTabLayout from '../../src/routes/AnimatedTabLayout'
import AppErrorBoundary from '../../src/components/AppErrorBoundary'
import DashboardPage from '../../src/pages/DashboardPage'
import { ThemeProvider } from '../../src/contexts/ThemeProvider'

const actions = vi.hoisted(() => ({
  native: false,
  resetChore: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => actions.native },
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: 'child' }),
}))
vi.mock('../../src/data/useChildren', () => ({
  useChildren: () => ({
    children: [{ id: 'child', displayName: 'Explorer', totalStars: 5 }],
  }),
}))
vi.mock('../../src/data/useChores', () => ({
  useChores: () => ({
    todos: [
      {
        id: 'dressed',
        title: 'Get dressed',
        taskType: 'standard',
        childId: 'child',
        starValue: 1,
        isRepeating: true,
        manageCompletedAt: 123,
      },
    ],
    todayInfo: { dateKey: '2026-09-06', dayType: 'nonSchoolDay' },
    resetChore: actions.resetChore,
  }),
}))

const renderTabs = () => {
  let rejectPage!: (error: Error) => void
  const DeferredTests = lazy(
    () =>
      new Promise<{ default: ComponentType }>((_resolve, reject) => {
        rejectPage = reject
      })
  )
  function HistoryButtons() {
    const navigate = useNavigate()
    return <button onClick={() => navigate(-1)}>Back</button>
  }
  render(
    <ThemeProvider>
      <AppErrorBoundary>
        <MemoryRouter initialEntries={['/tabs/chores']}>
          <HistoryButtons />
          <Suspense fallback={<p>Loading app…</p>}>
            <Routes>
              <Route path="/tabs" element={<AnimatedTabLayout />}>
                <Route path="chores" element={<DashboardPage />} />
                <Route path="tests" element={<DeferredTests />} />
                <Route path="rewards" element={<h1>Rewards page</h1>} />
                <Route
                  path="time-explorer"
                  element={<h1>Time Explorer page</h1>}
                />
              </Route>
            </Routes>
          </Suspense>
        </MemoryRouter>
      </AppErrorBoundary>
    </ThemeProvider>
  )
  return {
    reject: () => rejectPage(new Error('Page download failed')),
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('navigation away from Chores (native frame: false)', () => {
  const native = false as const

  beforeEach(() => {
    actions.native = native
  })

  it('lets users leave a page whose download failed and return to Chores', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const pendingPage = renderTabs()
    fireEvent.click(screen.getByRole('button', { name: 'Tests tab' }))
    await act(async () => pendingPage.reject())
    expect(await screen.findByRole('alert')).toHaveTextContent('load')
    fireEvent.click(screen.getByRole('button', { name: 'Rewards tab' }))
    expect(
      await screen.findByRole('heading', { name: 'Rewards page' })
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Chores tab' }))
    expect(
      await screen.findByRole('button', { name: 'Reset Get dressed' })
    ).toBeEnabled()
  })

  it('navigates in the native frame while a reset saves and supports rapid switches and Back', async () => {
    actions.native = true
    let resolveSave!: () => void
    actions.resetChore.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve
        })
    )
    renderTabs()
    fireEvent.click(screen.getByRole('button', { name: 'Reset Get dressed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
    expect(actions.resetChore).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Rewards tab' }))
    expect(
      await screen.findByRole('heading', { name: 'Rewards page' })
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Time Explorer tab' }))
    expect(
      await screen.findByRole('heading', { name: 'Time Explorer page' })
    ).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(
      await screen.findByRole('heading', { name: 'Rewards page' })
    ).toBeVisible()
    await act(async () => resolveSave())
    fireEvent.click(screen.getByRole('button', { name: 'Chores tab' }))
    expect(
      await screen.findByRole('button', { name: 'Reset Get dressed' })
    ).toBeEnabled()
  })
})
