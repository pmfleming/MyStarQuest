import { describe, expect, it } from 'vitest'
import {
  enqueue,
  emptyState,
  projectDocuments,
  type Action,
  type OfflineState,
  offlineStateSchema,
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
  it('validates durable queues without dropping damaged operations', () => {
    const state = seeded()
    enqueue(state, completion())
    expect(offlineStateSchema.parse(state)).toEqual(state)
    state.pending[0].sequence = NaN
    expect(() => offlineStateSchema.parse(state)).toThrow()
    expect(state.pending).toHaveLength(1)
  })
  it('can retry an initial storage failure and ignores older document snapshots', async () => {
    const disk = new MemoryPersistence()
    const store = new OfflineStore('parent', disk)
    disk.fail = true
    await expect(store.open()).rejects.toThrow('Disk full')
    disk.fail = false
    await store.mergeCollection('rewards', {
      toy: { title: 'New', offlineRevision: 2 },
    })
    await store.mergeCollection('rewards', {
      toy: { title: 'Old', offlineRevision: 1 },
    })
    expect(store.getSnapshot()?.documents.rewards.toy.title).toBe('New')
  })
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
})
