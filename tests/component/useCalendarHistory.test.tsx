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
vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...parts: string[]) => parts.join('/'),
  query: (source: string, constraint: string) => `${source}/${constraint}`,
  where: (_field: string, _op: string, value: string) => value,
  orderBy: vi.fn(),
  onSnapshot: (
    source: string,
    receive: (value: unknown) => void,
    error: (error: unknown) => void
  ) => {
    state.listeners.set(source, { receive, error })
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
  state.listeners.get(`users/owner/${collection}/${childId}`)!.receive({
    docs: data.map((item, index) => ({
      id: String(index),
      data: () => item,
    })),
  })
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
  expect(state.listeners.has('users/owner/starEvents/one')).toBe(false)
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
  expect(result.current.entries.map((item) => item.title)).toEqual([
    'Second child gift',
  ])
  expect(result.current.loading).toBe(false)
})
it('surfaces subscription failures instead of reporting an empty history as success', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { result } = renderHook(useCalendarHistory)
  act(() => {
    state.listeners
      .get('users/owner/starEvents/one')!
      .error(new Error('Denied'))
    publish('redemptions', 'one', [])
  })
  expect(result.current.error).toBe(true)
  expect(result.current.loading).toBe(false)
  log.mockRestore()
})
