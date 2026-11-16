import { expect, it, vi } from 'vitest'
import { sameValue, UNCHANGED } from '../../src/offline/changes'
import { OfflineStore } from '../../src/offline/store'
import { emptyState, type OfflineState } from '../../src/offline/model'

it('skips identical merges while refreshing changes committed by another tab', async () => {
  let saved = emptyState()
  const write = vi.fn(async (_id: string, state: OfflineState) => {
    saved = structuredClone(state)
  })
  const persistence = {
    read: async () => structuredClone(saved),
    write,
    update: async <T>(id: string, change: (state: OfflineState) => T) => {
      const state = structuredClone(saved),
        result = change(state)
      if (result !== UNCHANGED) await write(id, state)
      return { state, result }
    },
  }
  const first = new OfflineStore('parent', persistence),
    second = new OfflineStore('parent', persistence)
  await first.mergeHistory('starEvents', {
    event: { createdAt: new Date(100), delta: 1 },
  })
  const snapshot = first.getSnapshot(),
    notify = vi.fn()
  first.subscribe(notify)
  first.onCommit = vi.fn()
  write.mockClear()
  await first.mergeHistory('starEvents', {
    event: { createdAt: new Date(100), delta: 1 },
  })
  expect(write).not.toHaveBeenCalled()
  expect(notify).not.toHaveBeenCalled()
  expect(first.getSnapshot()).toBe(snapshot)
  await second.mergeCollection('children', { child: { totalStars: 9 } })
  write.mockClear()
  await first.mergeHistory('starEvents', {
    event: { createdAt: new Date(100), delta: 1 },
  })
  expect(write).not.toHaveBeenCalled()
  expect(first.getSnapshot()?.documents.children.child.totalStars).toBe(9)
  expect(first.getSnapshot()?.history).toBe(snapshot?.history)
  expect(notify).toHaveBeenCalledTimes(1)
  expect(first.onCommit).not.toHaveBeenCalled()
})

it('distinguishes dates, records, arrays and missing fields', () => {
  expect(sameValue(new Date(1), {})).toBe(false)
  expect(sameValue([], {})).toBe(false)
  expect(sameValue({ a: undefined }, {})).toBe(false)
  expect(sameValue({ a: [new Date(1)] }, { a: [new Date(1)] })).toBe(true)
})
