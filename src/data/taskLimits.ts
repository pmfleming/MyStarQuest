export const MIN_TASK_VALUE = 1
export const MAX_TASK_VALUE = 9
export const MIN_DINNER_SLICES = 1
export const MAX_DINNER_SLICES = 20

const isBoundedInteger = (value: unknown, min: number, max: number) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max

const assertBoundedInteger = (
  value: unknown,
  fieldName: string,
  min: number,
  max: number
) => {
  if (!isBoundedInteger(value, min, max)) {
    throw new RangeError(
      `${fieldName} must be an integer from ${min} to ${max}.`
    )
  }
  return value as number
}

const clampInteger = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)))

export const isTaskValue = (value: unknown): value is number =>
  isBoundedInteger(value, MIN_TASK_VALUE, MAX_TASK_VALUE)

export const assertTaskValue = (value: unknown, fieldName: string) =>
  assertBoundedInteger(value, fieldName, MIN_TASK_VALUE, MAX_TASK_VALUE)

export const clampTaskValue = (value: number) =>
  clampInteger(value, MIN_TASK_VALUE, MAX_TASK_VALUE)

export const isDinnerSliceCount = (value: unknown): value is number =>
  isBoundedInteger(value, MIN_DINNER_SLICES, MAX_DINNER_SLICES)

export const assertDinnerSliceCount = (value: unknown, fieldName: string) =>
  assertBoundedInteger(value, fieldName, MIN_DINNER_SLICES, MAX_DINNER_SLICES)

export const clampDinnerSliceCount = (value: number) =>
  clampInteger(value, MIN_DINNER_SLICES, MAX_DINNER_SLICES)

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
