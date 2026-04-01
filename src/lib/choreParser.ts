import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_TOILET_STATUS,
  DEFAULT_WATER_LEVEL,
  taskSnapshotDataSchema,
  todoSnapshotDataSchema,
  type TaskRecord,
  type TaskType,
  type TodoRecord,
} from '../data/types'
import { normalizeChoreSchedule } from './today'

type SnapshotData = Record<string, unknown>

const getCreatedAt = (data: SnapshotData) => {
  const createdAt = data.createdAt as { toDate?: () => Date } | undefined
  return createdAt?.toDate?.()
}

export function parseTaskSnapshot(
  id: string,
  data: SnapshotData
): TaskRecord | null {
  const parsed = taskSnapshotDataSchema.safeParse(data)
  if (!parsed.success) {
    console.warn('Skipping invalid task snapshot', {
      id,
      issues: parsed.error.issues,
    })
    return null
  }

  const taskData = parsed.data
  const isLegacyDayNight =
    taskData.taskType === 'daynight' || taskData.category === 'daynight'
  if (isLegacyDayNight) return null

  const taskType: TaskType =
    taskData.taskType === 'positional-notation' ||
    taskData.category === 'positional-notation'
      ? 'positional-notation'
      : taskData.taskType === 'math' || taskData.category === 'math'
        ? 'math'
        : taskData.taskType === 'alphabet' || taskData.category === 'alphabet'
          ? 'alphabet'
          : taskData.taskType === 'watertoiletcheck' ||
              taskData.category === 'watertoiletcheck'
            ? 'watertoiletcheck'
            : taskData.taskType === 'eating' || taskData.category === 'eating'
              ? 'eating'
              : 'standard'

  const base = {
    id,
    title: taskData.title,
    childId: taskData.childId,
    category: taskData.category,
    ...normalizeChoreSchedule(taskData),
    starValue: taskData.starValue,
    isRepeating: taskData.isRepeating,
    createdAt: getCreatedAt(taskData),
  }

  switch (taskType) {
    case 'eating':
      return {
        ...base,
        taskType: 'eating',
        dinnerDurationSeconds:
          taskData.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
        dinnerTotalBites: taskData.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
      }
    case 'math':
      return {
        ...base,
        taskType: 'math',
        mathTotalProblems: taskData.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
        mathDifficulty: taskData.mathDifficulty,
      }
    case 'alphabet':
      return {
        ...base,
        taskType: 'alphabet',
        alphabetTotalProblems:
          taskData.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
      }
    case 'positional-notation':
      return {
        ...base,
        taskType: 'positional-notation',
        pvTotalProblems: taskData.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
      }
    case 'watertoiletcheck':
      return {
        ...base,
        taskType: 'watertoiletcheck',
      }
    default:
      return { ...base, taskType: 'standard' }
  }
}

export function parseTodoSnapshot(
  id: string,
  data: SnapshotData,
  fallbackDateKey: string
): TodoRecord | null {
  const parsed = todoSnapshotDataSchema.safeParse(data)
  if (!parsed.success) {
    console.warn('Skipping invalid todo snapshot', {
      id,
      issues: parsed.error.issues,
    })
    return null
  }

  const todoData = parsed.data
  const isLegacyDayNight = todoData.sourceTaskType === 'daynight'
  if (isLegacyDayNight) return null

  const sourceTaskType: TaskType =
    todoData.sourceTaskType === 'positional-notation' ||
    todoData.sourceTaskType === 'math' ||
    todoData.sourceTaskType === 'alphabet' ||
    todoData.sourceTaskType === 'watertoiletcheck' ||
    todoData.sourceTaskType === 'eating'
      ? todoData.sourceTaskType
      : 'standard'

  const base = {
    id,
    title: todoData.title,
    childId: todoData.childId,
    sourceTaskId: todoData.sourceTaskId,
    starValue: todoData.starValue,
    ...normalizeChoreSchedule(todoData),
    autoAdded: todoData.autoAdded,
    completedAt: todoData.completedAt,
    dateKey: todoData.dateKey ?? fallbackDateKey,
    createdAt: getCreatedAt(todoData),
  }

  switch (sourceTaskType) {
    case 'eating':
      return {
        ...base,
        sourceTaskType: 'eating',
        dinnerDurationSeconds:
          todoData.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
        dinnerRemainingSeconds:
          todoData.dinnerRemainingSeconds ??
          todoData.dinnerDurationSeconds ??
          DEFAULT_DINNER_DURATION_SECONDS,
        dinnerTotalBites: todoData.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
        dinnerBitesLeft:
          todoData.dinnerBitesLeft ??
          todoData.dinnerTotalBites ??
          DEFAULT_DINNER_BITES,
        dinnerTimerStartedAt: todoData.dinnerTimerStartedAt,
      }
    case 'math':
      return {
        ...base,
        sourceTaskType: 'math',
        mathTotalProblems: todoData.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
        mathDifficulty: todoData.mathDifficulty,
        mathLastOutcome: todoData.mathLastOutcome,
      }
    case 'alphabet':
      return {
        ...base,
        sourceTaskType: 'alphabet',
        alphabetTotalProblems:
          todoData.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
        alphabetLastOutcome: todoData.alphabetLastOutcome,
      }
    case 'positional-notation':
      return {
        ...base,
        sourceTaskType: 'positional-notation',
        pvTotalProblems: todoData.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
        pvLastOutcome: todoData.pvLastOutcome,
      }
    case 'watertoiletcheck':
      return {
        ...base,
        sourceTaskType: 'watertoiletcheck',
        waterLevel: todoData.waterLevel ?? DEFAULT_WATER_LEVEL,
        toiletStatus: todoData.toiletStatus ?? DEFAULT_TOILET_STATUS,
      }
    default:
      return {
        ...base,
        sourceTaskType: 'standard',
      }
  }
}
