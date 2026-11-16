import { afterEach, expect, it, vi } from 'vitest'
import type { QuerySnapshot } from 'firebase/firestore'

const listeners = vi.hoisted(() => [] as ((snapshot: QuerySnapshot) => void)[])
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: (
    _query: unknown,
    _options: unknown,
    receive: (snapshot: QuerySnapshot) => void
  ) => {
    listeners.push(receive)
    return vi.fn()
  },
}))
vi.mock('../../src/offline/firebaseTransport', () => ({
  localDocument: (value: unknown) => value,
}))
import { subscribeHistoryWindow } from '../../src/offline/historyQueries'

afterEach(() => {
  vi.useRealTimers()
  listeners.length = 0
})
const doc = (id: string, value: number) => ({ id, data: () => ({ value }) })
function emit(
  index: number,
  docs: ReturnType<typeof doc>[],
  fromCache = false,
  changes?: { type: string; doc: ReturnType<typeof doc> }[]
) {
  listeners[index]({
    metadata: { fromCache },
    get docs() {
      if (changes) throw new Error('Do not rescan a changed snapshot')
      return docs
    },
    docChanges: () => changes ?? [],
  } as unknown as QuerySnapshot)
}
it('coalesces overlapping sources, applies deltas, suppresses duplicates and preserves authority changes', () => {
  vi.useFakeTimers()
  const receive = vi.fn()
  const stop = subscribeHistoryWindow(
    'parent',
    'starEvents',
    { start: 0, end: 1000 },
    receive,
    vi.fn()
  )
  for (let i = 0; i < 4; i++) emit(i, [doc('event', 1)], true)
  vi.runOnlyPendingTimers()
  expect(receive).toHaveBeenLastCalledWith({ event: { value: 1 } }, true)
  for (let i = 0; i < 4; i++) emit(i, [], false, [])
  vi.runOnlyPendingTimers()
  expect(receive).toHaveBeenCalledTimes(2)
  expect(receive).toHaveBeenLastCalledWith({ event: { value: 1 } }, false)
  for (let i = 0; i < 4; i++)
    emit(i, [], false, [{ type: 'modified', doc: doc('event', 2) }])
  vi.runOnlyPendingTimers()
  expect(receive).toHaveBeenCalledTimes(3)
  expect(receive).toHaveBeenLastCalledWith({ event: { value: 2 } }, false)
  emit(3, [], false, [{ type: 'modified', doc: doc('event', 2) }])
  vi.runOnlyPendingTimers()
  expect(receive).toHaveBeenCalledTimes(3)
  for (let i = 0; i < 4; i++)
    emit(i, [], false, [{ type: 'removed', doc: doc('event', 2) }])
  vi.runOnlyPendingTimers()
  expect(receive).toHaveBeenLastCalledWith({}, false)
  emit(0, [], true, [])
  vi.runOnlyPendingTimers()
  expect(receive).toHaveBeenLastCalledWith({}, true)
  stop()
})

it('cancels a pending delivery when the consumer leaves', () => {
  vi.useFakeTimers()
  const receive = vi.fn()
  const stop = subscribeHistoryWindow(
    'parent',
    'starEvents',
    { start: 0, end: 1000 },
    receive,
    vi.fn()
  )
  for (let i = 0; i < 4; i++) emit(i, [])
  stop()
  vi.runOnlyPendingTimers()
  expect(receive).not.toHaveBeenCalled()
})
