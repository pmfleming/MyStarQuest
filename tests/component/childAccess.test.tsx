import { act, render, screen, cleanup } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import ChildAccessProvider from '../../src/sharing/ChildAccessProvider'
import { useDataScope } from '../../src/sharing/ChildAccessContext'
import { ActiveChildContext } from '../../src/contexts/ActiveChildContext'
const fixtures = vi.hoisted(() => ({
  listeners: new Map<string, (snapshot: unknown) => void>(),
  revoke: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'parent' } }),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: (_: unknown, ...path: string[]) => path.join('/'),
  doc: (_: unknown, ...path: string[]) => path.join('/'),
  onSnapshot: (path: string, next: (snapshot: unknown) => void) => {
    fixtures.listeners.set(path, next)
    return () => fixtures.listeners.delete(path)
  },
}))
vi.mock('../../src/offline/platform', () => ({ isOfflineEnabled: () => false }))
vi.mock('../../src/offline/runtime', () => ({
  offlineRuntime: () => ({ revoke: fixtures.revoke }),
}))
function Wrapper({ children }: { children: ReactNode }) {
  const [selected, select] = useState({
    id: 'child',
    ownerUid: 'owner',
    themeId: 'princess',
  })
  return (
    <ActiveChildContext
      value={{
        activeChildId: selected.id || null,
        activeOwnerUid: selected.ownerUid,
        activeThemeId: selected.themeId,
        setActiveChild: (child) =>
          select((previous) => {
            const next = { ...child, ownerUid: child.ownerUid ?? 'parent' }
            return JSON.stringify(previous) === JSON.stringify(next)
              ? previous
              : next
          }),
        clearActiveChild: () =>
          select({ id: '', ownerUid: '', themeId: 'princess' }),
      }}
    >
      <ChildAccessProvider>{children}</ChildAccessProvider>
    </ActiveChildContext>
  )
}
function Probe() {
  const scope = useDataScope()
  return (
    <>
      <p>
        {scope.access?.loading
          ? 'Opening'
          : scope.access?.selected?.displayName}
      </p>
      <p>{scope.canAdmin ? 'Admin' : 'Secondary'}</p>
    </>
  )
}
function snapshot(id: string, data: object) {
  return { id, data: () => data }
}
beforeEach(() => {
  fixtures.listeners.clear()
  fixtures.revoke.mockClear()
})
afterEach(cleanup)
it('waits for the invited profile, isolates colliding IDs, and clears a removed membership', () => {
  render(
    <Wrapper>
      <Probe />
    </Wrapper>
  )
  act(() =>
    fixtures.listeners.get('users/parent/children')!({
      docs: [snapshot('child', { displayName: 'Own child' })],
    })
  )
  act(() =>
    fixtures.listeners.get('users/parent/childAccess')!({
      docs: [
        snapshot('grant', {
          ownerUid: 'owner',
          childId: 'child',
          membershipVersion: 1,
          status: 'active',
        }),
      ],
    })
  )
  expect(screen.getByText('Opening')).toBeInTheDocument()
  expect(screen.queryByText('Admin')).toBeNull()
  act(() =>
    fixtures.listeners.get('users/owner/children/child')!({
      exists: () => true,
      data: () => ({ displayName: 'Shared child', sharedDataVersion: 1 }),
      metadata: { fromCache: false },
    })
  )
  expect(screen.getByText('Shared child')).toBeInTheDocument()
  expect(screen.getByText('Secondary')).toBeInTheDocument()
  const oldProfile = fixtures.listeners.get('users/owner/children/child')!
  // A new membership replaces the old subscription and discards its cached scope.
  act(() =>
    fixtures.listeners.get('users/parent/childAccess')!({
      docs: [
        snapshot('grant', {
          ownerUid: 'owner',
          childId: 'child',
          membershipVersion: 2,
          status: 'active',
        }),
      ],
    })
  )
  expect(screen.getByText('Opening')).toBeInTheDocument()
  act(() =>
    oldProfile({
      exists: () => true,
      data: () => ({ displayName: 'Stale child' }),
      metadata: { fromCache: false },
    })
  )
  expect(screen.queryByText('Stale child')).toBeNull()
  expect(screen.getByText('Opening')).toBeInTheDocument()
  act(() =>
    fixtures.listeners.get('users/owner/children/child')!({
      exists: () => true,
      data: () => ({ displayName: 'Renewed child' }),
      metadata: { fromCache: false },
    })
  )
  expect(screen.getByText('Renewed child')).toBeInTheDocument()
  act(() => fixtures.listeners.get('users/parent/childAccess')!({ docs: [] }))
  expect(fixtures.revoke).toHaveBeenCalled()
  expect(screen.getByText('Own child')).toBeInTheDocument()
  expect(screen.getByText('Admin')).toBeInTheDocument()
  act(() =>
    oldProfile({
      exists: () => true,
      data: () => ({ displayName: 'Stale child' }),
      metadata: { fromCache: false },
    })
  )
  expect(screen.queryByText('Stale child')).toBeNull()
})
