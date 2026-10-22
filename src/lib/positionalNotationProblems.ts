const MAX_ONE_CROWN_TARGET = 120
export const MAX_ONE_CROWN_TENS = Math.floor(MAX_ONE_CROWN_TARGET / 10)
export const MAX_TWO_CROWN_DIGIT = 9

export type PositionalNotationDifficulty =
  'one-crown' | 'two-crowns' | 'three-crowns' | 'four-crowns'

export const PLACE_VALUE_FACTORS = {
  hundredThousands: 100_000,
  tenThousands: 10_000,
  thousands: 1_000,
  hundreds: 100,
  tens: 10,
  ones: 1,
} as const

export type PlaceValueKind = keyof typeof PLACE_VALUE_FACTORS
export type PlaceValues = Record<PlaceValueKind, number>

export const POSITIONAL_NOTATION_PLACES: Record<
  PositionalNotationDifficulty,
  PlaceValueKind[]
> = {
  'one-crown': ['tens', 'ones'],
  'two-crowns': ['hundreds', 'tens', 'ones'],
  'three-crowns': ['thousands', 'hundreds', 'tens', 'ones'],
  'four-crowns': [
    'hundredThousands',
    'tenThousands',
    'thousands',
    'hundreds',
    'tens',
    'ones',
  ],
}

export const getPlaceValueTotal = (values: PlaceValues) =>
  POSITIONAL_NOTATION_PLACES['four-crowns'].reduce(
    (total, kind) => total + values[kind] * PLACE_VALUE_FACTORS[kind],
    0
  )

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export function generateProgressivePositionalNotationProblem(
  index: number,
  totalProblems: number,
  difficulty: PositionalNotationDifficulty = 'one-crown'
): { target: number } {
  if (difficulty === 'three-crowns' || difficulty === 'four-crowns') {
    const max = difficulty === 'three-crowns' ? 9_999 : 999_999
    if (totalProblems <= 1) {
      return { target: Math.floor(Math.random() * max) + 1 }
    }

    const progress = clamp(index / Math.max(1, totalProblems - 1), 0, 1)
    const bandWidth = Math.ceil(max / 10)
    const bandStart = Math.round(
      1 + Math.pow(progress, 1.15) * (max - bandWidth)
    )
    return { target: bandStart + Math.floor(Math.random() * bandWidth) }
  }

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
