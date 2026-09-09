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
import { isChoreWithEphemeral, isEatingTask } from '../../src/data/types'

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
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

const baseChore = {
  childId: 'child',
  starValue: 1,
  isRepeating: true,
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
}
const choreCases = [
  {
    title: 'Get dressed',
    fields: { taskType: 'standard', manageCompletedAt: 123 },
    reset: { manageCompletedAt: null },
    completed: { manageCompletedAt: 456 },
    readyLabel: 'Give stars for Get dressed',
  },
  {
    title: 'Dinner',
    fields: {
      taskType: 'eating',
      dinnerTotalBites: 4,
      dinnerDurationSeconds: 900,
      manageDinnerBitesLeft: 0,
      manageDinnerRemainingSeconds: 120,
      manageDinnerTimerStartedAt: null,
      manageDinnerCompletedAt: 123,
    },
    reset: {
      manageDinnerBitesLeft: 4,
      manageDinnerRemainingSeconds: 900,
      manageDinnerTimerStartedAt: null,
      manageDinnerCompletedAt: null,
    },
    completed: { manageDinnerBitesLeft: 0, manageDinnerCompletedAt: 456 },
    readyLabel: 'Run Dinner',
  },
  {
    title: 'Water and toilet',
    fields: {
      taskType: 'watertoiletcheck',
      manageWaterLevel: 'empty',
      manageToiletStatus: 'didpeepee',
      manageWaterToiletCompletedAt: 123,
    },
    reset: {
      manageWaterLevel: 'full',
      manageToiletStatus: 'notpeepee',
      manageWaterToiletCompletedAt: null,
    },
    completed: { manageWaterToiletCompletedAt: 456 },
    readyLabel: 'Run Water and toilet',
  },
]
let emitSnapshot: (patch: object) => void
let resolveWrite: () => void
let rejectWrite: (error: Error) => void

function ChoreList() {
  const chores = useChores()
  const descriptor = createUnifiedChoreDescriptor({
    theme: themes.princess,
    mode: 'today',
    activeIds: {},
    checkTriggers: {},
    biteCooldownSeconds: 15,
    onReset: (item) => {
      if (isChoreWithEphemeral(item)) {
        return isEatingTask(item)
          ? chores.resetDinner(item)
          : chores.resetChore(item)
      }
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

describe.each(choreCases)(
  '$title reset',
  ({ title, fields, reset, completed, readyLabel }) => {
    beforeEach(() => {
      firestore.onSnapshot.mockImplementation((_query, callback) => {
        emitSnapshot = (patch) =>
          callback({
            docs: [
              {
                id: 'get-dressed',
                data: () => ({ ...baseChore, title, ...fields, ...patch }),
              },
            ],
          })
        emitSnapshot({})
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
      'keeps the chore reset when updates arrive %s, then accepts a later completion',
      async (order) => {
        render(<ChoreList />)
        fireEvent.click(
          await screen.findByRole('button', { name: `Reset ${title}` })
        )
        fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
        expect(firestore.updateDoc).toHaveBeenCalledWith(
          'users/parent/chores/get-dressed',
          reset
        )
        expect(screen.getByRole('button', { name: readyLabel })).toBeVisible()

        if (order === 'write-first') {
          await act(async () => resolveWrite())
          expect(screen.getByRole('button', { name: readyLabel })).toBeEnabled()
          act(() => emitSnapshot(reset))
        } else {
          act(() => emitSnapshot(reset))
          await act(async () => resolveWrite())
        }
        expect(screen.getByRole('button', { name: readyLabel })).toBeEnabled()

        act(() => emitSnapshot(completed))
        expect(
          await screen.findByRole('button', { name: `Reset ${title}` })
        ).toBeEnabled()
        expect(
          screen.queryByRole('button', { name: readyLabel })
        ).not.toBeInTheDocument()
      }
    )

    it('restores completion and reports a failed reset, allowing a retry', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      render(<ChoreList />)
      fireEvent.click(
        await screen.findByRole('button', { name: `Reset ${title}` })
      )
      fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
      await act(async () => rejectWrite(new Error('Write failed')))
      expect(await screen.findByRole('alert')).toHaveTextContent('Reset failed')
      fireEvent.click(screen.getByRole('button', { name: `Reset ${title}` }))
      fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
      act(() => emitSnapshot(reset))
      await act(async () => resolveWrite())
      await waitFor(() =>
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      )
      expect(screen.getByRole('button', { name: readyLabel })).toBeEnabled()
    })
  }
)
