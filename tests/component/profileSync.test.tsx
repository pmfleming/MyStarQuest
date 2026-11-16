import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ActiveChildProvider } from '../../src/contexts/ActiveChildProvider'
import { useTheme } from '../../src/contexts/ThemeContext'
import { ThemeProvider } from '../../src/contexts/ThemeProvider'
import { ChildrenProvider, useChildren } from '../../src/data/useChildren'
import ChildAccessProvider from '../../src/sharing/ChildAccessProvider'

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/firebase', () => ({ auth: {} }))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'sync-parent' } }),
}))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  query: (source: unknown) => source,
  orderBy: vi.fn(),
  onSnapshot: firestore.onSnapshot,
  updateDoc: firestore.updateDoc,
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

function Profile() {
  const { theme } = useTheme()
  const { children, changeTheme, updateChildField } = useChildren()
  return (
    <>
      <output aria-label="Theme">{theme.id}</output>
      <output aria-label="Stars">{children[0]?.totalStars}</output>
      <output aria-label="Avatar">{children[0]?.avatarToken}</output>
      <button
        onClick={() =>
          updateChildField(children[0].id, {
            avatarToken: 'mermaid-odette-ping',
          })
        }
      >
        Mermaid avatar
      </button>
      <button onClick={() => changeTheme(children[0], 'princess')}>
        Royal theme
      </button>
    </>
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

it('reconciles a cached theme with remote profile changes and rolls back a rejected edit', async () => {
  localStorage.setItem(
    'mystarquest:active-child:sync-parent',
    JSON.stringify({ id: 'child', themeId: 'princess' })
  )
  let receive!: (snapshot: unknown) => void
  firestore.onSnapshot.mockImplementation((path, callback) => {
    expect(path).toBe('users/sync-parent/children')
    receive = callback
    return vi.fn()
  })
  const emit = (themeId: string, totalStars: number) =>
    act(() =>
      receive({
        docs: [
          {
            id: 'child',
            data: () => ({
              themeId,
              totalStars,
              avatarToken: 'angel-odette-ping',
            }),
          },
        ],
      })
    )
  render(
    <ThemeProvider>
      <ActiveChildProvider>
        <ChildrenProvider>
          <Profile />
        </ChildrenProvider>
      </ActiveChildProvider>
    </ThemeProvider>
  )
  emit('teenie', 8)
  expect(screen.getByLabelText('Theme')).toHaveTextContent('teenie')
  expect(screen.getByLabelText('Stars')).toHaveTextContent('8')
  emit('princess', 11)
  expect(screen.getByLabelText('Theme')).toHaveTextContent('princess')
  expect(screen.getByLabelText('Stars')).toHaveTextContent('11')
  emit('teenie', 11)

  vi.spyOn(console, 'error').mockImplementation(() => {})
  firestore.updateDoc.mockRejectedValueOnce(new Error('Write rejected'))
  act(() => screen.getByRole('button', { name: 'Royal theme' }).click())
  expect(screen.getByLabelText('Theme')).toHaveTextContent('princess')
  await waitFor(() =>
    expect(screen.getByLabelText('Theme')).toHaveTextContent('teenie')
  )
  expect(firestore.updateDoc).toHaveBeenCalledWith(
    'users/sync-parent/children/child',
    { themeId: 'princess' }
  )
  expect(screen.getByLabelText('Avatar')).toHaveTextContent('angel-odette-ping')
  expect(
    JSON.parse(localStorage.getItem('mystarquest:active-child:sync-parent')!)
  ).toEqual({ id: 'child', themeId: 'teenie', ownerUid: 'sync-parent' })

  firestore.updateDoc.mockRejectedValueOnce(new Error('Avatar write rejected'))
  act(() => screen.getByRole('button', { name: 'Mermaid avatar' }).click())
  expect(screen.getByLabelText('Avatar')).toHaveTextContent(
    'mermaid-odette-ping'
  )
  await waitFor(() =>
    expect(screen.getByLabelText('Avatar')).toHaveTextContent(
      'angel-odette-ping'
    )
  )

  firestore.updateDoc.mockResolvedValueOnce(undefined)
  act(() => screen.getByRole('button', { name: 'Mermaid avatar' }).click())
  await waitFor(() =>
    expect(firestore.updateDoc).toHaveBeenLastCalledWith(
      'users/sync-parent/children/child',
      { avatarToken: 'mermaid-odette-ping' }
    )
  )
  act(() =>
    receive({
      docs: [
        {
          id: 'child',
          data: () => ({
            themeId: 'teenie',
            totalStars: 11,
            avatarToken: 'mermaid-odette-ping',
          }),
        },
      ],
    })
  )
  expect(screen.getByLabelText('Avatar')).toHaveTextContent(
    'mermaid-odette-ping'
  )
  expect(screen.getByLabelText('Theme')).toHaveTextContent('teenie')
})

it('syncs local, rejected and remote theme changes with child access enabled', async () => {
  const listeners = new Map<string, Set<(snapshot: unknown) => void>>()
  firestore.onSnapshot.mockImplementation((path: string, callback) => {
    const callbacks = listeners.get(path) ?? new Set()
    callbacks.add(callback)
    listeners.set(path, callbacks)
    return () => callbacks.delete(callback)
  })
  const emit = (path: string, docs: unknown[]) =>
    act(() => {
      for (const callback of listeners.get(path) ?? []) callback({ docs })
    })
  render(
    <ThemeProvider>
      <ActiveChildProvider>
        <ChildAccessProvider>
          <ChildrenProvider>
            <Profile />
          </ChildrenProvider>
        </ChildAccessProvider>
      </ActiveChildProvider>
    </ThemeProvider>
  )
  const child = {
    id: 'child',
    data: () => ({
      themeId: 'teenie',
      avatarToken: 'angel-odette-ping',
      totalStars: 8,
    }),
  }
  emit('users/sync-parent/children', [child])
  emit('users/sync-parent/childAccess', [])
  // The children's collection subscribes once the access provider is ready.
  emit('users/sync-parent/children', [child])
  expect(screen.getByLabelText('Theme')).toHaveTextContent('teenie')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  firestore.updateDoc.mockRejectedValueOnce(new Error('Write rejected'))
  act(() => screen.getByRole('button', { name: 'Royal theme' }).click())
  expect(screen.getByLabelText('Theme')).toHaveTextContent('princess')
  expect(screen.getByLabelText('Avatar')).toHaveTextContent('angel-odette-ping')
  await waitFor(() =>
    expect(screen.getByLabelText('Theme')).toHaveTextContent('teenie')
  )
  firestore.updateDoc.mockClear().mockResolvedValueOnce(undefined)
  act(() => screen.getByRole('button', { name: 'Royal theme' }).click())
  expect(screen.getByLabelText('Theme')).toHaveTextContent('princess')
  await waitFor(() =>
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      'users/sync-parent/children/child',
      { themeId: 'princess' }
    )
  )
  emit('users/sync-parent/children', [
    {
      ...child,
      data: () => ({ ...child.data(), themeId: 'princess' }),
    },
  ])
  expect(screen.getByLabelText('Theme')).toHaveTextContent('princess')
  emit('users/sync-parent/children', [child])
  expect(screen.getByLabelText('Theme')).toHaveTextContent('teenie')
  expect(screen.getByLabelText('Avatar')).toHaveTextContent('angel-odette-ping')
})
