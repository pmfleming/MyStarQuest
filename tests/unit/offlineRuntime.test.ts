import { expect, it, vi } from 'vitest'
import type { OfflineState } from '../../src/offline/model'

const listeners = vi.hoisted(
  () => new Map<string, (snapshot: unknown) => void>()
)
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  onSnapshot: (
    path: string,
    _options: unknown,
    receive: (snapshot: unknown) => void
  ) => {
    listeners.set(path, receive)
    return () => listeners.delete(path)
  },
}))
vi.mock('../../src/offline/firebaseTransport', () => ({
  sendToFirebase: vi.fn(),
  localDocument: (value: unknown) => value,
  snapshotDocument: (value: unknown) => value,
}))
vi.mock('../../src/offline/persistence', () => ({
  IndexedDbPersistence: class {
    values = new Map<string, OfflineState>()
    async read(id: string) {
      return structuredClone(this.values.get(id))
    }
    async write(id: string, state: OfflineState) {
      this.values.set(id, structuredClone(state))
    }
  },
}))
import { offlineRuntime } from '../../src/offline/runtime'

it('keeps durable phone data through partial SDK cache results and accepts authoritative server deletion', async () => {
  const runtime = offlineRuntime('cached-parent')
  await runtime.store.mergeCollection('children', { child: { totalStars: 8 } })
  const stop = runtime.connect()
  try {
    await vi.waitFor(() =>
      expect(listeners.has('users/cached-parent/children')).toBe(true)
    )
    const receive = listeners.get('users/cached-parent/children')!
    receive({
      metadata: { fromCache: true },
      empty: false,
      docs: [{ id: 'other', data: () => ({ totalStars: 1 }) }],
    })
    await runtime.store.mutate(() => {})
    expect(runtime.documents('children')).toEqual([
      { id: 'child', data: { totalStars: 8 } },
    ])
    receive({ metadata: { fromCache: false }, empty: true, docs: [] })
    await runtime.store.mutate(() => {})
    expect(runtime.documents('children')).toEqual([])
  } finally {
    stop()
  }
})
