import { afterEach, expect, it, vi } from 'vitest'
import { generateProgressivePositionalNotationProblem } from '../../../src/lib/positionalNotationProblems'

afterEach(() => vi.restoreAllMocks())

it.each([
  ['three-crowns', 9_999],
  ['four-crowns', 999_999],
] as const)(
  'generates the full %s range with bounded progressive rounds',
  (difficulty, max) => {
    const random = vi.spyOn(Math, 'random')
    random.mockReturnValue(0)
    expect(
      generateProgressivePositionalNotationProblem(0, 1, difficulty).target
    ).toBe(1)
    expect(
      generateProgressivePositionalNotationProblem(0, 9, difficulty).target
    ).toBe(1)
    random.mockReturnValue(0.999999999)
    expect(
      generateProgressivePositionalNotationProblem(0, 1, difficulty).target
    ).toBe(max)
    expect(
      generateProgressivePositionalNotationProblem(8, 9, difficulty).target
    ).toBe(max)

    for (const sample of [0, 0.5, 0.999999999]) {
      random.mockReturnValue(sample)
      let previous = 0
      for (let index = 0; index < 9; index++) {
        const { target } = generateProgressivePositionalNotationProblem(
          index,
          9,
          difficulty
        )
        expect(Number.isInteger(target)).toBe(true)
        expect(target).toBeGreaterThanOrEqual(1)
        expect(target).toBeLessThanOrEqual(max)
        expect(target).toBeGreaterThanOrEqual(previous)
        previous = target
      }
    }
  }
)
