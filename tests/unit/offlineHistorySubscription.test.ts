import { afterEach, expect, it, vi } from 'vitest'
import { emptyState } from '../../src/offline/model'
import { OfflineStore } from '../../src/offline/store'
import { createReadModel } from '../../src/offline/readModel'
import { calendarHistoryWindow } from '../../src/offline/historyRetention'
vi.mock('../../src/offline/runtime', () => ({ offlineRuntime: vi.fn() }))
vi.mock('../../src/offline/historyQueries', () => ({
  subscribeHistoryWindow: vi.fn(() => vi.fn()),
}))
vi.mock('../../src/offline/firebaseTransport', () => ({
  snapshotDocument: (data: unknown) => data,
}))
import { offlineRuntime } from '../../src/offline/runtime'
import { subscribeHistoryWindow } from '../../src/offline/historyQueries'
import { subscribeOfflineCollection } from '../../src/offline/subscribeCollection'
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
it('retains the mounted period when another tab replaces the durable history window', async () => {
  let saved = emptyState()
  const store = new OfflineStore('parent', {
    read: async () => structuredClone(saved),
    write: async (_id, state) => {
      saved = structuredClone(state)
    },
  })
  const january = calendarHistoryWindow('2024-01-15', 'month')
  vi.mocked(offlineRuntime).mockReturnValue({
    store,
    documents: createReadModel(store.getSnapshot, () => '2026-11-16'),
    subscribeErrors: () => () => {},
    getError: () => null,
  } as ReturnType<typeof offlineRuntime>)
  const receive = vi.fn(),
    onError = vi.fn()
  const stop = subscribeOfflineCollection({
    userId: 'parent',
    collectionName: 'starEvents',
    historyWindow: january,
    receive,
    onError,
  })
  await vi.waitFor(() => expect(subscribeHistoryWindow).toHaveBeenCalled())
  expect(receive.mock.lastCall?.[1]).toBe(false)
  const server = vi.mocked(subscribeHistoryWindow).mock.calls[0][3]
  server(
    { january: { dateKey: '2024-01-15', taskTitle: 'January task' } },
    false
  )
  await store.mutate(() => {})
  expect(receive.mock.lastCall?.[1]).toBe(true)
  await store.mergeHistory(
    'starEvents',
    { february: { dateKey: '2024-02-15' } },
    calendarHistoryWindow('2024-02-15', 'month')
  )
  expect(saved.history?.starEvents.january).toBeUndefined()
  expect(
    receive.mock.lastCall?.[0].some(
      (doc: { id: string }) => doc.id === 'january'
    )
  ).toBe(true)
  await store.revoke()
  expect(receive.mock.lastCall?.[0]).toEqual([])
  server({ january: { dateKey: '2024-01-15' } }, false)
  expect(receive.mock.lastCall?.[0]).toEqual([])
  stop()
  expect(
    vi.mocked(subscribeHistoryWindow).mock.results[0].value
  ).toHaveBeenCalledOnce()
})
it('reports an uncached offline period instead of declaring empty history complete', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  const store = new OfflineStore('parent', {
    read: async () => emptyState(),
    write: async () => {},
  })
  vi.mocked(offlineRuntime).mockReturnValue({
    store,
    documents: createReadModel(store.getSnapshot, () => '2026-11-16'),
    subscribeErrors: () => () => {},
    getError: () => null,
  } as ReturnType<typeof offlineRuntime>)
  const receive = vi.fn(),
    onError = vi.fn()
  const stop = subscribeOfflineCollection({
    userId: 'parent',
    collectionName: 'redemptions',
    historyWindow: calendarHistoryWindow('2024-01-15', 'month'),
    receive,
    onError,
  })
  await vi.waitFor(() => expect(onError).toHaveBeenCalled())
  expect(receive.mock.lastCall?.[1]).toBe(false)
  stop()
})
