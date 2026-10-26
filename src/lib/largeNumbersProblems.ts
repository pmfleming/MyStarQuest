import type { MathDifficulty } from '../data/types'
import { generateProgressivePositionalNotationProblem } from './positionalNotationProblems'

const MIN_ADDEND = 11
const MAX_SUM = 99
const MAX_FIRST_ADDEND = MAX_SUM - MIN_ADDEND

export type LargeNumbersDifficulty =
  MathDifficulty | 'three-crowns' | 'four-crowns'
export type OperationMode = 'addition' | 'subtraction' | 'both'
export type LargeNumbersProblem = {
  a: number
  b: number
  operation: '+' | '-'
}

function generateAddends(
  difficulty: LargeNumbersDifficulty,
  index: number,
  totalProblems: number
) {
  if (difficulty === 'three-crowns' || difficulty === 'four-crowns') {
    const { target } = generateProgressivePositionalNotationProblem(
      index,
      totalProblems,
      difficulty
    )
    const sum = Math.max(2, target)
    const a = Math.floor(Math.random() * (sum - 1)) + 1
    return { a, b: sum - a }
  }
  if (difficulty === 'easy') {
    const choice = Math.floor(Math.random() * 18)
    const b = choice < 9 ? choice + 1 : (choice - 8) * 10
    const a = Math.floor(Math.random() * (MAX_SUM - b)) + 1
    return { a, b }
  }
  const a =
    Math.floor(Math.random() * (MAX_FIRST_ADDEND - MIN_ADDEND + 1)) + MIN_ADDEND
  const maxB = MAX_SUM - a
  const b = Math.floor(Math.random() * (maxB - MIN_ADDEND + 1)) + MIN_ADDEND
  return Math.random() > 0.5 ? { a, b } : { a: b, b: a }
}

export function generateLargeNumbersProblem(
  mode: OperationMode,
  difficulty: LargeNumbersDifficulty,
  index = 0,
  totalProblems = 1
): LargeNumbersProblem {
  const { a, b } = generateAddends(difficulty, index, totalProblems)
  const subtract =
    mode === 'subtraction' || (mode === 'both' && Math.random() < 0.5)
  return subtract ? { a: a + b, b, operation: '-' } : { a, b, operation: '+' }
}
