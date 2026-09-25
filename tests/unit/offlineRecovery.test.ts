import { afterEach, expect, it, vi } from 'vitest'
import { emptyState, type OfflineState } from '../../src/offline/model'
import { OfflineStore } from '../../src/offline/store'
import { OfflineSync, SYNC_TIMEOUT_MS } from '../../src/offline/sync'
import type { SyncReceipt } from '../../src/offline/transport'

const stops: (() => void)[] = []
afterEach(() => {
  stops.splice(0).forEach((stop) => stop())
  vi.useRealTimers()
  vi.restoreAllMocks()
})
async function queued() {
  let saved: OfflineState = emptyState()
  const store = new OfflineStore('parent', {
    read: async () => structuredClone(saved),
    write: async (_id, state) => {
      saved = structuredClone(state)
    },
  })
  await store.queue({
    kind: 'document',
    collection: 'children',
    entityId: 'child',
    mode: 'put',
    data: { totalStars: 5 },
  })
  return store
}
const receipt: SyncReceipt = {
  collection: 'children',
  entityId: 'child',
  document: { totalStars: 5 },
}

it('recovers a stalled send with the same operation ID and ignores the late response', async () => {
  vi.useFakeTimers()
  const store = await queued()
  let finish!: (value: SyncReceipt) => void
  const send = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<SyncReceipt>((resolve) => {
          finish = resolve
        })
    )
    .mockResolvedValue(receipt)
  const sync = new OfflineSync(store, send)
  stops.push(sync.start())
  await vi.advanceTimersByTimeAsync(SYNC_TIMEOUT_MS)
  expect(sync.getSnapshot().state).toBe('waiting')
  expect(store.getSnapshot()?.pending).toHaveLength(1)
  sync.retry()
  await vi.advanceTimersByTimeAsync(0)
  expect(send.mock.calls[0][1].id).toBe(send.mock.calls[1][1].id)
  expect(store.getSnapshot()?.pending).toHaveLength(0)
  await store.mergeCollection('children', {})
  finish(receipt)
  await vi.advanceTimersByTimeAsync(0)
  expect(store.getSnapshot()?.documents.children).toEqual({})
})
