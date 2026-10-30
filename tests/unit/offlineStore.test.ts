import { describe, expect, it } from 'vitest'
import {
  enqueue,
  historyDocuments,
  emptyState,
  projectDocuments,
  type Action,
  type OfflineState,
} from '../../src/offline/model'
import { OfflineStore } from '../../src/offline/store'
import type { OfflinePersistence } from '../../src/offline/persistence'
import { deviceDocuments } from '../../src/offline/selectors'

class MemoryPersistence implements OfflinePersistence {
  accounts = new Map<string, OfflineState>()
  fail = false
  async read(id: string) {
    return structuredClone(this.accounts.get(id))
  }
  async write(id: string, state: OfflineState) {
    if (this.fail) throw new Error('Disk full')
    this.accounts.set(id, structuredClone(state))
  }
}
const completion = (dateKey = '2026-09-14'): Action => ({
  kind: 'activity',
  collection: 'chores',
  entityId: 'tidy',
  childId: 'child',
  dateKey,
  patch: { manageCompletedAt: 1 },
  delta: 3,
  complete: true,
  reset: false,
  consume: false,
})
const seeded = () => {
  const state = emptyState()
  state.documents.children.child = { totalStars: 5 }
  return state
}

describe('offline action model', () => {
  it('starts a new device day without erasing yesterday’s queued completion', () => {
    const state = seeded()
    state.documents.chores.tidy = { title: 'Tidy', manageCompletedAt: 999 }
    enqueue(state, completion())
    expect(
      deviceDocuments(state, 'chores', '2026-09-14').tidy.manageCompletedAt
    ).toBe(1)
    expect(
      deviceDocuments(state, 'chores', '2026-09-15').tidy.manageCompletedAt
    ).toBeNull()
    expect(state.pending).toHaveLength(1)
    expect(projectDocuments(state, 'children').child.totalStars).toBe(8)
    state.documents.children.child = {
      totalStars: 8,
      offlineDeviceSequences: { [state.deviceId]: 1 },
    }
    expect(projectDocuments(state, 'children').child.totalStars).toBe(8)
  })
})

describe('durable offline store', () => {
  it.each([2, '2'])(
    'can retry a storage failure and preserves revision %s against older or unversioned snapshots',
    async (revision) => {
      const disk = new MemoryPersistence()
      const store = new OfflineStore('parent', disk)
      disk.fail = true
      await expect(store.open()).rejects.toThrow('Disk full')
      disk.fail = false
      await store.mergeCollection('rewards', {
        toy: { title: 'New', offlineRevision: revision },
      })
      await store.mergeCollection('rewards', {
        toy: { title: 'Old', offlineRevision: 1 },
      })
      await store.mergeCollection('rewards', { toy: { title: 'Unversioned' } })
      expect(store.getSnapshot()?.documents.rewards.toy.title).toBe('New')
    }
  )
})

it('keeps completion and reward snapshots through deletion, acknowledgement and restart', async () => {
  const disk = new MemoryPersistence()
  const store = new OfflineStore('parent', disk)
  await store.mergeCollection('children', { child: { totalStars: 5 } })
  await store.mergeCollection('chores', {
    tidy: { title: 'Tidy room', imageKey: 'tidyingUp' },
  })
  await store.mergeCollection('rewards', {
    toy: { title: 'Toy', imageKey: 'yoshiEgg' },
  })
  const done = await store.queue(completion())
  const gift = await store.queue({
    kind: 'redeem',
    entityId: 'toy',
    childId: 'child',
    title: 'Toy',
    cost: 2,
    consume: true,
  })
  await store.mergeCollection('chores', {})
  await store.mergeCollection('rewards', {})
  expect(
    historyDocuments(store.getSnapshot()!, 'starEvents')[done!.id]
  ).toMatchObject({
    taskTitle: 'Tidy room',
    imageKey: 'tidyingUp',
    pending: true,
  })
  await store.acknowledge(done!.id, {
    collection: 'children',
    entityId: 'child',
    document: { totalStars: 8 },
    appliedDelta: 3,
  })
  await store.acknowledge(gift!.id, {
    collection: 'children',
    entityId: 'child',
    document: { totalStars: 6 },
  })
  const reopened = new OfflineStore('parent', disk)
  await reopened.open()
  expect(
    Object.values(historyDocuments(reopened.getSnapshot()!, 'starEvents'))
  ).toEqual([expect.objectContaining({ taskTitle: 'Tidy room', delta: 3 })])
  expect(
    Object.values(historyDocuments(reopened.getSnapshot()!, 'redemptions'))
  ).toEqual([
    expect.objectContaining({
      rewardTitle: 'Toy',
      imageKey: 'yoshiEgg',
      costStars: 2,
    }),
  ])
  await reopened.mergeHistory('starEvents', {
    [done!.id]: { taskTitle: 'Tidy room', delta: 3 },
  })
  expect(
    Object.keys(historyDocuments(reopened.getSnapshot()!, 'starEvents'))
  ).toHaveLength(1)
  await reopened.revoke()
  expect(historyDocuments(reopened.getSnapshot()!, 'starEvents')).toEqual({})
})

it('uses authoritative shared receipts without duplicating or inventing completion events', async () => {
  const store = new OfflineStore('parent', new MemoryPersistence())
  await store.mutate((state) => {
    state.shared = true
    state.documents.children.child = { totalStars: 5 }
  })
  const done = await store.queue(completion())
  await store.acknowledge(done!.id, {
    collection: 'children',
    entityId: 'child',
    document: { totalStars: 8 },
    history: {
      collection: 'starEvents',
      id: done!.id,
      data: { childId: 'child', taskTitle: 'Server title', delta: 3 },
    },
  })
  await store.mergeHistory('starEvents', {
    [done!.id]: { childId: 'child', taskTitle: 'Server title', delta: 3 },
  })
  expect(
    Object.keys(historyDocuments(store.getSnapshot()!, 'starEvents'))
  ).toHaveLength(1)
  await store.mutate((state) => {
    state.activities = {}
  })
  const duplicate = await store.queue(completion())
  await store.acknowledge(duplicate!.id, {
    collection: 'children',
    entityId: 'child',
    document: { totalStars: 8 },
    appliedDelta: 0,
  })
  expect(
    Object.keys(historyDocuments(store.getSnapshot()!, 'starEvents'))
  ).toHaveLength(1)
})

it('leaves projections and sequence unchanged when preparation or validation fails', () => {
  const state = seeded()
  const before = structuredClone(state)
  expect(() => enqueue(state, { ...completion(), childId: 'missing' })).toThrow(
    'Child is not saved'
  )
  expect(state).toEqual(before)
  expect(() => enqueue(state, { ...completion(), delta: NaN })).toThrow()
  expect(state).toEqual(before)
})
