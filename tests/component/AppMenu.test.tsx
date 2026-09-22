import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppMenu from '../../src/components/AppMenu'
import { themes } from '../../src/contexts/ThemeContext'

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
      this.removeAttribute('open')
    },
  })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

const renderMenu = (onResetToday?: () => Promise<void>) =>
  render(
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
      </Routes>
    </MemoryRouter>
  )
const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

describe('shared app menu', () => {
  it('stays open after StrictMode replays the dialog effect and still handles a real close', async () => {
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(
      function () {
        if (!this.open) return
        this.removeAttribute('open')
        // Native close events are queued, so an effect can reopen the dialog first.
        queueMicrotask(() => this.dispatchEvent(new Event('close')))
      }
    )
    render(
      <StrictMode>
        <MemoryRouter>
          <AppMenu theme={themes.princess} onResetToday={async () => {}} />
        </MemoryRouter>
      </StrictMode>
    )
    await act(async () => openMenu())
    const dialog = screen.getByRole('dialog', { name: 'Menu' })
    expect(dialog).toBeVisible()
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await act(async () => (dialog as HTMLDialogElement).close())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await act(async () => openMenu())
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  })

  it('opens the existing child manager', () => {
    renderMenu()
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Children' }))
    expect(
      screen.getByRole('heading', { name: 'Manage children' })
    ).toBeVisible()
  })

  it('uses the dashboard reset callback and blocks duplicate actions while saving', async () => {
    let finish!: () => void
    const reset = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    renderMenu(reset)
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Reset today' }))
    expect(reset).toHaveBeenCalledTimes(1)
    expect(state.subscribe).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Reset today' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true })
    )
    expect(screen.getByRole('dialog')).toBeVisible()
    await act(async () => finish())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resets both meals and other chores from other tabs', async () => {
    renderMenu()
    openMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Reset today' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(state.resetChore).toHaveBeenCalledWith({
      id: 'tidy',
      taskType: 'standard',
    })
    expect(state.resetDinner).toHaveBeenCalledWith({
      id: 'dinner',
      taskType: 'eating',
    })
  })

  it('keeps reset failures visible in the menu and allows a retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reset = vi
      .fn()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(undefined)
    renderMenu(reset)
    openMenu()
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

  it('disables reset without a selected child', () => {
    state.childId = null
    renderMenu()
    openMenu()
    expect(screen.getByRole('button', { name: 'Reset today' })).toBeDisabled()
  })
})
