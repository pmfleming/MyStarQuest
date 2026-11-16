import { expect, it, vi } from 'vitest'
import type { OfflineState } from '../../src/offline/model'

const listeners = vi.hoisted(
  () => new Map<string, (snapshot: unknown) => void>()
)
const subscribe = vi.hoisted(() => vi.fn())
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  query: (source: string, ...constraints: string[]) =>
    [source, ...constraints].join('|'),
  where: (field: string, _op: string, value: string) => `${field}:${value}`,
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

it('loads only relevant legacy reward reconciliation and releases its listeners', async () => {
  const runtime = offlineRuntime('reward-ledger')
  const stop = runtime.connect()
  await vi.waitFor(() =>
    expect(listeners.has('users/reward-ledger/rewards')).toBe(true)
  )
  expect(
    [...listeners.keys()].some((key) =>
      /^users\/reward-ledger\/(starEvents|redemptions)$/.test(key)
    )
  ).toBe(false)
  listeners.get('users/reward-ledger/rewards')!({
    metadata: { fromCache: false },
    docs: [
      { id: 'toy', data: () => ({ isRepeating: false }) },
      { id: 'repeat', data: () => ({ isRepeating: true }) },
    ],
  })
  const path = 'users/reward-ledger/redemptions|rewardId:toy'
  await vi.waitFor(() => expect(listeners.has(path)).toBe(true))
  expect(listeners.has('users/reward-ledger/redemptions|rewardId:repeat')).toBe(
    false
  )
  listeners.get(path)!({
    metadata: { fromCache: false },
    docs: [{ id: 'old', data: () => ({ rewardId: 'toy', createdAt: 1 }) }],
  })
  await runtime.store.mutate(() => {})
  expect(runtime.documents('rewards').map((doc) => doc.id)).toEqual(['repeat'])
  expect(runtime.store.getSnapshot()?.history).toBeUndefined()
  stop()
  expect(listeners.has(path)).toBe(false)
})

it('batches large reward catalogues without restarting partially redeemed batches', async () => {
  const runtime = offlineRuntime('reward-batches')
  const stop = runtime.connect()
  const prefix = 'users/reward-batches/'
  const rewardPaths = () =>
    [...listeners.keys()].filter((path) =>
      path.startsWith(`${prefix}redemptions|`)
    )
  try {
    await vi.waitFor(() => expect(listeners.has(`${prefix}rewards`)).toBe(true))
    const definitions = Array.from({ length: 61 }, (_, i) => ({
      id: `reward-${i}`,
      data: () => ({ isRepeating: false }),
    }))
    listeners.get(`${prefix}rewards`)!({
      metadata: { fromCache: false },
      docs: definitions,
    })
    await vi.waitFor(() => expect(rewardPaths()).toHaveLength(3))
    const paths = rewardPaths()
    expect(
      paths.map((path) => path.split('rewardId:')[1].split(',').length)
    ).toEqual([30, 30, 1])
    const calls = subscribe.mock.calls.length
    listeners.get(paths[0])!({
      metadata: { fromCache: false },
      docs: [{ id: 'event', data: () => ({ rewardId: 'reward-0' }) }],
    })
    await runtime.store.mutate(() => {})
    expect(rewardPaths()).toEqual(paths)
    expect(subscribe.mock.calls).toHaveLength(calls)
    listeners.get(paths[0])!({
      metadata: { fromCache: false },
      docs: definitions
        .slice(0, 30)
        .map(({ id }) => ({ id, data: () => ({ rewardId: id }) })),
    })
    await runtime.store.mutate(() => {})
    await vi.waitFor(() => expect(rewardPaths()).toEqual(paths.slice(1)))
  } finally {
    stop()
  }
  expect(
    [...listeners.keys()].filter((path) => path.startsWith(prefix))
  ).toEqual([])
})
