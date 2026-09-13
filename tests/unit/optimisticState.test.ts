import { expect, it } from 'vitest'
import { settleOptimisticPatch } from '../../src/lib/optimisticState'

it('settles matching fields without losing newer edits or another task', () => {
  const previous = { task: { bites: 2, seconds: 40 }, other: { bites: 3 } }
  expect(
    settleOptimisticPatch(previous, 'task', { bites: 1, seconds: 40 })
  ).toEqual({ task: { bites: 2 }, other: { bites: 3 } })
  expect(previous.task).toEqual({ bites: 2, seconds: 40 })
})

it('restores prior values only for fields belonging to the failed write', () => {
  const previous = { task: { completed: null, outcome: 'failure', count: 0 } }
  expect(
    settleOptimisticPatch<
      Partial<{
        completed: number | null
        outcome: string | null
        count: number
      }>
    >(
      previous,
      'task',
      { completed: null, outcome: 'success' },
      { completed: 123, outcome: null }
    )
  ).toEqual({ task: { completed: 123, outcome: 'failure', count: 0 } })
})

it('removes an empty override and leaves an absent task alone', () => {
  const previous = { task: { count: 0 } }
  expect(settleOptimisticPatch(previous, 'task', { count: 0 })).toEqual({})
  expect(settleOptimisticPatch(previous, 'missing', { count: 0 })).toBe(
    previous
  )
})

it('preserves explicit undefined when restoring a previous patch', () => {
  expect(
    settleOptimisticPatch(
      { task: { count: 1 } },
      'task',
      { count: 1 },
      { count: undefined }
    )
  ).toEqual({ task: { count: undefined } })
})
