import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { taskTypeSchema } from '../../src/data/types'
import { useTaskActivityState } from '../../src/hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../../src/hooks/useTestCheckTriggers'

it('switches every activity exclusively and keeps dinner cancellation scoped', () => {
  const { result } = renderHook(useTaskActivityState)
  for (const type of taskTypeSchema.options) {
    act(() => result.current.enterActivity(type, type))
    expect(result.current.activeIds).toEqual(
      type === 'standard' ? {} : { [type]: type }
    )
  }
  act(() => result.current.setActiveDinnerId(null))
  expect(result.current.activeIds.watertoiletcheck).toBe('watertoiletcheck')
  expect(result.current.activeIds.eating).toBeNull()
  act(() => result.current.clearActiveActivities())
  expect(result.current.activeIds).toEqual({})
})

it('keeps checks isolated by type and id, including checks in the same React batch', () => {
  const { result } = renderHook(useTestCheckTriggers)
  const clear = result.current.clearCheckTriggers
  act(() => {
    result.current.onCheck('math', 'same-id')
    result.current.onCheck('math', 'same-id')
    result.current.onCheck('math', 'other-id')
    result.current.onCheck('alphabet', 'same-id')
  })
  expect(result.current.checkTriggers).toEqual({
    math: { 'same-id': 2, 'other-id': 1 },
    alphabet: { 'same-id': 1 },
  })
  expect(result.current.clearCheckTriggers).toBe(clear)
  act(clear)
  expect(result.current.checkTriggers).toEqual({})
})
