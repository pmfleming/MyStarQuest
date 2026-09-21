import { expect, it } from 'vitest'
import { emptyState, activityKey, enqueue } from '../../src/offline/model'
import { importWebProgress } from '../../src/offline/importWebProgress'
import { getTodayDescriptor } from '../../src/lib/today'

it('ignores invalid timestamps and imports failed or unknown test types without inventing completion fields', () => {
  const state = emptyState()
  const today = getTodayDescriptor().dateKey
  importWebProgress(state, 'chores', {
    invalid: { manageCompletedAt: Number.NaN },
    overflow: { manageDinnerTimerStartedAt: 1e30 },
    pending: { manageCompletedAt: null, manageDinnerBitesLeft: 2 },
  })
  expect(
    state.activities[activityKey('chores', 'invalid', today)]
  ).toBeUndefined()
  expect(
    state.activities[activityKey('chores', 'overflow', today)]
  ).toBeUndefined()
  expect(
    state.activities[activityKey('chores', 'pending', today)]
  ).toMatchObject({ complete: false })
  importWebProgress(state, 'tests', {
    failed: {
      taskType: 'math',
      lastAttemptDateKey: today,
      lastAttemptOutcome: 'failure',
    },
    unknown: {
      taskType: 'future',
      lastAttemptDateKey: today,
      lastAttemptOutcome: 'success',
    },
    old: {
      taskType: 'math',
      lastAttemptDateKey: '2000-01-01',
      lastAttemptOutcome: 'success',
    },
  })
  expect(state.activities[activityKey('tests', 'failed', today)]).toMatchObject(
    { complete: false, patch: { manageMathCompletedAt: null } }
  )
  expect(state.activities[activityKey('tests', 'unknown', today)]).toEqual({
    complete: true,
    patch: {
      lastAttemptDateKey: today,
      lastAttemptedAt: undefined,
      lastAttemptOutcome: 'success',
    },
  })
  expect(state.activities[activityKey('tests', 'old', today)]).toBeUndefined()
})

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
