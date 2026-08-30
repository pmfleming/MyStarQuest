export const MIN_TASK_VALUE = 1
export const MAX_TASK_VALUE = 9

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

const LIMITED_TASK_FIELDS = new Set([
  'starValue',
  'dinnerTotalBites',
  'mathTotalProblems',
  'largeNumbersTotalProblems',
  'pvTotalProblems',
  'alphabetTotalProblems',
  'spellingTotalProblems',
  'animalsTotalProblems',
])

export const validateTaskFields = (fields: Record<string, unknown>) => {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (LIMITED_TASK_FIELDS.has(fieldName) && value !== undefined) {
      assertTaskValue(value, fieldName)
    }
  }
}
