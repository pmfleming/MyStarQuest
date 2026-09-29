import { expect, it } from 'vitest'
import {
  getFractionChoices,
  getFractionProblem,
} from '../../../src/lib/fractionProblems'

// Boundary limits exercise the shared generator; the UI suite also uses quarters.
it.each([2, 9])(
  'keeps problems and choices within a maximum of %i pieces',
  (maximum) => {
    const seen = new Set<number>()
    for (const difficulty of ['guided', 'recognise', 'advanced'] as const) {
      for (let index = 0; index < 80; index++) {
        const problem = getFractionProblem(index, difficulty, maximum)
        seen.add(problem.denominator)
        expect(problem.denominator).toBeGreaterThanOrEqual(2)
        expect(problem.denominator).toBeLessThanOrEqual(maximum)
        expect(problem.numerator).toBeGreaterThan(0)
        expect(problem.numerator).toBeLessThan(problem.denominator)
        const choices = getFractionChoices(problem, maximum)
        expect(choices).toHaveLength(3)
        expect(choices.every((choice) => choice.denominator <= maximum)).toBe(
          true
        )
        expect(
          choices.filter(
            (choice) =>
              choice.numerator * problem.denominator ===
              problem.numerator * choice.denominator
          )
        ).toHaveLength(1)
      }
    }
    expect([...seen].sort((a, b) => a - b)).toEqual(
      Array.from({ length: maximum - 1 }, (_, i) => i + 2)
    )
  }
)

it('reserves questions with several selected pieces for level three', () => {
  for (let maximum = 2; maximum <= 9; maximum++) {
    for (let index = 0; index < 80; index++) {
      for (const level of ['guided', 'recognise'] as const) {
        expect(getFractionProblem(index, level, maximum).numerator).toBe(1)
      }
      const advanced = getFractionProblem(index, 'advanced', maximum)
      expect(advanced.numerator).toBeGreaterThan(maximum === 2 ? 0 : 1)
      expect(advanced.numerator).toBeLessThan(advanced.denominator)
      expect(advanced.denominator).toBeLessThanOrEqual(maximum)
    }
  }
})
