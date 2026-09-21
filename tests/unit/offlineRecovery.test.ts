import { afterEach, expect, it, vi } from 'vitest'
import { OfflineStore } from '../../src/offline/store'
import { OfflineSync, SYNC_TIMEOUT_MS } from '../../src/offline/sync'
import { emptyState, type OfflineState } from '../../src/offline/model'
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

it('leaves offline changes durable without retrying the network, then reconnects', async () => {
  vi.useFakeTimers()
  const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  const store = await queued()
  const send = vi.fn().mockResolvedValue(receipt)
  const sync = new OfflineSync(store, send)
  stops.push(sync.start())
  await vi.advanceTimersByTimeAsync(120_000)
  expect(send).not.toHaveBeenCalled()
  expect(store.getSnapshot()?.pending).toHaveLength(1)
  expect(sync.getSnapshot().state).toBe('waiting')
  online.mockReturnValue(true)
  window.dispatchEvent(new Event('online'))
  await vi.advanceTimersByTimeAsync(0)
  expect(store.getSnapshot()?.pending).toHaveLength(0)
})

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

it('does not replay a receipt already acknowledged by another tab over newer data', async () => {
  const store = await queued()
  const id = store.getSnapshot()!.pending[0].id
  await store.acknowledge(id, receipt)
  await store.mergeCollection('children', {})
  await store.acknowledge(id, receipt)
  expect(store.getSnapshot()?.documents.children).toEqual({})
})
