import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ANIMALS_PROBLEMS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_SPELLING_PROBLEMS,
  firestoreTimestampLikeSchema,
  isChoreRecord,
  isTestRecord,
  taskSnapshotDataSchema,
  taskTypeSchema,
  type ChoreRecord,
  type TaskRecord,
  type TaskType,
  type TestRecord,
} from '../data/types'
import { normalizeChoreSchedule } from './today'

type SnapshotData = Record<string, unknown>
type VariantField = {
  key: string
  fallbackKeys?: string[]
  defaultValue?: unknown
}

const getCreatedAt = (data: SnapshotData) => {
  const createdAt = firestoreTimestampLikeSchema.parse(data.createdAt)
  return createdAt?.toDate?.()
}

const parseTaskTypeCandidate = (
  candidate: string
): TaskType | null | undefined => {
  if (candidate === 'daynight') return null
  const parsed = taskTypeSchema.safeParse(candidate)
  return parsed.success ? parsed.data : undefined
}

const resolveTaskType = (...candidates: string[]): TaskType | null => {
  for (const candidate of candidates) {
    const taskType = parseTaskTypeCandidate(candidate)
    if (taskType !== undefined) return taskType
  }
  return 'standard'
}

const readVariantField = (
  data: SnapshotData,
  { key, fallbackKeys = [], defaultValue }: VariantField
) => {
  for (const sourceKey of [key, ...fallbackKeys]) {
    const value = data[sourceKey]
    if (value !== undefined) return value
  }
  return defaultValue
}

const withVariantFields = <T extends Record<string, unknown>>(
  base: T,
  typeKey: 'taskType' | 'sourceTaskType',
  taskType: TaskType,
  data: SnapshotData,
  fields: readonly VariantField[]
) => ({
  ...base,
  [typeKey]: taskType,
  ...Object.fromEntries(
    fields.map((field) => [field.key, readVariantField(data, field)])
  ),
})

const withLegacyAliases = (
  data: SnapshotData,
  aliases: Record<string, string>
): SnapshotData => {
  if (!data || typeof data !== 'object') return data
  return {
    ...data,
    ...Object.fromEntries(
      Object.entries(aliases).map(([key, legacyKey]) => [
        key,
        data[key] ?? data[legacyKey],
      ])
    ),
  }
}

const normalizeChoreSnapshotData = (data: SnapshotData) =>
  withLegacyAliases(data, { taskType: 'choreType', category: 'choreType' })

const normalizeTestSnapshotData = (data: SnapshotData) =>
  withLegacyAliases(data, { taskType: 'testType', category: 'testType' })

const taskVariantFields = {
  standard: [],
  eating: [
    {
      key: 'dinnerDurationSeconds',
      defaultValue: DEFAULT_DINNER_DURATION_SECONDS,
    },
    { key: 'dinnerTotalBites', defaultValue: DEFAULT_DINNER_BITES },
  ],
  math: [
    { key: 'mathTotalProblems', defaultValue: DEFAULT_MATH_PROBLEMS },
    { key: 'mathDifficulty' },
  ],
  'large-numbers': [
    {
      key: 'largeNumbersTotalProblems',
      defaultValue: DEFAULT_LARGE_NUMBERS_PROBLEMS,
    },
  ],
  alphabet: [
    { key: 'alphabetTotalProblems', defaultValue: DEFAULT_ALPHABET_PROBLEMS },
  ],
  spelling: [
    { key: 'spellingTotalProblems', defaultValue: DEFAULT_SPELLING_PROBLEMS },
  ],
  animals: [
    { key: 'animalsTotalProblems', defaultValue: DEFAULT_ANIMALS_PROBLEMS },
  ],
  'positional-notation': [
    { key: 'pvTotalProblems', defaultValue: DEFAULT_PV_PROBLEMS },
  ],
  watertoiletcheck: [],
} satisfies Record<TaskType, readonly VariantField[]>

// Copy only persisted activity fields; null and zero are meaningful reset values.
const MANAGED_FIELDS = [
  'manageCompletedAt',
  'manageDinnerRemainingSeconds',
  'manageDinnerBitesLeft',
  'manageDinnerTimerStartedAt',
  'manageDinnerCompletedAt',
  'manageWaterLevel',
  'manageToiletStatus',
  'manageWaterToiletCompletedAt',
] as const

function parseTaskSnapshot(id: string, data: SnapshotData): TaskRecord | null {
  const parsed = taskSnapshotDataSchema.safeParse(data)
  if (!parsed.success) {
    console.warn('Skipping invalid template snapshot', {
      id,
      issues: parsed.error.issues,
    })
    return null
  }

  const taskData = parsed.data
  const taskType = resolveTaskType(taskData.taskType, taskData.category)
  if (!taskType) return null

  const base = {
    id,
    title:
      taskType === 'standard' && taskData.title.trim().length === 0
        ? 'New Chore'
        : taskData.title,
    childId: taskData.childId,
    category: taskData.category,
    ...normalizeChoreSchedule(taskData),
    starValue: taskData.starValue,
    isRepeating: taskData.isRepeating,
    ...(taskData.imageKey !== undefined ? { imageKey: taskData.imageKey } : {}),
    createdAt: getCreatedAt(taskData),
    ...(taskData.lastAttemptedAt !== null
      ? { lastAttemptedAt: taskData.lastAttemptedAt }
      : {}),
    ...(taskData.lastAttemptDateKey
      ? { lastAttemptDateKey: taskData.lastAttemptDateKey }
      : {}),
    ...(taskData.lastAttemptOutcome
      ? { lastAttemptOutcome: taskData.lastAttemptOutcome }
      : {}),
    ...Object.fromEntries(
      MANAGED_FIELDS.filter((key) => taskData[key] !== undefined).map((key) => [
        key,
        taskData[key],
      ])
    ),
  }

  return withVariantFields(
    base,
    'taskType',
    taskType,
    taskData,
    taskVariantFields[taskType]
  ) as TaskRecord
}

export function parseChoreSnapshot(
  id: string,
  data: SnapshotData
): ChoreRecord | null {
  const task = parseTaskSnapshot(id, normalizeChoreSnapshotData(data))
  if (!task || !isChoreRecord(task)) return null
  return task
}

export function parseTestSnapshot(
  id: string,
  data: SnapshotData
): TestRecord | null {
  const task = parseTaskSnapshot(id, normalizeTestSnapshotData(data))
  if (!task || !isTestRecord(task)) return null
  // Apply the renamed default to saved games while preserving custom titles.
  if (task.taskType === 'animals' && task.title === 'Animals') {
    return { ...task, title: 'Who am I?' }
  }
  return task
}
