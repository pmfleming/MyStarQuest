import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChores } from '../../src/data/useChores'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { themes } from '../../src/contexts/ThemeContext'
import { createUnifiedChoreDescriptor } from '../../src/ui/unifiedChoreDescriptors'
import { toStandardActionListDescriptor } from '../../src/ui/listDescriptorTypes'
import { isChoreWithEphemeral } from '../../src/data/types'

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'parent' } }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: 'child' }),
}))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  query: (source: unknown) => source,
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: firestore.onSnapshot,
  updateDoc: firestore.updateDoc,
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  increment: vi.fn(),
  runTransaction: vi.fn(),
}))

const storedChore = {
  childId: 'child',
  title: 'Get dressed',
  taskType: 'standard',
  starValue: 1,
  isRepeating: true,
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  manageCompletedAt: 123,
}
let emitSnapshot: (completedAt: number | null) => void
let resolveWrite: () => void
let rejectWrite: (error: Error) => void

function ChoreList() {
  const chores = useChores()
  const descriptor = createUnifiedChoreDescriptor({
    theme: themes.princess,
    mode: 'today',
    onReset: (item) => {
      if (isChoreWithEphemeral(item)) return chores.resetChore(item)
    },
  })
  return (
    <StandardActionList
      theme={themes.princess}
      items={chores.todos}
      getKey={(item) => item.id}
      getItemLabel={(item) => item.title}
      {...toStandardActionListDescriptor(descriptor)}
      onDelete={vi.fn()}
      onAdd={vi.fn()}
      addLabel="Chores"
      hideAdd
    />
  )
}

describe('saved chore reset', () => {
  beforeEach(() => {
    firestore.onSnapshot.mockImplementation((_query, callback) => {
      emitSnapshot = (manageCompletedAt) =>
        callback({
          docs: [
            {
              id: 'get-dressed',
              data: () => ({ ...storedChore, manageCompletedAt }),
            },
          ],
        })
      emitSnapshot(123)
      return vi.fn()
    })
    firestore.updateDoc.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          resolveWrite = resolve
          rejectWrite = reject
        })
    )
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it.each(['write-first', 'snapshot-first'] as const)(
    'keeps Get dressed reset when updates arrive %s, then accepts a later completion',
    async (order) => {
      render(<ChoreList />)
      fireEvent.click(
        await screen.findByRole('button', { name: 'Reset Get dressed' })
      )
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        'users/parent/chores/get-dressed',
        { manageCompletedAt: null }
      )
      expect(
        screen.getByRole('button', { name: 'Give stars for Get dressed' })
      ).toBeVisible()

      if (order === 'write-first') {
        await act(async () => resolveWrite())
        expect(
          screen.getByRole('button', { name: 'Give stars for Get dressed' })
        ).toBeEnabled()
        act(() => emitSnapshot(null))
      } else {
        act(() => emitSnapshot(null))
        await act(async () => resolveWrite())
      }
      expect(
        screen.getByRole('button', { name: 'Give stars for Get dressed' })
      ).toBeEnabled()

      act(() => emitSnapshot(456))
      expect(
        await screen.findByRole('button', { name: 'Reset Get dressed' })
      ).toBeEnabled()
      expect(
        screen.queryByRole('button', { name: 'Give stars for Get dressed' })
      ).not.toBeInTheDocument()
    }
  )

  it('restores completion and reports a failed reset, allowing a retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ChoreList />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Reset Get dressed' })
    )
    await act(async () => rejectWrite(new Error('Write failed')))
    expect(await screen.findByRole('alert')).toHaveTextContent('Reset failed')
    fireEvent.click(screen.getByRole('button', { name: 'Reset Get dressed' }))
    act(() => emitSnapshot(null))
    await act(async () => resolveWrite())
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    )
    expect(
      screen.getByRole('button', { name: 'Give stars for Get dressed' })
    ).toBeEnabled()
  })
})
