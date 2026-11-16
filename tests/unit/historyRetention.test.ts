import { afterEach, expect, it, vi } from 'vitest'
import {
  calendarHistoryWindow,
  pruneHistory,
} from '../../src/offline/historyRetention'
import {
  emptyState,
  historyDocuments,
  redeemedNonRepeatingRewardIds,
  type OfflineState,
} from '../../src/offline/model'
import { OfflineStore } from '../../src/offline/store'

afterEach(() => vi.useRealTimers())
it('prunes old event payloads while preserving pending work and reward reconciliation', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-16'))
  const state = emptyState()
  state.documents.children.child = { totalStars: 5 }
  state.documents.rewards.toy = { isRepeating: false }
  state.documents.rewards.repeat = { isRepeating: true }
  state.history = {
    starEvents: Object.fromEntries(
      Array.from({ length: 10000 }, (_, i) => [
        String(i),
        { createdAt: new Date('2024-01-01'), taskTitle: 'Old task' },
      ])
    ),
    redemptions: {
      old: { rewardId: 'toy', createdAt: 1 },
      repeat: { rewardId: 'repeat', createdAt: 1 },
    },
  }
  state.pending.push({
    id: 'pending',
    deviceId: state.deviceId,
    sequence: 1,
    occurredAt: 1,
    action: {
      kind: 'redeem',
      entityId: 'repeat',
      childId: 'child',
      title: 'Pending reward',
      cost: 1,
      consume: false,
    },
  })
  state.sequence = 1
  const pending = structuredClone(state.pending)
  const disk = {
    value: state,
    read: async () => structuredClone(disk.value),
    write: async (_id: string, value: OfflineState) => {
      disk.value = structuredClone(value)
    },
  }
  const store = new OfflineStore('parent', disk)
  await store.open()
  expect(store.getSnapshot()?.history).toEqual({
    starEvents: {},
    redemptions: {},
  })
  expect(store.getSnapshot()?.pending).toEqual(pending)
  expect(redeemedNonRepeatingRewardIds(store.getSnapshot()!)).toEqual(
    new Set(['toy'])
  )
  expect(
    historyDocuments(store.getSnapshot()!, 'redemptions').pending
  ).toMatchObject({ pending: true, rewardTitle: 'Pending reward' })
  const reopened = new OfflineStore('parent', disk)
  await reopened.open()
  expect(redeemedNonRepeatingRewardIds(reopened.getSnapshot()!)).toEqual(
    new Set(['toy'])
  )
  expect(pruneHistory(disk.value)).toBe(false)
})
it('retains recent history and the fetched period, replacing older period payloads', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-16'))
  let saved = emptyState()
  const store = new OfflineStore('parent', {
    read: async () => structuredClone(saved),
    write: async (_id, state) => {
      saved = structuredClone(state)
    },
  })
  const january = calendarHistoryWindow('2024-01-15', 'month')
  await store.mergeHistory(
    'starEvents',
    {
      january: { dateKey: '2024-01-15', createdAt: Date.now() },
      recent: { createdAt: Date.now() },
    },
    january
  )
  expect(Object.keys(saved.history!.starEvents)).toEqual(['january', 'recent'])
  const february = calendarHistoryWindow('2024-02-15', 'month')
  await store.mergeHistory(
    'starEvents',
    {
      february: { occurredAt: Date.parse('2024-02-15'), createdAt: Date.now() },
    },
    february
  )
  expect(Object.keys(saved.history!.starEvents)).toEqual(['recent', 'february'])
  expect(saved.historyWindows?.starEvents).toEqual(february)
  expect(saved.historyWindows?.redemptions).toBeUndefined()
})
it('can reconcile a fresh install without loading old redemption payloads', async () => {
  const store = new OfflineStore('parent', {
    read: async () => undefined,
    write: async () => {},
  })
  await store.mergeCollection('rewards', {
    toy: { isRepeating: false },
    repeat: { isRepeating: true },
    switched: { isRepeating: false },
  })
  await store.mergeRewardRedemptions({
    old: { rewardId: 'toy' },
    repeat: { rewardId: 'repeat' },
    switched: { rewardId: 'switched', consume: false },
  })
  expect(redeemedNonRepeatingRewardIds(store.getSnapshot()!)).toEqual(
    new Set(['toy'])
  )
  expect(store.getSnapshot()?.history).toBeUndefined()
  await store.revoke()
  expect(store.getSnapshot()?.redeemedRewards).toEqual({})
})
