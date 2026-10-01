export const DEFAULT_FRACTION_MAX = 4
export const normalizeFractionMax = (value: number = DEFAULT_FRACTION_MAX) =>
  Number.isFinite(value)
    ? Math.max(2, Math.min(9, Math.round(value)))
    : DEFAULT_FRACTION_MAX

export type Fraction = { numerator: number; denominator: number }
export type FractionProblem = Fraction & {
  mode: 'recognise' | 'simplify'
}
export type FractionDifficulty = 'advanced' | 'simplify'

export function simplifyFraction({
  numerator,
  denominator,
}: Fraction): Fraction {
  let divisor = numerator
  let remainder = denominator
  while (remainder !== 0) {
    ;[divisor, remainder] = [remainder, divisor % remainder]
  }
  return { numerator: numerator / divisor, denominator: denominator / divisor }
}

export function getFractionProblem(
  index: number,
  difficulty: FractionDifficulty,
  maximum = DEFAULT_FRACTION_MAX
): FractionProblem {
  const limit = normalizeFractionMax(maximum)
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
  return {
    numerator,
    denominator,
    mode: difficulty === 'simplify' ? 'simplify' : 'recognise',
  }
}

export const getFractionChoices = (problem: FractionProblem): Fraction[] => {
  const { numerator, denominator } = problem
  const numerators = [
    numerator,
    ...Array.from({ length: denominator + 1 }, (_, i) => i)
      .filter((value) => value !== numerator)
      .sort((a, b) => Math.abs(a - numerator) - Math.abs(b - numerator)),
  ].slice(0, 3)
  return numerators
    .sort((a, b) => a - b)
    .map((value) => {
      const fraction = { numerator: value, denominator }
      return problem.mode === 'simplify' ? simplifyFraction(fraction) : fraction
    })
}

export const fractionLabel = ({ numerator, denominator }: Fraction) =>
  `${numerator} out of ${denominator} equal parts`
