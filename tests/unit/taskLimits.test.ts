import { describe, expect, it } from 'vitest'
import {
  assertDinnerSliceCount,
  assertTaskValue,
  clampDinnerSliceCount,
  clampTaskValue,
  isDinnerSliceCount,
  isTaskValue,
  validateTaskFields,
} from '../../src/data/taskLimits'
import { dinnerSliceCountSchema, taskValueSchema } from '../../src/data/types'

describe('task value limits', () => {
  it('accepts only integer values from 1 through 9', () => {
    expect([1, 9].every(isTaskValue)).toBe(true)
    expect(
      [0, 10, 1.5, Number.NaN, Number.POSITIVE_INFINITY].some(isTaskValue)
    ).toBe(false)
  })

  it('rejects invalid task fields at command boundaries', () => {
    expect(() => validateTaskFields({ starValue: 1 })).not.toThrow()
    expect(() => validateTaskFields({ animalsTotalProblems: 9 })).not.toThrow()
    expect(() => validateTaskFields({ starValue: 0 })).toThrow(RangeError)
    expect(() => validateTaskFields({ dinnerTotalBites: 20 })).not.toThrow()
    expect(() => validateTaskFields({ dinnerTotalBites: 21 })).toThrow(
      'dinnerTotalBites must be an integer from 1 to 20.'
    )
    expect(() => assertTaskValue(2.5, 'starValue')).toThrow(RangeError)
  })

  it('accepts dinner slice counts from 1 through 20', () => {
    expect([1, 20].every(isDinnerSliceCount)).toBe(true)
    expect([0, 21, 1.5, Number.NaN].some(isDinnerSliceCount)).toBe(false)
    expect(() => assertDinnerSliceCount(21, 'dinnerTotalBites')).toThrow(
      RangeError
    )
    expect(clampDinnerSliceCount(0)).toBe(1)
    expect(clampDinnerSliceCount(25)).toBe(20)
  })

  it('uses the documented legacy migration normalization', () => {
    expect(clampTaskValue(0)).toBe(1)
    expect(clampTaskValue(4.6)).toBe(5)
    expect(clampTaskValue(12)).toBe(9)
  })

  it('exposes a strict persistence schema', () => {
    expect(taskValueSchema.safeParse(1).success).toBe(true)
    expect(taskValueSchema.safeParse(9).success).toBe(true)
    expect(taskValueSchema.safeParse(0).success).toBe(false)
    expect(taskValueSchema.safeParse(10).success).toBe(false)
    expect(taskValueSchema.safeParse(1.5).success).toBe(false)
    expect(dinnerSliceCountSchema.safeParse(1).success).toBe(true)
    expect(dinnerSliceCountSchema.safeParse(20).success).toBe(true)
    expect(dinnerSliceCountSchema.safeParse(0).success).toBe(false)
    expect(dinnerSliceCountSchema.safeParse(21).success).toBe(false)
  })
})
