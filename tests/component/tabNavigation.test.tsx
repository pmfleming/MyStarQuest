import { lazy, Suspense, type ComponentType, useEffect } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import AnimatedTabLayout from '../../src/routes/AnimatedTabLayout'
import AppErrorBoundary from '../../src/components/AppErrorBoundary'
import DashboardPage from '../../src/pages/DashboardPage'
import { ThemeProvider } from '../../src/contexts/ThemeContext'

const actions = vi.hoisted(() => ({
  native: false,
  resetChore: vi.fn(),
  unmountChores: vi.fn(),
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

function Chores() {
  useEffect(() => () => actions.unmountChores(), [])
  return <DashboardPage />
}

const renderTabs = () => {
  let resolvePage!: (module: { default: ComponentType }) => void
  let rejectPage!: (error: Error) => void
  const DeferredTests = lazy(
    () =>
      new Promise<{ default: ComponentType }>((resolve, reject) => {
        resolvePage = resolve
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
                <Route path="chores" element={<Chores />} />
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
    resolve: () => resolvePage({ default: () => <h1>Tests page</h1> }),
    reject: () => rejectPage(new Error('Page download failed')),
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe.each([false, true])(
  'navigation away from Chores (native frame: %s)',
  (native) => {
    beforeEach(() => {
      actions.native = native
    })
    it('shows loading feedback and keeps tabs usable while the next page downloads', async () => {
      const pendingPage = renderTabs()
      fireEvent.click(screen.getByRole('button', { name: 'Tests tab' }))
      const loadingIcon = await screen.findByRole('status')
      expect(loadingIcon).toHaveAccessibleName('Loading page')
      expect(loadingIcon).toHaveTextContent('')
      expect(
        screen.getByRole('navigation', { name: 'Primary tabs' })
      ).toBeVisible()
      expect(screen.getByRole('button', { name: 'Tests tab' })).toHaveAttribute(
        'aria-current',
        'page'
      )
      expect(actions.unmountChores).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByRole('button', { name: 'Rewards tab' }))
      expect(
        await screen.findByRole('heading', { name: 'Rewards page' })
      ).toBeVisible()
      await act(async () => pendingPage.resolve())
      expect(
        screen.queryByRole('heading', { name: 'Tests page' })
      ).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Tests tab' }))
      expect(
        await screen.findByRole('heading', { name: 'Tests page' })
      ).toBeVisible()
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

    it('navigates while a chore reset is saving and supports rapid switches and Back', async () => {
      let resolveSave!: () => void
      actions.resetChore.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve
          })
      )
      renderTabs()
      fireEvent.click(screen.getByRole('button', { name: 'Reset Get dressed' }))
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
  }
)
