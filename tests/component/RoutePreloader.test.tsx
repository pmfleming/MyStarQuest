import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RoutePreloader from '../../src/routes/RoutePreloader'
import ProtectedRoute from '../../src/routes/ProtectedRoute'
import { rememberSessionForPreload } from '../../src/auth/sessionPreloadHint'

const state = vi.hoisted(() => ({
  user: null as null | { uid: string },
  loading: true,
  data: vi.fn(async () => ({})),
  page: vi.fn(async () => ({})),
}))
vi.mock('../../src/auth/AuthContext', () => ({ useAuth: () => state }))
vi.mock('../../src/routes/routeModules', () => ({
  routeModules: { protectedData: state.data },
  getRouteModule: (path: string) =>
    path === '/tabs/time-explorer' ? state.page : null,
}))

function App({ path = '/tabs/time-explorer' }: { path?: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <RoutePreloader />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route
            path="/tabs/time-explorer"
            element={<div>Protected content</div>}
          />
        </Route>
        <Route path="/login" element={<div>Sign in</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  state.user = null
  state.loading = true
  state.data.mockClear()
  state.page.mockClear()
  rememberSessionForPreload(false)
})

describe('requested route preloading', () => {
  it('imports data and requested page during saved-session restoration without exposing content', () => {
    rememberSessionForPreload(true)
    const { rerender } = render(<App />)
    expect(state.data).toHaveBeenCalledOnce()
    expect(state.page).toHaveBeenCalledOnce()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.getByText('Checking your session…')).toBeVisible()
    state.loading = false
    rerender(<App />)
    expect(screen.getByText('Sign in')).toBeVisible()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('does not add protected downloads for a fresh signed-out visit', () => {
    const { rerender } = render(<App />)
    expect(state.page).not.toHaveBeenCalled()
    expect(state.data).not.toHaveBeenCalled()
    state.loading = false
    rerender(<App />)
    expect(state.page).not.toHaveBeenCalled()
  })

  it('starts both imports when a session first resolves without a saved hint', () => {
    const { rerender } = render(<App />)
    state.loading = false
    state.user = { uid: 'test' }
    rerender(<App />)
    expect(state.page).toHaveBeenCalledOnce()
    expect(state.data).toHaveBeenCalledOnce()
    expect(screen.getByText('Protected content')).toBeVisible()
  })

  it('ignores login and tolerates preload failures', async () => {
    state.user = { uid: 'test' }
    const { unmount } = render(<App path="/login" />)
    expect(state.page).not.toHaveBeenCalled()
    unmount()
    state.page.mockRejectedValueOnce(new Error('Offline'))
    render(<App />)
    await waitFor(() => expect(state.page).toHaveBeenCalledOnce())
    expect(screen.getByText('Checking your session…')).toBeVisible()
  })
})
