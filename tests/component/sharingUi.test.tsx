import TestsPage from '../../src/pages/TestsPage'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { ChildAccessContext } from '../../src/sharing/ChildAccessContext'
import AppMenu from '../../src/components/AppMenu'
import ManageChildrenPage from '../../src/pages/ManageChildrenPage'
import InvitationPage from '../../src/sharing/InvitationPage'
import { themes } from '../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../src/ui/unifiedChoreDescriptors'
import type { TaskWithEphemeral } from '../../src/data/types'
const state = vi.hoisted(() => ({
  user: { uid: 'parent', email: 'parent@example.com' } as {
    uid: string
    email: string
  } | null,
  call: vi.fn(),
  createTest: vi.fn().mockResolvedValue(undefined),
  select: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({
    user: state.user,
    loading: false,
    loginWithGoogle: state.login,
    logout: state.logout,
  }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({
    activeChildId: 'child',
    setActiveChild: state.select,
  }),
}))
vi.mock('../../src/contexts/ThemeContext', async (original) => ({
  ...(await original<typeof import('../../src/contexts/ThemeContext')>()),
  useTheme: () => ({ theme: themes.princess }),
}))
vi.mock('../../src/sharing/api', () => ({ sharingCall: state.call }))
vi.mock('../../src/data/useChildren', () => ({
  useChildren: () => ({ children: [] }),
}))
vi.mock('../../src/data/useChores', () => ({
  useChores: () => {
    throw new Error('Secondary menu must not subscribe to resets')
  },
}))
const child = {
  id: 'child',
  displayName: 'Test child',
  avatarToken: '',
  totalStars: 10,
  themeId: 'princess' as const,
  testFailureModeEnabled: true,
  ownerUid: 'owner',
  membershipVersion: 1,
  sharedDataVersion: 1,
}
const access = {
  actorUid: 'parent',
  choices: [child, { ...child, id: 'another' }],
  selected: child,
  loading: false,
  error: null,
  select: state.select,
}
beforeEach(() => {
  vi.clearAllMocks()
  state.user = { uid: 'parent', email: 'parent@example.com' }
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function () {
      this.setAttribute('open', '')
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function () {
      this.removeAttribute('open')
    },
  })
})
afterEach(cleanup)
describe('secondary UI', () => {
  it('hides restricted menu actions and offers child selection; direct Children URL redirects', async () => {
    const view = render(
      <MemoryRouter>
        <ChildAccessContext value={access}>
          <AppMenu theme={themes.princess} />
        </ChildAccessContext>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.queryByRole('button', { name: 'Children' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset today' })).toBeNull()
    expect(screen.getByText('Choose child')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
    view.unmount()
    render(
      <MemoryRouter initialEntries={['/settings/manage-children']}>
        <ChildAccessContext value={access}>
          <Routes>
            <Route
              path="/settings/manage-children"
              element={<ManageChildrenPage />}
            />
            <Route path="/tabs/chores" element={<p>Allowed activities</p>} />
          </Routes>
        </ChildAccessContext>
      </MemoryRouter>
    )
    expect(await screen.findByText('Allowed activities')).toBeInTheDocument()
  })
  it('keeps active dinner controls available without a reset utility', () => {
    const task = {
      id: 'dinner',
      taskType: 'eating',
      title: 'Dinner',
      childId: 'child',
      starValue: 3,
      isRepeating: true,
      dinnerTotalBites: 4,
      dinnerDurationSeconds: 600,
      manageDinnerTimerStartedAt: Date.now(),
      manageDinnerBitesLeft: 3,
    } as TaskWithEphemeral
    const descriptor = createUnifiedChoreDescriptor({
      theme: themes.princess,
      canReset: false,
      activeIds: new Set(['dinner']),
      checkTriggers: {},
      biteCooldownSeconds: 1,
    })
    expect(descriptor.getPrimaryAction?.(task)).toMatchObject({ label: 'Bite' })
    expect(descriptor.getUtilityAction?.(task)).toBeUndefined()
  })
})
describe('invitation landing', () => {
  it('requires explicit acceptance, retains fragment on account switch, and selects the invited scope', async () => {
    state.call
      .mockRejectedValueOnce(new Error('Use the invited Google account.'))
      .mockResolvedValueOnce({
        ownerUid: 'owner',
        childId: 'child',
        themeId: 'princess',
      })
    render(
      <MemoryRouter initialEntries={['/invite/invitation#secret-token']}>
        <Routes>
          <Route path="/invite/:inviteId" element={<InvitationPage />} />
          <Route path="/tabs/chores" element={<p>Shared activities</p>} />
        </Routes>
      </MemoryRouter>
    )
    expect(state.call).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'invited Google account'
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Use another Google account' })
    )
    await waitFor(() => expect(state.logout).toHaveBeenCalled())
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Accept invitation' })
      ).toBeEnabled()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Accept invitation' }))
    expect(await screen.findByText('Shared activities')).toBeInTheDocument()
    expect(state.call).toHaveBeenLastCalledWith('acceptParentInvitation', {
      inviteId: 'invitation',
      token: 'secret-token',
    })
    expect(state.select).toHaveBeenCalledWith({
      id: 'child',
      ownerUid: 'owner',
      themeId: 'princess',
    })
  })
})

vi.mock('../../src/data/useTests', () => ({
  useTests: () => ({
    tests: [],
    canManageTests: true,
    createTest: state.createTest,
    deleteTest: vi.fn(),
    todayInfo: { dateKey: '2026-10-03' },
    updateTestField: vi.fn(),
    updateEphemeral: vi.fn(),
    completeTest: vi.fn(),
    failTest: vi.fn(),
    resetTest: vi.fn(),
  }),
}))
it('offers adding a shared test to a secondary parent', async () => {
  render(
    <MemoryRouter>
      <ChildAccessContext value={access}>
        <TestsPage />
      </ChildAccessContext>
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: 'Add Test' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Test type' }), {
    target: { value: 'animals' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save test' }))
  await waitFor(() => expect(state.createTest).toHaveBeenCalledWith('animals'))
})
