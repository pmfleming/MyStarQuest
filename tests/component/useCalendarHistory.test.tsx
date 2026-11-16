import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({
  childId: 'one',
  listeners: new Map<
    string,
    { receive: (value: unknown) => void; error: (error: unknown) => void }
  >(),
}))
vi.mock('../../src/sharing/ChildAccessContext', () => ({
  useDataScope: () => ({
    storageKey: 'owner',
    childId: state.childId,
    timeZone: 'Europe/London',
  }),
}))
vi.mock('../../src/firebaseDb', () => ({ db: {} }))
vi.mock('../../src/offline/platform', () => ({ isOfflineEnabled: () => false }))
// This online-subscription test must not initialize the unused native transport.
vi.mock('../../src/offline/runtime', () => ({ offlineRuntime: vi.fn() }))
vi.mock('../../src/offline/firebaseTransport', () => ({
  localDocument: (data: unknown) => data,
}))
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  query: (source: string, ...constraints: string[]) =>
    [source, ...constraints].join('/'),
  where: (field: string, op: string, value: unknown) =>
    field === 'childId'
      ? value
      : `${field}${op}${typeof value}:${String(value)}`,
  orderBy: vi.fn(),
  onSnapshot: (
    source: string,
    optionsOrReceive: unknown,
    receiveOrError: (value: unknown) => void,
    error?: (error: unknown) => void
  ) => {
    const receive =
      typeof optionsOrReceive === 'function'
        ? (optionsOrReceive as (value: unknown) => void)
        : receiveOrError
    state.listeners.set(source, { receive, error: error ?? receiveOrError })
    return () => {
      state.listeners.delete(source)
    }
  },
}))
import { useCalendarHistory } from '../../src/hooks/useCalendarHistory'
function publish(
  collection: string,
  childId: string,
  data: Record<string, unknown>[]
) {
  for (const [key, listener] of state.listeners) {
    if (!key.startsWith(`users/owner/${collection}/${childId}/`)) continue
    listener.receive({
      metadata: { fromCache: false },
      docs: data.map((item, index) => ({
        id: String(index),
        data: () => item,
      })),
    })
  }
}
beforeEach(() => {
  state.childId = 'one'
  state.listeners.clear()
})
it('filters subscriptions by child and clears the previous child immediately when switching', async () => {
  const { result, rerender } = renderHook(useCalendarHistory)
  expect(result.current.loading).toBe(true)
  act(() => {
    publish('starEvents', 'one', [
      {
        childId: 'one',
        taskCollection: 'chores',
        taskTitle: 'First child',
        dateKey: '2026-10-22',
        delta: 1,
      },
    ])
    publish('redemptions', 'one', [])
  })
  await waitFor(() =>
    expect(result.current.entries[0]?.title).toBe('First child')
  )
  state.childId = 'two'
  rerender()
  expect(result.current.entries).toEqual([])
  expect(result.current.loading).toBe(true)
  expect(
    [...state.listeners.keys()].some((key) =>
      key.startsWith('users/owner/starEvents/one/')
    )
  ).toBe(false)
  act(() => {
    publish('starEvents', 'two', [])
    publish('redemptions', 'two', [
      {
        childId: 'two',
        rewardTitle: 'Second child gift',
        createdAt: new Date('2026-10-22T12:00:00Z'),
        costStars: 3,
      },
    ])
  })
  await waitFor(() =>
    expect(result.current.entries.map((item) => item.title)).toEqual([
      'Second child gift',
    ])
  )
  expect(result.current.loading).toBe(false)
})
it('surfaces subscription failures instead of reporting an empty history as success', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(useCalendarHistory)
  act(() => {
    ;[...state.listeners.entries()]
      .find(([key]) => key.startsWith('users/owner/starEvents/one/'))![1]
      .error(new Error('Denied'))
    publish('redemptions', 'one', [])
  })
  expect(result.current.error).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  log.mockRestore()
})
it('reuses queries within a month and loads a new period without keeping stale entries', async () => {
  const { result, rerender, unmount } = renderHook(
    ({ date }) => useCalendarHistory(date, 'month'),
    { initialProps: { date: '2024-01-15' } }
  )
  act(() => {
    publish('starEvents', 'one', [
      { dateKey: '2024-01-15', taskTitle: 'January' },
    ])
    publish('redemptions', 'one', [])
  })
  await waitFor(() => expect(result.current.loading).toBe(false))
  const initial = new Map(state.listeners)
  rerender({ date: '2024-01-20' })
  expect(state.listeners).toEqual(initial)
  rerender({ date: '2024-02-15' })
  expect(result.current.loading).toBe(true)
  expect(result.current.entries).toEqual([])
  const previousHistory = [...initial.keys()].filter(
    (key) => key.includes('/starEvents/') || key.includes('/redemptions/')
  )
  expect(previousHistory.every((key) => !state.listeners.has(key))).toBe(true)
  act(() => {
    publish('starEvents', 'one', [
      { dateKey: '2024-02-15', taskTitle: 'February' },
    ])
    publish('redemptions', 'one', [])
  })
  await waitFor(() => expect(result.current.entries[0]?.title).toBe('February'))
  unmount()
  expect(state.listeners.size).toBe(0)
})
