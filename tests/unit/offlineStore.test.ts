import { describe, expect, it } from 'vitest'
import {
  enqueue,
  emptyState,
  projectDocuments,
  type Action,
  type OfflineState,
} from '../../src/offline/model'
import { OfflineStore } from '../../src/offline/store'
import type { OfflinePersistence } from '../../src/offline/persistence'

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
  it('counts separate devices but suppresses repeated callbacks for one completed attempt', () => {
    const first = seeded(),
      second = seeded()
    const a = enqueue(first, completion()),
      b = enqueue(second, completion())
    expect(a?.id).not.toBe(b?.id)
    expect(a?.deviceId).not.toBe(b?.deviceId)
    expect(enqueue(first, completion())).toBeNull()
    expect(projectDocuments(first, 'children').child.totalStars).toBe(8)
    expect(projectDocuments(second, 'children').child.totalStars).toBe(8)
  })
  it('allows reset/repeat and next-day completion without losing earlier delivery records', () => {
    const state = seeded()
    enqueue(state, completion())
    enqueue(state, {
      ...completion(),
      kind: 'activity',
      collection: 'chores',
      entityId: 'tidy',
      childId: 'child',
      dateKey: '2026-09-14',
      patch: { manageCompletedAt: null },
      delta: 0,
      complete: false,
      reset: true,
      consume: false,
    })
    enqueue(state, completion())
    enqueue(state, completion('2026-09-15'))
    expect(state.pending).toHaveLength(4)
    expect(projectDocuments(state, 'children').child.totalStars).toBe(14)
  })
  it('clamps overspending per action, without carrying debt into later earnings', () => {
    const state = seeded()
    enqueue(state, {
      kind: 'redeem',
      childId: 'child',
      entityId: 'toy',
      cost: 10,
      title: 'Toy',
      consume: false,
    })
    enqueue(state, completion())
    expect(projectDocuments(state, 'children').child.totalStars).toBe(3)
  })
  it('does not double-project a server snapshot that already includes a pending action', () => {
    const state = seeded()
    enqueue(state, completion())
    state.documents.children.child = {
      totalStars: 8,
      offlineDeviceSequences: { [state.deviceId]: 1 },
    }
    expect(projectDocuments(state, 'children').child.totalStars).toBe(8)
  })
})

describe('durable offline store', () => {
  it('survives reopening, preserves ordered IDs and isolates accounts', async () => {
    const disk = new MemoryPersistence()
    const store = new OfflineStore('parent', disk)
    await store.mergeCollection('children', { child: { totalStars: 5 } })
    await Promise.all([
      store.queue(completion()),
      store.queue(completion('2026-09-15')),
    ])
    const reopened = new OfflineStore('parent', disk)
    await reopened.open()
    expect(reopened.getSnapshot()).toEqual(store.getSnapshot())
    expect(reopened.getSnapshot()?.pending.map((op) => op.sequence)).toEqual([
      1, 2,
    ])
    const other = new OfflineStore('other-parent', disk)
    await other.open()
    expect(other.getSnapshot()?.pending).toEqual([])
    expect(other.getSnapshot()?.documents.children).toEqual({})
  })
  it('never shows success or loses the action when a local write fails', async () => {
    const disk = new MemoryPersistence(),
      store = new OfflineStore('parent', disk)
    await store.mergeCollection('children', { child: { totalStars: 5 } })
    const before = store.getSnapshot()
    disk.fail = true
    await expect(store.queue(completion())).rejects.toThrow('Disk full')
    expect(store.getSnapshot()).toBe(before)
    disk.fail = false
    await store.queue(completion())
    expect(store.getSnapshot()?.pending).toHaveLength(1)
  })
})
