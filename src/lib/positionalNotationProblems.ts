const MAX_ONE_CROWN_TARGET = 120
export const MAX_ONE_CROWN_TENS = Math.floor(MAX_ONE_CROWN_TARGET / 10)
export const MAX_TWO_CROWN_DIGIT = 9

export type PositionalNotationDifficulty = 'one-crown' | 'two-crowns'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function generateProgressivePositionalNotationProblem(
  index: number,
  totalProblems: number,
  difficulty: PositionalNotationDifficulty = 'one-crown'
): { target: number } {
  if (difficulty === 'two-crowns') {
    if (totalProblems <= 1) {
      return { target: Math.floor(Math.random() * 900) + 100 }
    }

    const progress = clamp(index / Math.max(1, totalProblems - 1), 0, 1)
    const easedProgress = Math.pow(progress, 1.15)
    const bandStart = Math.round(100 + easedProgress * 800)
    const bandEnd = Math.round(199 + easedProgress * 800)

    return {
      target: Math.floor(Math.random() * (bandEnd - bandStart + 1)) + bandStart,
    }
  }

  if (totalProblems <= 1) {
    return { target: Math.floor(Math.random() * 20) + 1 }
  }

  const progress = clamp(index / Math.max(1, totalProblems - 1), 0, 1)
  const easedProgress = Math.pow(progress, 1.15)
  const bandStart = clamp(
    Math.round(1 + easedProgress * 110),
    1,
    MAX_ONE_CROWN_TARGET
  )
  const bandEnd = clamp(
    Math.round(20 + easedProgress * 100),
    Math.min(MAX_ONE_CROWN_TARGET, bandStart + 9),
    MAX_ONE_CROWN_TARGET
  )

  return {
    target: Math.floor(Math.random() * (bandEnd - bandStart + 1)) + bandStart,
  }
}
