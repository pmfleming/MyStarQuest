import { expect, it, vi } from 'vitest'
import type { OfflineState } from '../../src/offline/model'

const listeners = vi.hoisted(
  () => new Map<string, (snapshot: unknown) => void>()
)
const subscribe = vi.hoisted(() => vi.fn())
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  onSnapshot: (
    path: string,
    _options: unknown,
    receive: (snapshot: unknown) => void
  ) => {
    subscribe(path)
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

it('applies document deltas and ignores metadata-only notifications after initial sync', async () => {
  const runtime = offlineRuntime('query-deltas'),
    stop = runtime.connect()
  try {
    await vi.waitFor(() =>
      expect(listeners.has('users/query-deltas/children')).toBe(true)
    )
    const receive = listeners.get('users/query-deltas/children')!
    receive({
      metadata: { fromCache: false },
      docs: [{ id: 'child', data: () => ({ totalStars: 1 }) }],
    })
    await runtime.store.mutate(() => {})
    receive({
      metadata: { fromCache: false },
      docChanges: () => [
        {
          type: 'modified',
          doc: { id: 'child', data: () => ({ totalStars: 2 }) },
        },
      ],
      get docs() {
        throw new Error('Full snapshot should not be rescanned')
      },
    })
    await runtime.store.mutate(() => {})
    expect(runtime.documents('children')[0]?.data.totalStars).toBe(2)
    const snapshot = runtime.store.getSnapshot()
    receive({ metadata: { fromCache: false }, docChanges: () => [] })
    await Promise.resolve()
    expect(runtime.store.getSnapshot()).toBe(snapshot)
  } finally {
    stop()
  }
})

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

it('releases each subscriber once and reconnects after the last owner leaves', async () => {
  const runtime = offlineRuntime('connection-owners')
  const path = 'users/connection-owners/children'
  const first = runtime.connect()
  const second = runtime.connect()
  try {
    await vi.waitFor(() => expect(listeners.has(path)).toBe(true))
    first()
    first()
    expect(listeners.has(path)).toBe(true)
    second()
    expect(listeners.has(path)).toBe(false)
    const third = runtime.connect()
    try {
      await vi.waitFor(() => expect(listeners.has(path)).toBe(true))
      second()
      expect(listeners.has(path)).toBe(true)
    } finally {
      third()
    }
    expect(listeners.has(path)).toBe(false)
  } finally {
    first()
    second()
  }
})

it('cleans partial subscriptions after setup fails and permits a later connection', async () => {
  const runtime = offlineRuntime('failed-setup')
  const prefix = 'users/failed-setup/'
  subscribe.mockImplementation((path: string) => {
    if (path === `${prefix}children`) throw new Error('Subscription failed')
  })
  const stop = runtime.connect()
  try {
    await vi.waitFor(() =>
      expect(runtime.getError()).toBe('Subscription failed')
    )
    expect(
      [...listeners.keys()].filter((path) => path.startsWith(prefix))
    ).toEqual([])
    expect(runtime.store.onCommit).toBeUndefined()
  } finally {
    stop()
    subscribe.mockReset()
  }
  const reconnect = runtime.connect()
  try {
    await vi.waitFor(() =>
      expect(listeners.has(`${prefix}children`)).toBe(true)
    )
  } finally {
    reconnect()
  }
})
