import type { SharingDifficulty } from '../data/types'

export type SharingProblem = { total: number; containers: number }

export const sharingProblemKey = ({ total, containers }: SharingProblem) =>
  `${total}/${containers}`

// Pick from a finite pool so every question divides exactly and a session
// never repeats a question until all available questions have been used.
export function generateSharingProblem(
  difficulty: SharingDifficulty,
  seen: ReadonlySet<string> = new Set()
): SharingProblem {
  const containerCounts =
    difficulty === 'easy' ? [2] : difficulty === 'hard' ? [3] : [2, 3, 4]
  const maxTotal = difficulty === 'easy' ? 12 : 24
  const problems: SharingProblem[] = []
  for (const containers of containerCounts) {
    for (let each = 1; each <= Math.floor(maxTotal / containers); each++) {
      problems.push({ total: each * containers, containers })
    }
  }
  const unseen = problems.filter(
    (problem) => !seen.has(sharingProblemKey(problem))
  )
  const previousKey = Array.from(seen).at(-1)
  const pool = unseen.length
    ? unseen
    : problems.filter((problem) => sharingProblemKey(problem) !== previousKey)
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
