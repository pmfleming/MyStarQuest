export type Fraction = { numerator: number; denominator: 2 | 4 }
export type FractionProblem = Fraction & {
  mode: 'copy' | 'build' | 'recognise'
}
export type FractionDifficulty = 'guided' | 'recognise'

// The first session deliberately repeats amounts, moving from pictures to symbols.
const INTRODUCTION: readonly FractionProblem[] = [
  { numerator: 1, denominator: 2, mode: 'copy' },
  { numerator: 1, denominator: 2, mode: 'build' },
  { numerator: 1, denominator: 4, mode: 'copy' },
  { numerator: 1, denominator: 4, mode: 'build' },
  { numerator: 3, denominator: 4, mode: 'build' },
]

export const FRACTION_CHOICES = [
  { numerator: 1, denominator: 4 },
  { numerator: 1, denominator: 2 },
  { numerator: 3, denominator: 4 },
] as const satisfies readonly Fraction[]

export function getFractionProblem(
  index: number,
  difficulty: FractionDifficulty
): FractionProblem {
  const introduction = INTRODUCTION[index]
  if (difficulty === 'guided' && introduction) {
    return introduction
  }
  const recognitionIndex =
    difficulty === 'guided' ? index - INTRODUCTION.length : index
  // Start with half, then a quarter, then three quarters.
  const choice =
    FRACTION_CHOICES[
      recognitionIndex % 3 === 0 ? 1 : recognitionIndex % 3 === 1 ? 0 : 2
    ]
  return { ...choice, mode: 'recognise' }
}

export const fractionLabel = ({ numerator, denominator }: Fraction) =>
  `${numerator} out of ${denominator} equal parts`
