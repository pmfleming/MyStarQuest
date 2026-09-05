import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  runTransaction: vi.fn(),
  doc: vi.fn((...segments: unknown[]) => {
    if (segments.length === 1) return `${String(segments[0])}/generated-id`
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

import { redeemReward } from '../../src/lib/starActions'

const snapshot = (data?: Record<string, unknown>) => ({
  exists: () => data !== undefined,
  data: () => data,
})

describe('star transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    await redeemReward({
      userId: 'user-1',
      childId: 'child-1',
      reward: { id: 'reward-1', title: 'Stale title', costStars: 1 },
    })

    expect(transaction.update).toHaveBeenCalledWith(
      'users/user-1/children/child-1',
      { totalStars: { increment: -6 } }
    )
    expect(transaction.set).toHaveBeenCalledWith(
      'users/user-1/redemptions/generated-id',
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
