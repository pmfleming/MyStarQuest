import { afterEach, expect, it, vi } from 'vitest'
import {
  generateLargeNumbersProblem,
  type LargeNumbersDifficulty,
} from '../../../src/lib/largeNumbersProblems'

afterEach(() => vi.restoreAllMocks())

it.each([
  ['easy', 99],
  ['hard', 99],
  ['three-crowns', 9_999],
  ['four-crowns', 999_999],
] as const)('keeps %s operands and answers in range', (difficulty, max) => {
  for (const random of [0, 0.001, 0.5, 0.999999]) {
    vi.spyOn(Math, 'random').mockReturnValue(random)
    for (const mode of ['addition', 'subtraction', 'both'] as const) {
      for (const total of [1, 5]) {
        for (let index = 0; index < total; index++) {
          const { a, b, operation } = generateLargeNumbersProblem(
            mode,
            difficulty,
            index,
            total
          )
          const answer = operation === '+' ? a + b : a - b
          for (const value of [a, b, answer]) {
            expect(Number.isInteger(value)).toBe(true)
            expect(value).toBeGreaterThanOrEqual(1)
            expect(value).toBeLessThanOrEqual(max)
          }
          if (mode !== 'both') {
            expect(operation).toBe(mode === 'addition' ? '+' : '-')
          }
          if (difficulty === 'easy') {
            expect(b < 10 || b % 10 === 0).toBe(true)
          }
        }
      }
    }
  }
})

it.each(['three-crowns', 'four-crowns'] as LargeNumbersDifficulty[])(
  'increases %s problem sizes through a session',
  (difficulty) => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const sums = Array.from({ length: 5 }, (_, index) => {
      const { a, b } = generateLargeNumbersProblem(
        'addition',
        difficulty,
        index,
        5
      )
      return a + b
    })
    for (let index = 1; index < sums.length; index++) {
      expect(sums[index]).toBeGreaterThan(sums[index - 1])
    }
  }
)

it('includes both operations in mixed mode', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.25)
  expect(generateLargeNumbersProblem('both', 'four-crowns').operation).toBe('-')
  vi.mocked(Math.random).mockReturnValue(0.75)
  expect(generateLargeNumbersProblem('both', 'four-crowns').operation).toBe('+')
})
