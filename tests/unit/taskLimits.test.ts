import { describe, expect, it } from 'vitest'
import { validateTaskFields } from '../../src/data/taskLimits'

describe('task value limits', () => {
  it('validates every bounded field without treating unrelated names as limits', () => {
    for (const field of [
      'starValue',
      'mathTotalProblems',
      'largeNumbersTotalProblems',
      'fractionsTotalProblems',
      'pvTotalProblems',
      'alphabetTotalProblems',
      'spellingTotalProblems',
      'animalsTotalProblems',
      'fractionsMaxDenominator',
      'dinnerTotalBites',
    ]) {
      const min = field === 'fractionsMaxDenominator' ? 2 : 1
      const max = field === 'dinnerTotalBites' ? 20 : 9
      for (const value of [min, max, undefined])
        expect(() => validateTaskFields({ [field]: value })).not.toThrow()
      for (const value of [min - 1, max + 1, 2.5, NaN, Infinity, null, '2'])
        expect(() => validateTaskFields({ [field]: value })).toThrow(RangeError)
    }
    expect(() =>
      validateTaskFields({ title: 'Example', constructor: 100, toString: 100 })
    ).not.toThrow()
  })
})
