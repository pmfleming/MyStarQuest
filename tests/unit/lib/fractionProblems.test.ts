import { expect, it } from 'vitest'
import {
  getFractionChoices,
  getFractionProblem,
  simplifyFraction,
} from '../../../src/lib/fractionProblems'

it.each([2, 9])(
  'offers exactly one correct answer and two distinct incorrect answers with a maximum of %i pieces',
  (maximum) => {
    for (const difficulty of ['advanced', 'simplify'] as const) {
      for (let index = 0; index < 80; index++) {
        const problem = getFractionProblem(index, difficulty, maximum)
        expect(problem.denominator).toBeGreaterThanOrEqual(2)
        expect(problem.denominator).toBeLessThanOrEqual(maximum)
        expect(problem.numerator).toBeGreaterThan(maximum === 2 ? 0 : 1)
        expect(problem.numerator).toBeLessThan(problem.denominator)
        const choices = getFractionChoices(problem)
        expect(choices).toHaveLength(3)
        expect(
          new Set(
            choices.map(({ numerator, denominator }) => numerator / denominator)
          ).size
        ).toBe(3)
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
        if (difficulty === 'simplify') {
          for (const choice of choices)
            expect(choice).toEqual(simplifyFraction(choice))
        } else {
          expect(choices).toContainEqual({
            numerator: problem.numerator,
            denominator: problem.denominator,
          })
        }
      }
    }
  }
)
