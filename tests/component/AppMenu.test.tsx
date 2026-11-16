import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppMenu from '../../src/components/AppMenu'
import { themes } from '../../src/contexts/ThemeContext'
import {
  ChildAccessContext,
  type ChildAccess,
} from '../../src/sharing/ChildAccessContext'

const state = vi.hoisted(() => ({
  childId: 'child' as string | null,
  logout: vi.fn(),
  resetChore: vi.fn(),
  resetDinner: vi.fn(),
  subscribe: vi.fn(),
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ logout: state.logout }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: state.childId }),
}))
vi.mock('../../src/data/useChores', () => ({
  useChores: () => {
    state.subscribe()
    return {
      todos: [
        { id: 'tidy', taskType: 'standard' },
        { id: 'dinner', taskType: 'eating' },
      ],
      resetChore: state.resetChore,
      resetDinner: state.resetDinner,
    }
  },
}))

beforeEach(() => {
  state.childId = 'child'
  state.logout.mockReset().mockResolvedValue(undefined)
  state.resetChore.mockReset().mockResolvedValue(undefined)
  state.resetDinner.mockReset().mockResolvedValue(undefined)
  state.subscribe.mockClear()
  // jsdom does not implement the native modal dialog methods.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      if (!this.open) return
      this.removeAttribute('open')
      queueMicrotask(() => this.dispatchEvent(new Event('close')))
    },
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

const renderMenu = (
  onResetToday?: () => Promise<void>,
  access: ChildAccess | null = null
) =>
  render(
    <StrictMode>
      <ChildAccessContext.Provider value={access}>
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AppMenu theme={themes.princess} onResetToday={onResetToday} />
              }
            />
            <Route
              path="/settings/manage-children"
              element={<h1>Manage children</h1>}
            />
            <Route path="/tabs/chores" element={<h1>Chores</h1>} />
          </Routes>
        </MemoryRouter>
      </ChildAccessContext.Provider>
    </StrictMode>
  )
const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

describe('shared app menu', () => {
  it.each(['Reset today', 'Sign out'])(
    'keeps the selected child stable during %s and restores switching after failure',
    async (actionName) => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const choices = ['First', 'Second'].map((displayName) => ({
        id: displayName,
        displayName,
        ownerUid: 'parent',
        membershipVersion: 1,
        avatarToken: 'star',
        totalStars: 0,
        testFailureModeEnabled: false,
      }))
      const select = vi.fn()
      let reject!: (error: Error) => void
      const pending = new Promise<void>((_resolve, fail) => {
        reject = fail
      })
      state.logout.mockReturnValue(pending)
      renderMenu(() => pending, {
        choices,
        selected: choices[0],
        actorUid: 'parent',
        loading: false,
        error: null,
        select,
      })
      await act(async () => openMenu())
      fireEvent.click(screen.getByRole('button', { name: actionName }))
      const switchChild = screen.getByRole('button', { name: 'Second' })
      expect(switchChild).toBeDisabled()
      fireEvent.click(switchChild)
      fireEvent(
        screen.getByRole('dialog'),
        new Event('cancel', { cancelable: true })
      )
      expect(select).not.toHaveBeenCalled()
      expect(screen.getByRole('dialog')).toBeVisible()
      await act(async () => reject(new Error('Disconnected')))
      expect(screen.getByRole('alert')).toHaveTextContent(
        `${actionName} failed`
      )
      expect(switchChild).toBeEnabled()
      fireEvent.click(switchChild)
      expect(select).toHaveBeenCalledWith(choices[1])
      expect(screen.getByRole('heading', { name: 'Chores' })).toBeVisible()
    }
  )

  it('survives StrictMode dialog replay and keeps failed resets available for retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reset = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(undefined)
    renderMenu(reset)
    await act(async () => openMenu())
    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(dialog).toBeVisible()
    await act(async () => (dialog as HTMLDialogElement).close())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await act(async () => openMenu())
    fireEvent.click(screen.getByRole('button', { name: 'Reset today' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Reset today failed'
    )
    expect(screen.getByRole('dialog')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Reset today' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(reset).toHaveBeenCalledTimes(2)
  })
})
