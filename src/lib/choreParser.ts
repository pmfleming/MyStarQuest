import {
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
type TaskData = ReturnType<typeof taskSnapshotDataSchema.parse>

const resolveTaskType = (...candidates: string[]): TaskType | null => {
  for (const candidate of candidates) {
    if (candidate === 'daynight') return null
    const parsed = taskTypeSchema.safeParse(candidate)
    if (parsed.success) return parsed.data
  }
  return 'standard'
}

// Validation already supplies each variant's defaults; keep the discriminator
// and its fields together instead of reconstructing them through string keys.
function taskVariant(taskType: TaskType, data: TaskData) {
  const variants = {
    eating: {
      taskType: 'eating',
      dinnerDurationSeconds: data.dinnerDurationSeconds,
      dinnerTotalBites: data.dinnerTotalBites,
    },
    math: {
      taskType: 'math',
      mathTotalProblems: data.mathTotalProblems,
      mathDifficulty: data.mathDifficulty,
    },
    'large-numbers': {
      taskType: 'large-numbers',
      largeNumbersTotalProblems: data.largeNumbersTotalProblems,
    },
    alphabet: {
      taskType: 'alphabet',
      alphabetTotalProblems: data.alphabetTotalProblems,
    },
    fractions: {
      taskType: 'fractions',
      fractionsTotalProblems: data.fractionsTotalProblems,
      fractionsMaxDenominator: data.fractionsMaxDenominator,
    },
    spelling: {
      taskType: 'spelling',
      spellingTotalProblems: data.spellingTotalProblems,
    },
    animals: {
      taskType: 'animals',
      animalsTotalProblems: data.animalsTotalProblems,
    },
    'positional-notation': {
      taskType: 'positional-notation',
      pvTotalProblems: data.pvTotalProblems,
    },
    standard: { taskType: 'standard' },
    watertoiletcheck: { taskType: 'watertoiletcheck' },
  } satisfies { [Type in TaskType]: { taskType: Type } & Partial<TaskData> }
  return variants[taskType]
}

// Null and zero are meaningful reset values. Missing fields remain absent.
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

function parseTaskSnapshot(
  id: string,
  data: SnapshotData,
  legacyKey: string
): TaskRecord | null {
  const normalized = data && {
    ...data,
    taskType: data.taskType ?? data[legacyKey],
    category: data.category ?? data[legacyKey],
  }
  const parsed = taskSnapshotDataSchema.safeParse(normalized)
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
  return {
    id,
    title:
      taskType === 'standard' && !taskData.title.trim()
        ? 'New Chore'
        : taskData.title,
    childId: taskData.childId,
    category: taskData.category,
    ...normalizeChoreSchedule(taskData),
    starValue: taskData.starValue,
    isRepeating: taskData.isRepeating,
    ...(taskData.imageKey !== undefined ? { imageKey: taskData.imageKey } : {}),
    createdAt: taskData.createdAt?.toDate?.(),
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
    ...taskVariant(taskType, taskData),
  }
}

export function parseChoreSnapshot(
  id: string,
  data: SnapshotData
): ChoreRecord | null {
  const task = parseTaskSnapshot(id, data, 'choreType')
  return task && isChoreRecord(task) ? task : null
}

export function parseTestSnapshot(
  id: string,
  data: SnapshotData
): TestRecord | null {
  const task = parseTaskSnapshot(id, data, 'testType')
  if (!task || !isTestRecord(task)) return null
  // Preserve custom titles when renaming the saved Animals game.
  return task.taskType === 'animals' && task.title === 'Animals'
    ? { ...task, title: 'Who am I?' }
    : task
}
