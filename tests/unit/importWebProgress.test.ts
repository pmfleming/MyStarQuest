import { expect, it } from 'vitest'
import { emptyState, activityKey, enqueue } from '../../src/offline/model'
import { importWebProgress } from '../../src/offline/importWebProgress'
import { getTodayDescriptor } from '../../src/lib/today'

it('imports current website completions once, preserving later local resets and preventing duplicate awards', () => {
  const state = emptyState()
  const today = getTodayDescriptor().dateKey
  state.documents.children.child = { totalStars: 8 }
  const documents = { tidy: { manageCompletedAt: Date.now() } }
  importWebProgress(state, 'chores', documents)
  const action = {
    kind: 'activity' as const,
    collection: 'chores' as const,
    entityId: 'tidy',
    childId: 'child',
    dateKey: today,
    patch: { manageCompletedAt: Date.now() },
    complete: true,
    delta: 3,
    reset: false,
    consume: false,
  }
  expect(enqueue(state, action)).toBeNull()
  enqueue(state, {
    ...action,
    patch: { manageCompletedAt: null },
    complete: false,
    delta: 0,
    reset: true,
  })
  importWebProgress(state, 'chores', documents)
  expect(state.activities[activityKey('chores', 'tidy', today)].complete).toBe(
    false
  )
})
