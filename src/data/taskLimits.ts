export const MIN_TASK_VALUE = 1
export const MAX_TASK_VALUE = 9
export const MIN_DINNER_SLICES = 1
export const MAX_DINNER_SLICES = 20

export const clampDinnerSliceCount = (value: number) =>
  Math.min(MAX_DINNER_SLICES, Math.max(MIN_DINNER_SLICES, Math.round(value)))

const TASK_BOUNDS: readonly [number, number] = [MIN_TASK_VALUE, MAX_TASK_VALUE]
const LIMITED_TASK_FIELDS = new Map<string, readonly [number, number]>([
  ['starValue', TASK_BOUNDS],
  ['mathTotalProblems', TASK_BOUNDS],
  ['largeNumbersTotalProblems', TASK_BOUNDS],
  ['fractionsTotalProblems', TASK_BOUNDS],
  ['pvTotalProblems', TASK_BOUNDS],
  ['alphabetTotalProblems', TASK_BOUNDS],
  ['spellingTotalProblems', TASK_BOUNDS],
  ['animalsTotalProblems', TASK_BOUNDS],
  ['fractionsMaxDenominator', [2, 9]],
  ['dinnerTotalBites', [MIN_DINNER_SLICES, MAX_DINNER_SLICES]],
])

export const validateTaskFields = (fields: Record<string, unknown>) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    const bounds = LIMITED_TASK_FIELDS.get(fieldName)
    if (value === undefined || !bounds) continue
    const [min, max] = bounds
    if (
      typeof value !== 'number' ||
      !Number.isInteger(value) ||
      value < min ||
      value > max
    )
      throw new RangeError(
        `${fieldName} must be an integer from ${min} to ${max}.`
      )
  }
}
