import type { MathDifficulty } from '../data/types'

export type SharingProblem = { total: number; containers: number }

export const sharingProblemKey = ({ total, containers }: SharingProblem) =>
  `${total}/${containers}`

// Pick from a finite pool so every question divides exactly and a session
// never repeats a question until all available questions have been used.
export function generateSharingProblem(
  difficulty: MathDifficulty,
  seen: ReadonlySet<string> = new Set()
): SharingProblem {
  const maxContainers = difficulty === 'easy' ? 3 : 4
  const maxTotal = difficulty === 'easy' ? 12 : 24
  const problems: SharingProblem[] = []
  for (let containers = 2; containers <= maxContainers; containers++) {
    for (let each = 1; each <= Math.floor(maxTotal / containers); each++) {
      problems.push({ total: each * containers, containers })
    }
  }
  const unseen = problems.filter(
    (problem) => !seen.has(sharingProblemKey(problem))
  )
  const pool = unseen.length ? unseen : problems
  return pool[Math.floor(Math.random() * pool.length)]!
}

export const isSharingAnswerCorrect = (
  problem: SharingProblem,
  counts: readonly number[]
) =>
  problem.total > 0 &&
  counts.length === problem.containers &&
  counts.every(
    (count) =>
      Number.isInteger(count) && count === problem.total / problem.containers
  )
