export const MIN_TASK_VALUE = 1
export const MAX_TASK_VALUE = 9
export const MIN_DINNER_SLICES = 1
export const MAX_DINNER_SLICES = 20

export const isTaskValue = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_TASK_VALUE &&
  value <= MAX_TASK_VALUE

export const assertTaskValue = (value: unknown, fieldName: string): number => {
  if (!isTaskValue(value)) {
    throw new RangeError(`${fieldName} must be an integer from 1 to 9.`)
  }
  return value
}

export const clampTaskValue = (value: number) =>
  Math.min(MAX_TASK_VALUE, Math.max(MIN_TASK_VALUE, Math.round(value)))

export const isDinnerSliceCount = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= MIN_DINNER_SLICES &&
  value <= MAX_DINNER_SLICES

export const assertDinnerSliceCount = (
  value: unknown,
  fieldName: string
): number => {
  if (!isDinnerSliceCount(value)) {
    throw new RangeError(`${fieldName} must be an integer from 1 to 20.`)
  }
  return value
}

export const clampDinnerSliceCount = (value: number) =>
  Math.min(MAX_DINNER_SLICES, Math.max(MIN_DINNER_SLICES, Math.round(value)))

const LIMITED_TASK_FIELDS = new Set([
  'starValue',
  'mathTotalProblems',
  'largeNumbersTotalProblems',
  'pvTotalProblems',
  'alphabetTotalProblems',
  'spellingTotalProblems',
  'animalsTotalProblems',
])

export const validateTaskFields = (fields: Record<string, unknown>) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (fieldName === 'dinnerTotalBites' && value !== undefined) {
      assertDinnerSliceCount(value, fieldName)
      continue
    }
    if (LIMITED_TASK_FIELDS.has(fieldName) && value !== undefined) {
      assertTaskValue(value, fieldName)
    }
  }
}
