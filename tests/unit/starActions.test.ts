import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  nextId: 0,
  runTransaction: vi.fn(),
  doc: vi.fn((...segments: unknown[]) => {
    if (segments.length === 1)
      return `${String(segments[0])}/generated-id-${++firestore.nextId}`
    return segments.slice(1).map(String).join('/')
  }),
  collection: vi.fn((...segments: unknown[]) =>
    segments.slice(1).map(String).join('/')
  ),
  increment: vi.fn((value: number) => ({ increment: value })),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}))

vi.mock('../../src/firebaseDb', () => ({ db: { name: 'test-db' } }))

vi.mock('firebase/firestore', () => ({
  collection: firestore.collection,
  doc: firestore.doc,
  increment: firestore.increment,
  runTransaction: firestore.runTransaction,
  serverTimestamp: firestore.serverTimestamp,
}))

import {
  completeTaskAndAwardStars,
  redeemReward,
} from '../../src/lib/starActions'

const snapshot = (data?: Record<string, unknown>) => ({
  exists: () => data !== undefined,
  data: () => data,
})

describe('star transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    firestore.nextId = 0
  })

  it('uses the stored reward price and deletes one-time rewards in the transaction', async () => {
    const transaction = {
      get: vi.fn(async (reference: string) => {
        if (reference.endsWith('/children/child-1')) {
          return snapshot({ totalStars: 10 })
        }
        return snapshot({
          title: 'Stored reward',
          costStars: 6,
          isRepeating: false,
        })
      }),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    firestore.runTransaction.mockImplementation(async (_db, callback) =>
      callback(transaction)
    )

    const receipt = await redeemReward({
      userId: 'user-1',
      childId: 'child-1',
      reward: { id: 'reward-1', title: 'Stale title', costStars: 1 },
    })
    expect(receipt).toEqual({
      title: 'Stored reward',
      starsBefore: 10,
      starsAfter: 4,
    })

    expect(transaction.update).toHaveBeenCalledWith(
      'users/user-1/children/child-1',
      { totalStars: { increment: -6 } }
    )
    expect(transaction.set).toHaveBeenCalledWith(
      'users/user-1/redemptions/generated-id-1',
      expect.objectContaining({
        rewardTitle: 'Stored reward',
        costStars: 6,
      })
    )
    expect(transaction.delete).toHaveBeenCalledWith(
      'users/user-1/rewards/reward-1'
    )
  })
})

describe('test completion star awards', () => {
  const childPath = 'users/parent/children/child'
  const taskPath = 'users/parent/tests/test'
  const dateKey = '2026-09-13'
  const options = {
    userId: 'parent',
    childId: 'child',
    taskId: 'test',
    taskCollection: 'tests' as const,
    dateKey,
    delta: 3,
    updates: {
      lastAttemptedAt: 1000,
      lastAttemptDateKey: dateKey,
      lastAttemptOutcome: 'success',
    },
  }
  let documents: Map<string, Record<string, unknown>>
  const events = () =>
    [...documents.entries()].filter(([path]) => path.includes('/starEvents/'))

  beforeEach(() => {
    vi.clearAllMocks()
    firestore.nextId = 0
    documents = new Map([[childPath, { totalStars: 10 }]])
    // Serialize commits as Firestore does when transactions contend on a task.
    let pending = Promise.resolve<unknown>(undefined)
    firestore.runTransaction.mockImplementation((_db, callback) => {
      const transaction = pending.then(async () => {
        const writes: (() => void)[] = []
        const result = await callback({
          get: async (path: string) => snapshot(documents.get(path)),
          set: (path: string, data: Record<string, unknown>) =>
            writes.push(() => documents.set(path, { ...data })),
          delete: (path: string) => writes.push(() => documents.delete(path)),
          update: (path: string, patch: Record<string, unknown>) =>
            writes.push(() => {
              const data = { ...documents.get(path) }
              for (const [key, value] of Object.entries(patch)) {
                data[key] =
                  typeof value === 'object' &&
                  value !== null &&
                  'increment' in value
                    ? Number(data[key] ?? 0) + Number(value.increment)
                    : value
              }
              documents.set(path, data)
            }),
        })
        writes.forEach((commit) => commit())
        return result
      })
      pending = transaction.catch(() => {})
      return transaction
    })
  })

  it('awards math again after a same-day reset and deduplicates completion callbacks', async () => {
    const taskType = 'math' as const

    documents.set(taskPath, { childId: 'child', taskType })
    const complete = () => completeTaskAndAwardStars(options)
    const [first, duplicate] = await Promise.all([complete(), complete()])
    expect(first.appliedDelta).toBe(3)
    expect(duplicate).toEqual({ appliedDelta: 0, wasAlreadyAwarded: true })
    expect(documents.get(childPath)?.totalStars).toBe(13)
    const firstEvent = events()[0]

    // These are the persisted fields cleared by resetTest.
    documents.set(taskPath, {
      ...documents.get(taskPath),
      lastAttemptedAt: null,
      lastAttemptDateKey: '',
      lastAttemptOutcome: null,
    })
    const [replay, replayDuplicate] = await Promise.all([
      complete(),
      complete(),
    ])
    expect(replay.appliedDelta).toBe(3)
    expect(replayDuplicate.appliedDelta).toBe(0)
    expect(documents.get(childPath)?.totalStars).toBe(16)
    expect(events()).toHaveLength(2)
    expect(events()[0]).toEqual(firstEvent)
  })

  it('allows the next day’s test attempt without an explicit reset', async () => {
    documents.set(taskPath, {
      childId: 'child',
      taskType: 'math',
      lastAttemptedAt: 1000,
      lastAttemptDateKey: '2026-09-12',
      lastAttemptOutcome: 'success',
    })
    expect((await completeTaskAndAwardStars(options)).appliedDelta).toBe(3)
    expect(documents.get(childPath)?.totalStars).toBe(13)
  })

  it('creates a built-in test and awards its first completion only once', async () => {
    const request = {
      ...options,
      initialTaskData: { childId: 'child', taskType: 'math' },
    }
    const results = await Promise.all([
      completeTaskAndAwardStars(request),
      completeTaskAndAwardStars(request),
    ])
    expect(results.map((result) => result.appliedDelta)).toEqual([3, 0])
    expect(events()).toHaveLength(1)
    expect(documents.get(taskPath)).toMatchObject(options.updates)
  })
})
