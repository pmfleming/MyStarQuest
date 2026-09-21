import { expect, it } from 'vitest'
import {
  reconcileOptimisticPatches,
  settleOptimisticPatch,
} from '../../src/lib/optimisticState'

it('only reconciles complete acknowledgements, retaining missing and partially acknowledged items', () => {
  const previous = {
    done: { title: 'Done' },
    partial: { title: 'New', count: 2 },
    missing: { title: 'Offline' },
  }
  const items = [
    { id: 'done', title: 'Done' },
    { id: 'partial', title: 'New', count: 1 },
  ]
  const next = reconcileOptimisticPatches(previous, items)
  expect(next).toEqual({ partial: previous.partial, missing: previous.missing })
  expect(next.partial).toBe(previous.partial)
  expect(previous.done).toEqual({ title: 'Done' })
  expect(reconcileOptimisticPatches(next, items)).toBe(next)
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
      { completed: undefined, outcome: null }
    )
  ).toEqual({ task: { completed: undefined, outcome: 'failure', count: 0 } })
})
