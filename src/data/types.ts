// ── Shared data types and constants for the chore/task system ──

import type { ThemeId } from '../constants/themeOptions'

export type TaskType = 'standard' | 'eating' | 'math' | 'positional-notation'

/**
 * A chore template stored in `/users/{uid}/tasks`.
 * Includes configuration fields (title, schedule, star value, etc.)
 * and manage-page short-lived status fields (manage* prefix).
 */
export type TaskRecord = {
  id: string
  title: string
  childId: string
  category: string
  taskType: TaskType
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  isRepeating: boolean
  // Manage-page short-lived status (auto-resets after 15 min)
  manageCompletedAt?: number | null
  dinnerDurationSeconds?: number
  dinnerTotalBites?: number
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerCompletedAt?: number | null
  mathTotalProblems?: number
  manageMathCompletedAt?: number | null
  manageMathLastOutcome?: 'success' | 'failure' | null
  pvTotalProblems?: number
  managePVCompletedAt?: number | null
  managePVLastOutcome?: 'success' | 'failure' | null
  createdAt?: Date
}

/**
 * Lightweight read-only view of a task used as a template by the Today page.
 * Does not include manage-page status fields.
 */
export type TaskTemplate = {
  id: string
  title: string
  childId: string
  starValue: number
  taskType: TaskType
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  dinnerDurationSeconds?: number
  dinnerTotalBites?: number
  mathTotalProblems?: number
  pvTotalProblems?: number
  createdAt?: Date
}

/**
 * A daily todo entry stored in `/users/{uid}/todos`.
 * Created when a chore is scheduled (or manually added) for today.
 */
export type TodoRecord = {
  id: string
  title: string
  childId: string
  sourceTaskId: string
  sourceTaskType?: TaskType
  starValue: number
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  autoAdded: boolean
  completedAt: number | null
  dinnerDurationSeconds?: number
  dinnerRemainingSeconds?: number
  dinnerTotalBites?: number
  dinnerBitesLeft?: number
  mathTotalProblems?: number
  mathLastOutcome?: 'success' | 'failure' | null
  pvTotalProblems?: number
  pvLastOutcome?: 'success' | 'failure' | null
  createdAt?: Date
}

// ── Updatable field subsets ──

export type TaskUpdatableFields = Partial<
  Pick<
    TaskRecord,
    | 'title'
    | 'schoolDayEnabled'
    | 'nonSchoolDayEnabled'
    | 'starValue'
    | 'isRepeating'
    | 'manageCompletedAt'
    | 'dinnerDurationSeconds'
    | 'dinnerTotalBites'
    | 'manageDinnerRemainingSeconds'
    | 'manageDinnerBitesLeft'
    | 'manageDinnerCompletedAt'
    | 'mathTotalProblems'
    | 'manageMathCompletedAt'
    | 'manageMathLastOutcome'
    | 'pvTotalProblems'
    | 'managePVCompletedAt'
    | 'managePVLastOutcome'
  >
>

export type TodoUpdatableFields = Partial<
  Pick<
    TodoRecord,
    | 'completedAt'
    | 'dinnerRemainingSeconds'
    | 'dinnerBitesLeft'
    | 'mathLastOutcome'
    | 'pvLastOutcome'
  >
>

// ── Constants ──

export const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
export const DEFAULT_DINNER_BITES = 2
export const DEFAULT_DINNER_STARS = 3
export const DEFAULT_MATH_PROBLEMS = 5
export const DEFAULT_MATH_STARS = 3
export const DEFAULT_PV_PROBLEMS = 5
export const DEFAULT_PV_STARS = 3
export const MANAGE_STATUS_RESET_MS = 15 * 60 * 1000

// ── Type guards / helpers ──

export const isEatingTask = (t: { taskType: TaskType }) =>
  t.taskType === 'eating'
export const isMathTask = (t: { taskType: TaskType }) => t.taskType === 'math'
export const isPositionalNotationTask = (t: { taskType: TaskType }) =>
  t.taskType === 'positional-notation'

export const getManageDinnerRemaining = (task: TaskRecord) =>
  task.manageDinnerRemainingSeconds ??
  task.dinnerDurationSeconds ??
  DEFAULT_DINNER_DURATION_SECONDS

export const getManageDinnerBitesLeft = (task: TaskRecord) =>
  task.manageDinnerBitesLeft ?? task.dinnerTotalBites ?? DEFAULT_DINNER_BITES

export const getManageTaskCompletedAt = (task: TaskRecord) => {
  if (isEatingTask(task)) return task.manageDinnerCompletedAt ?? null
  if (isMathTask(task)) return task.manageMathCompletedAt ?? null
  if (isPositionalNotationTask(task)) return task.managePVCompletedAt ?? null
  return task.manageCompletedAt ?? null
}

export const isManageTaskCompleted = (task: TaskRecord) =>
  Boolean(getManageTaskCompletedAt(task))

export const sortByCreatedAtThenTitle = <
  T extends { createdAt?: Date; title: string },
>(
  left: T,
  right: T
) => {
  const leftTime = left.createdAt?.getTime() ?? 0
  const rightTime = right.createdAt?.getTime() ?? 0
  if (leftTime !== rightTime) return leftTime - rightTime
  return left.title.localeCompare(right.title)
}

// ── Child profile ──

export type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
  themeId?: ThemeId
  createdAt?: Date
}

export type ChildUpdatableFields = Partial<
  Pick<ChildProfile, 'displayName' | 'avatarToken' | 'themeId' | 'totalStars'>
>

// ── Reward ──

export type RewardRecord = {
  id: string
  title: string
  costStars: number
  isRepeating: boolean
  createdAt?: Date
}

export type RewardUpdatableFields = Partial<
  Pick<RewardRecord, 'title' | 'costStars' | 'isRepeating'>
>
