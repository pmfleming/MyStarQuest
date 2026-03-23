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

const getString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback

const getNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const getBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback

const getNullableNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const getMathDifficulty = (value: unknown): 'easy' | 'hard' =>
  value === 'hard' ? 'hard' : 'easy'

const getOutcome = (value: unknown): 'success' | 'failure' | null =>
  value === 'success' || value === 'failure' ? value : null

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
    title: getString(data.title),
    childId: getString(data.childId),
    category: getString(data.category),
    ...normalizeChoreSchedule(data),
    starValue: getNumber(data.starValue, 1),
    isRepeating: getBoolean(data.isRepeating),
    createdAt: getCreatedAt(data),
  }

  switch (taskType) {
    case 'eating':
      return {
        ...base,
        taskType: 'eating',
        dinnerDurationSeconds: getNumber(
          data.dinnerDurationSeconds,
          DEFAULT_DINNER_DURATION_SECONDS
        ),
        dinnerTotalBites: getNumber(
          data.dinnerTotalBites,
          DEFAULT_DINNER_BITES
        ),
      }
    case 'math':
      return {
        ...base,
        taskType: 'math',
        mathTotalProblems: getNumber(
          data.mathTotalProblems,
          DEFAULT_MATH_PROBLEMS
        ),
        mathDifficulty: getMathDifficulty(data.mathDifficulty),
      }
    case 'alphabet':
      return {
        ...base,
        taskType: 'alphabet',
        alphabetTotalProblems: getNumber(
          data.alphabetTotalProblems,
          DEFAULT_ALPHABET_PROBLEMS
        ),
      }
    case 'positional-notation':
      return {
        ...base,
        taskType: 'positional-notation',
        pvTotalProblems: getNumber(data.pvTotalProblems, DEFAULT_PV_PROBLEMS),
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
    title: getString(data.title),
    childId: getString(data.childId),
    sourceTaskId: getString(data.sourceTaskId),
    starValue: getNumber(data.starValue, 1),
    ...normalizeChoreSchedule(data),
    autoAdded: data.autoAdded === true,
    completedAt: getNullableNumber(data.completedAt),
    dateKey: getString(data.dateKey, fallbackDateKey),
    createdAt: getCreatedAt(data),
  }

  switch (sourceTaskType) {
    case 'eating':
      return {
        ...base,
        sourceTaskType: 'eating',
        dinnerDurationSeconds: getNumber(
          data.dinnerDurationSeconds,
          DEFAULT_DINNER_DURATION_SECONDS
        ),
        dinnerRemainingSeconds: getNumber(
          data.dinnerRemainingSeconds,
          getNumber(data.dinnerDurationSeconds, DEFAULT_DINNER_DURATION_SECONDS)
        ),
        dinnerTotalBites: getNumber(
          data.dinnerTotalBites,
          DEFAULT_DINNER_BITES
        ),
        dinnerBitesLeft: getNumber(
          data.dinnerBitesLeft,
          getNumber(data.dinnerTotalBites, DEFAULT_DINNER_BITES)
        ),
        dinnerTimerStartedAt: getNullableNumber(data.dinnerTimerStartedAt),
      }
    case 'math':
      return {
        ...base,
        sourceTaskType: 'math',
        mathTotalProblems: getNumber(
          data.mathTotalProblems,
          DEFAULT_MATH_PROBLEMS
        ),
        mathDifficulty: getMathDifficulty(data.mathDifficulty),
        mathLastOutcome: getOutcome(data.mathLastOutcome),
      }
    case 'alphabet':
      return {
        ...base,
        sourceTaskType: 'alphabet',
        alphabetTotalProblems: getNumber(
          data.alphabetTotalProblems,
          DEFAULT_ALPHABET_PROBLEMS
        ),
        alphabetLastOutcome: getOutcome(data.alphabetLastOutcome),
      }
    case 'positional-notation':
      return {
        ...base,
        sourceTaskType: 'positional-notation',
        pvTotalProblems: getNumber(data.pvTotalProblems, DEFAULT_PV_PROBLEMS),
        pvLastOutcome: getOutcome(data.pvLastOutcome),
      }
    default:
      return {
        ...base,
        sourceTaskType: 'standard',
      }
  }
}
