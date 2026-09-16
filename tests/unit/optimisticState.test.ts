import { expect, it } from 'vitest'
import { settleOptimisticPatch } from '../../src/lib/optimisticState'

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
      { completed: undefined, outcome: null }
    )
  ).toEqual({ task: { completed: undefined, outcome: 'failure', count: 0 } })
})
