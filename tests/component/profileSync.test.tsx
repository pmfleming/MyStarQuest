import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext'
import { ActiveChildProvider } from '../../src/contexts/ActiveChildContext'
import { ChildrenProvider, useChildren } from '../../src/data/useChildren'

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
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
  const { children, changeTheme } = useChildren()
  return (
    <>
      <output aria-label="Theme">{theme.id}</output>
      <output aria-label="Stars">{children[0]?.totalStars}</output>
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
        docs: [{ id: 'child', data: () => ({ themeId, totalStars }) }],
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
    { themeId: 'princess', avatarToken: '👑' }
  )
  expect(
    JSON.parse(localStorage.getItem('mystarquest:active-child:sync-parent')!)
  ).toEqual({ id: 'child', themeId: 'teenie' })
})
