export const DEFAULT_FRACTION_MAX = 4
export const normalizeFractionMax = (value: number = DEFAULT_FRACTION_MAX) =>
  Number.isFinite(value)
    ? Math.max(2, Math.min(9, Math.round(value)))
    : DEFAULT_FRACTION_MAX

export type Fraction = { numerator: number; denominator: number }
export type FractionProblem = Fraction & {
  mode: 'copy' | 'build' | 'recognise'
}
export type FractionDifficulty = 'guided' | 'recognise' | 'advanced'

// The first session deliberately repeats amounts, moving from pictures to symbols.
const introduction = (maximum: number): readonly FractionProblem[] => [
  { numerator: 1, denominator: 2, mode: 'copy' },
  { numerator: 1, denominator: 2, mode: 'build' },
  { numerator: 1, denominator: maximum, mode: 'copy' },
  { numerator: 1, denominator: maximum, mode: 'build' },
  { numerator: 1, denominator: maximum, mode: 'build' },
]

export const FRACTION_CHOICES = [
  { numerator: 1, denominator: 4 },
  { numerator: 1, denominator: 2 },
  { numerator: 3, denominator: 4 },
] as const satisfies readonly Fraction[]

export function getFractionProblem(
  index: number,
  difficulty: FractionDifficulty,
  maximum = DEFAULT_FRACTION_MAX
): FractionProblem {
  const limit = normalizeFractionMax(maximum)
  if (difficulty === 'advanced') {
    // Start with the configured limit so even short rounds include several pieces.
    // Halves remain the only proper fraction when the limit is two.
    const denominators = [
      limit,
      ...Array.from({ length: Math.max(0, limit - 3) }, (_, i) => i + 3),
    ]
    const denominator = denominators[index % denominators.length] ?? limit
    const numerator =
      denominator === 2
        ? 1
        : 2 + (Math.floor(index / denominators.length) % (denominator - 2))
    return { numerator, denominator, mode: 'recognise' }
  }
  const guided = introduction(limit)
  const firstProblem = guided[index]
  if (difficulty === 'guided' && firstProblem) {
    return firstProblem
  }
  const recognitionIndex =
    difficulty === 'guided' ? index - guided.length : index
  const denominators = [
    ...new Set([
      2,
      limit,
      ...Array.from({ length: limit - 2 }, (_, i) => i + 3),
    ]),
  ]
  const denominator = denominators[recognitionIndex % denominators.length] ?? 2
  return { numerator: 1, denominator, mode: 'recognise' }
}

export const getFractionChoices = (
  problem: Fraction,
  maximum = DEFAULT_FRACTION_MAX
): Fraction[] => {
  if (
    problem.numerator === 1 &&
    normalizeFractionMax(maximum) === 4 &&
    FRACTION_CHOICES.some(
      (choice) =>
        choice.numerator * problem.denominator ===
        problem.numerator * choice.denominator
    )
  )
    return [...FRACTION_CHOICES]
  const { numerator, denominator } = problem
  const numerators = [
    numerator,
    ...Array.from({ length: denominator + 1 }, (_, i) => i)
      .filter((value) => value !== numerator)
      .sort((a, b) => Math.abs(a - numerator) - Math.abs(b - numerator)),
  ].slice(0, 3)
  return numerators
    .sort((a, b) => a - b)
    .map((value) => ({ numerator: value, denominator }))
}

export const fractionLabel = ({ numerator, denominator }: Fraction) =>
  `${numerator} out of ${denominator} equal parts`
