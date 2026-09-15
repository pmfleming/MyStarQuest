import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useTestCheckTriggers } from '../../src/hooks/useTestCheckTriggers'

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
