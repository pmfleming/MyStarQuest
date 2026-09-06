import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTests } from '../../src/data/useTests'
import { buildDefaultTests } from '../../src/data/taskDocuments'
import {
  getManageTaskCompletedAt,
  type TaskOutcome,
} from '../../src/data/types'
import { manageTestOutcomePatch } from '../../src/data/dailyTaskState'
import { getTodayDescriptor } from '../../src/lib/today'
import { completeTaskAndAwardStars } from '../../src/lib/starActions'

const firestore = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
  runTransaction: vi.fn(),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/auth/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'parent' } }),
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: 'child' }),
}))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
vi.mock('../../src/lib/starActions', () => ({
  completeTaskAndAwardStars: vi.fn().mockResolvedValue({ appliedDelta: 1 }),
}))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...parts: string[]) => parts.join('/'),
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  query: (source: unknown) => source,
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: firestore.onSnapshot,
  updateDoc: firestore.updateDoc,
  runTransaction: firestore.runTransaction,
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

const cases = buildDefaultTests('child')
let documents: Record<string, unknown>[]
let emitSnapshot: () => void
let resolveWrite: () => void
let rejectWrite: (error: Error) => void
const attempt = (
  time: number | null,
  outcome: TaskOutcome | null = 'success'
) => ({
  lastAttemptedAt: time,
  lastAttemptDateKey: time === null ? '' : getTodayDescriptor().dateKey,
  lastAttemptOutcome: outcome,
})

describe.each(cases)('$taskType reset persistence', (template) => {
  beforeEach(() => {
    documents = [
      { ...template, id: 'saved-test', createdAt: undefined, ...attempt(123) },
    ]
    firestore.onSnapshot.mockImplementation((_query, callback) => {
      emitSnapshot = () =>
        callback({
          docs: documents.map((data) => ({ id: data.id, data: () => data })),
        })
      emitSnapshot()
      return vi.fn()
    })
    firestore.updateDoc.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          resolveWrite = resolve
          rejectWrite = reject
        })
    )
    firestore.runTransaction.mockImplementation(async (_db, callback) => {
      let write: [string, object] | undefined
      await callback({
        get: async () => ({ exists: () => true }),
        update: (path: string, patch: object) => {
          write = [path, patch]
        },
        set: (path: string, patch: object) => {
          write = [path, patch]
        },
      })
      if (write) await firestore.updateDoc(...write)
    })
    vi.mocked(completeTaskAndAwardStars).mockImplementation(async (options) => {
      await firestore.updateDoc(
        `users/parent/tests/${options.taskId}`,
        options.updates
      )
      return { appliedDelta: 1, wasAlreadyAwarded: false }
    })
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('resets a built-in test through its transaction and stays reset after remount', async () => {
    documents[0] = { ...documents[0], id: template.id }
    const { result, unmount } = renderHook(() => useTests())
    let pending: Promise<void>
    await act(async () => {
      pending = result.current.resetTest(
        result.current.tests.find((test) => test.id === template.id)!
      )
    })
    expect(firestore.runTransaction).toHaveBeenCalledTimes(1)
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      `users/parent/tests/${template.id}`,
      attempt(null, null)
    )
    act(() => {
      documents[0] = { ...documents[0], ...attempt(null, null) }
      emitSnapshot()
    })
    await act(async () => {
      resolveWrite()
      await pending
    })
    unmount()
    const reloaded = renderHook(() => useTests())
    expect(
      getManageTaskCompletedAt(
        reloaded.result.current.tests.find((test) => test.id === template.id)!
      )
    ).toBeNull()
  })

  it.each(['success', 'failure'] as const)(
    'shows a new %s after replay and accepts a subsequent saved reset',
    async (outcome) => {
      documents[0] = { ...documents[0], ...attempt(null, null) }
      const { result } = renderHook(() => useTests())
      const current = () =>
        result.current.tests.find((test) => test.id === 'saved-test')!
      let pending: Promise<void>
      act(() => {
        pending =
          outcome === 'success'
            ? result.current.completeTest(current())
            : result.current.failTest(current())
      })
      const completedAt = getManageTaskCompletedAt(current())
      expect(completedAt).toBeTypeOf('number')
      act(() => {
        documents[0] = { ...documents[0], ...attempt(completedAt, outcome) }
        emitSnapshot()
      })
      await act(async () => {
        resolveWrite()
        await pending
      })
      expect(current()).toMatchObject(
        manageTestOutcomePatch(template.taskType, completedAt, outcome)
      )
      act(() => {
        documents[0] = { ...documents[0], ...attempt(null, null) }
        emitSnapshot()
      })
      expect(getManageTaskCompletedAt(current())).toBeNull()
    }
  )

  it.each(['write-first', 'snapshot-first'] as const)(
    'accepts a new saved attempt after reset arrives %s',
    async (order) => {
      const { result } = renderHook(() => useTests())
      const current = () =>
        result.current.tests.find((test) => test.id === 'saved-test')!
      let pending: Promise<void>
      act(() => {
        pending = result.current.resetTest(current())
      })
      expect(getManageTaskCompletedAt(current())).toBeNull()
      expect(firestore.updateDoc).toHaveBeenCalledWith(
        'users/parent/tests/saved-test',
        attempt(null, null)
      )
      if (order === 'write-first') {
        await act(async () => {
          resolveWrite()
          await pending
        })
        expect(getManageTaskCompletedAt(current())).toBeNull()
        act(() => {
          documents[0] = { ...documents[0], ...attempt(null, null) }
          emitSnapshot()
        })
      } else {
        act(() => {
          documents[0] = { ...documents[0], ...attempt(null, null) }
          emitSnapshot()
        })
        await act(async () => {
          resolveWrite()
          await pending
        })
      }
      expect(getManageTaskCompletedAt(current())).toBeNull()
      act(() => {
        documents[0] = { ...documents[0], ...attempt(456, 'failure') }
        emitSnapshot()
      })
      expect(current()).toMatchObject(
        manageTestOutcomePatch(template.taskType, 456, 'failure')
      )
    }
  )

  it.each(['success', 'failure'] as const)(
    'restores a %s result when reset fails and permits retry',
    async (outcome) => {
      documents[0] = { ...documents[0], ...attempt(123, outcome) }
      const { result } = renderHook(() => useTests())
      const current = () =>
        result.current.tests.find((test) => test.id === 'saved-test')!
      let pending: Promise<void>
      act(() => {
        pending = result.current.resetTest(current())
      })
      await act(async () => {
        const rejected = expect(pending).rejects.toThrow('Write failed')
        rejectWrite(new Error('Write failed'))
        await rejected
      })
      expect(current()).toMatchObject(
        manageTestOutcomePatch(template.taskType, 123, outcome)
      )
      act(() => {
        pending = result.current.resetTest(current())
      })
      act(() => {
        documents[0] = { ...documents[0], ...attempt(null, null) }
        emitSnapshot()
      })
      await act(async () => {
        resolveWrite()
        await pending
      })
      expect(getManageTaskCompletedAt(current())).toBeNull()
    }
  )
})
