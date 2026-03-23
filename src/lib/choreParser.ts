import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
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
  const isLegacyDayNight =
    data.taskType === 'daynight' || data.category === 'daynight'
  if (isLegacyDayNight) return null

  const taskType: TaskType =
    data.taskType === 'positional-notation' ||
    data.category === 'positional-notation'
      ? 'positional-notation'
      : data.taskType === 'math' || data.category === 'math'
        ? 'math'
        : data.taskType === 'alphabet' || data.category === 'alphabet'
          ? 'alphabet'
          : data.taskType === 'eating' || data.category === 'eating'
            ? 'eating'
            : 'standard'

  const base = {
    id,
    title: data.title ?? '',
    childId: data.childId ?? '',
    category: data.category ?? '',
    ...normalizeChoreSchedule(data),
    starValue: Number(data.starValue ?? 1),
    isRepeating: data.isRepeating ?? false,
    createdAt: getCreatedAt(data),
  }

  switch (taskType) {
    case 'eating':
      return {
        ...base,
        taskType: 'eating',
        dinnerDurationSeconds:
          data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
        dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
      }
    case 'math':
      return {
        ...base,
        taskType: 'math',
        mathTotalProblems: data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
        mathDifficulty: data.mathDifficulty ?? 'easy',
      }
    case 'alphabet':
      return {
        ...base,
        taskType: 'alphabet',
        alphabetTotalProblems:
          data.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
      }
    case 'positional-notation':
      return {
        ...base,
        taskType: 'positional-notation',
        pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
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
  const isLegacyDayNight = data.sourceTaskType === 'daynight'
  if (isLegacyDayNight) return null

  const sourceTaskType: TaskType =
    data.sourceTaskType === 'positional-notation' ||
    data.sourceTaskType === 'math' ||
    data.sourceTaskType === 'alphabet' ||
    data.sourceTaskType === 'eating'
      ? data.sourceTaskType
      : 'standard'

  const base = {
    id,
    title: data.title ?? '',
    childId: data.childId ?? '',
    sourceTaskId: data.sourceTaskId ?? '',
    starValue: Number(data.starValue ?? 1),
    ...normalizeChoreSchedule(data),
    autoAdded: data.autoAdded === true,
    completedAt: data.completedAt ?? null,
    dateKey: data.dateKey ?? fallbackDateKey,
    createdAt: getCreatedAt(data),
  }

  switch (sourceTaskType) {
    case 'eating':
      return {
        ...base,
        sourceTaskType: 'eating',
        dinnerDurationSeconds:
          data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
        dinnerRemainingSeconds:
          data.dinnerRemainingSeconds ??
          data.dinnerDurationSeconds ??
          DEFAULT_DINNER_DURATION_SECONDS,
        dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
        dinnerBitesLeft:
          data.dinnerBitesLeft ?? data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
        dinnerTimerStartedAt: data.dinnerTimerStartedAt ?? null,
      }
    case 'math':
      return {
        ...base,
        sourceTaskType: 'math',
        mathTotalProblems: data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
        mathDifficulty: data.mathDifficulty ?? 'easy',
        mathLastOutcome:
          data.mathLastOutcome === 'success' ||
          data.mathLastOutcome === 'failure'
            ? data.mathLastOutcome
            : null,
      }
    case 'alphabet':
      return {
        ...base,
        sourceTaskType: 'alphabet',
        alphabetTotalProblems:
          data.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
        alphabetLastOutcome:
          data.alphabetLastOutcome === 'success' ||
          data.alphabetLastOutcome === 'failure'
            ? data.alphabetLastOutcome
            : null,
      }
    case 'positional-notation':
      return {
        ...base,
        sourceTaskType: 'positional-notation',
        pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
        pvLastOutcome:
          data.pvLastOutcome === 'success' || data.pvLastOutcome === 'failure'
            ? data.pvLastOutcome
            : null,
      }
    default:
      return {
        ...base,
        sourceTaskType: 'standard',
      }
  }
}
