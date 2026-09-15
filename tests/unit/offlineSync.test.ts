import { describe, expect, it, vi } from 'vitest'
import { OfflineSync } from '../../src/offline/sync'
import { OfflineStore } from '../../src/offline/store'
import type { OfflineState } from '../../src/offline/model'
import {
  applyOperation,
  type SyncTransaction,
} from '../../src/offline/transport'
import {
  emptyState,
  enqueue,
  type LocalDocument,
  type Action,
} from '../../src/offline/model'

function server() {
  const documents = new Map<string, LocalDocument>([
    ['users/parent/children/child', { totalStars: 5 }],
  ])
  let wrote = false
  const transaction: SyncTransaction = {
    get: async (path) => {
      if (wrote) throw new Error('Read after write')
      return structuredClone(documents.get(path))
    },
    set: (path, data) => {
      wrote = true
      documents.set(path, structuredClone(data))
    },
    delete: (path) => {
      wrote = true
      documents.delete(path)
    },
  }
  return {
    documents,
    run: async (operation: Parameters<typeof applyOperation>[2]) => {
      wrote = false
      return applyOperation(transaction, 'parent', operation)
    },
  }
}
function operation(action: Action) {
  const state = emptyState()
  state.documents.children.child = { totalStars: 5 }
  return enqueue(state, action)!
}
const credit: Action = {
  kind: 'activity',
  collection: 'chores',
  entityId: 'tidy',
  childId: 'child',
  dateKey: '2026-09-14',
  patch: { manageCompletedAt: 1 },
  complete: true,
  reset: false,
  delta: 3,
  consume: false,
}

describe('offline Firebase transaction protocol', () => {
  it('counts different devices separately and retries the same action exactly once', async () => {
    const cloud = server()
    const a = operation(credit),
      b = operation(credit)
    const first = await cloud.run(a)
    expect(await cloud.run(a)).toEqual(first)
    await cloud.run(b)
    expect(cloud.documents.get('users/parent/children/child')?.totalStars).toBe(
      11
    )
    expect(
      [...cloud.documents.keys()].filter((key) => key.includes('/starEvents/'))
    ).toHaveLength(2)
  })
  it('honours offline reward prices, floors each debit, and adds later earnings normally', async () => {
    const cloud = server()
    const buy = operation({
      kind: 'redeem',
      entityId: 'toy',
      childId: 'child',
      title: 'Toy',
      cost: 10,
      consume: true,
    })
    await cloud.run(buy)
    expect(cloud.documents.get('users/parent/children/child')?.totalStars).toBe(
      0
    )
    await cloud.run(operation(credit))
    await cloud.run(buy)
    expect(cloud.documents.get('users/parent/children/child')?.totalStars).toBe(
      3
    )
    expect(
      cloud.documents.get(`users/parent/redemptions/${buy.id}`)?.chargedStars
    ).toBe(5)
  })
  it('does not overwrite shared tasks or another day when an old completion arrives', async () => {
    const cloud = server()
    cloud.documents.set('users/parent/chores/tidy', {
      title: 'Tidy',
      manageCompletedAt: null,
    })
    await cloud.run(operation(credit))
    expect(cloud.documents.get('users/parent/chores/tidy')).toEqual({
      title: 'Tidy',
      manageCompletedAt: null,
    })
    expect(
      [...cloud.documents.keys()].filter((key) =>
        key.includes('/deviceActivities/')
      )[0]
    ).toContain('2026-09-14')
  })
  it('preserves conflicts instead of silently recreating a deleted child or definition', async () => {
    const cloud = server()
    cloud.documents.clear()
    await expect(cloud.run(operation(credit))).rejects.toThrow('deleted')
    await expect(
      cloud.run(
        operation({
          kind: 'document',
          collection: 'rewards',
          entityId: 'removed',
          mode: 'patch',
          data: { title: 'New' },
        })
      )
    ).rejects.toThrow('deleted')
    expect(cloud.documents.size).toBe(0)
  })
})

it('retries after a lost response and retains the queue until a durable acknowledgement', async () => {
  const cloud = server()
  let saved: OfflineState | undefined
  const store = new OfflineStore('parent', {
    read: async () => saved,
    write: async (_id, state) => {
      saved = structuredClone(state)
    },
  })
  await store.mergeCollection('children', { child: { totalStars: 5 } })
  await store.queue(credit)
  let loseResponse = true
  const send = vi.fn(async (_id, action) => {
    const receipt = await cloud.run(action)
    if (loseResponse) {
      loseResponse = false
      throw new Error('Connection dropped after commit')
    }
    return receipt
  })
  const sync = new OfflineSync(store, send)
  const stop = sync.start()
  try {
    await vi.waitFor(() => expect(sync.getSnapshot().state).toBe('waiting'))
    expect(saved?.pending).toHaveLength(1)
    const firstId = saved?.pending[0].id
    sync.retry()
    await vi.waitFor(() => expect(sync.getSnapshot().state).toBe('ready'))
    expect(saved?.pending).toHaveLength(0)
    expect(send.mock.calls[1][1].id).toBe(firstId)
    expect(cloud.documents.get('users/parent/children/child')?.totalStars).toBe(
      8
    )
    expect(saved?.documents.children.child.totalStars).toBe(8)
  } finally {
    stop()
  }
})
