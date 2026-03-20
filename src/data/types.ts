// ── Shared data types and constants for the chore/task system ──

import type { ThemeId } from '../ui/themeOptions'

export type TaskType =
  | 'standard'
  | 'eating'
  | 'math'
  | 'positional-notation'
  | 'alphabet'

// ── TaskRecord: discriminated union on `taskType` ──

type TaskBase = {
  id: string
  title: string
  childId: string
  category: string
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  isRepeating: boolean
  createdAt?: Date
}

export type StandardTask = TaskBase & { taskType: 'standard' }
export type EatingTask = TaskBase & {
  taskType: 'eating'
  dinnerDurationSeconds: number
  dinnerTotalBites: number
}
export type MathDifficulty = 'easy' | 'hard'

export type MathTask = TaskBase & {
  taskType: 'math'
  mathTotalProblems: number
  mathDifficulty?: MathDifficulty
}
export type PositionalNotationTask = TaskBase & {
  taskType: 'positional-notation'
  pvTotalProblems: number
}
export type AlphabetTask = TaskBase & {
  taskType: 'alphabet'
  alphabetTotalProblems: number
}

export type TaskRecord =
  | StandardTask
  | EatingTask
  | MathTask
  | PositionalNotationTask
  | AlphabetTask

// ── TaskEphemeralState: flat bag for in-memory storage ──

export type TaskEphemeralState = {
  manageCompletedAt?: number | null
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerTimerStartedAt?: number | null
  manageDinnerCompletedAt?: number | null
  manageMathCompletedAt?: number | null
  manageMathLastOutcome?: 'success' | 'failure' | null
  managePVCompletedAt?: number | null
  managePVLastOutcome?: 'success' | 'failure' | null
  manageAlphabetCompletedAt?: number | null
  manageAlphabetLastOutcome?: 'success' | 'failure' | null
}

// ── TaskWithEphemeral: discriminated union pairing each variant with its ephemeral fields ──

export type StandardTaskWithEphemeral = StandardTask & {
  manageCompletedAt?: number | null
}
export type EatingTaskWithEphemeral = EatingTask & {
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerTimerStartedAt?: number | null
  manageDinnerCompletedAt?: number | null
}
export type MathTaskWithEphemeral = MathTask & {
  manageMathCompletedAt?: number | null
  manageMathLastOutcome?: 'success' | 'failure' | null
}
export type PVTaskWithEphemeral = PositionalNotationTask & {
  managePVCompletedAt?: number | null
  managePVLastOutcome?: 'success' | 'failure' | null
}
export type AlphabetTaskWithEphemeral = AlphabetTask & {
  manageAlphabetCompletedAt?: number | null
  manageAlphabetLastOutcome?: 'success' | 'failure' | null
}

export type TaskWithEphemeral =
  | StandardTaskWithEphemeral
  | EatingTaskWithEphemeral
  | MathTaskWithEphemeral
  | PVTaskWithEphemeral
  | AlphabetTaskWithEphemeral

// ── TodoRecord: discriminated union on `sourceTaskType` ──

type TodoBase = {
  id: string
  title: string
  childId: string
  sourceTaskId: string
  starValue: number
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  autoAdded: boolean
  completedAt: number | null
  dateKey: string
  createdAt?: Date
}

export type StandardTodo = TodoBase & { sourceTaskType: 'standard' }
export type EatingTodo = TodoBase & {
  sourceTaskType: 'eating'
  dinnerDurationSeconds: number
  dinnerRemainingSeconds: number
  dinnerTotalBites: number
  dinnerBitesLeft: number
  dinnerTimerStartedAt: number | null
}
export type MathTodo = TodoBase & {
  sourceTaskType: 'math'
  mathTotalProblems: number
  mathDifficulty?: MathDifficulty
  mathLastOutcome: 'success' | 'failure' | null
}
export type PositionalNotationTodo = TodoBase & {
  sourceTaskType: 'positional-notation'
  pvTotalProblems: number
  pvLastOutcome: 'success' | 'failure' | null
}
export type AlphabetTodo = TodoBase & {
  sourceTaskType: 'alphabet'
  alphabetTotalProblems: number
  alphabetLastOutcome: 'success' | 'failure' | null
}

export type TodoRecord =
  | StandardTodo
  | EatingTodo
  | MathTodo
  | PositionalNotationTodo
  | AlphabetTodo

// ── Updatable field subsets ──

export type TaskUpdatableFields = Partial<{
  title: string
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  isRepeating: boolean
  dinnerDurationSeconds: number
  dinnerTotalBites: number
  mathTotalProblems: number
  mathDifficulty: MathDifficulty
  pvTotalProblems: number
  alphabetTotalProblems: number
}>

export type TodoUpdatableFields = Partial<{
  completedAt: number | null
  dinnerRemainingSeconds: number
  dinnerBitesLeft: number
  dinnerTimerStartedAt: number | null
  mathLastOutcome: 'success' | 'failure' | null
  pvLastOutcome: 'success' | 'failure' | null
  alphabetLastOutcome: 'success' | 'failure' | null
}>

// ── Constants ──

export const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
export const DEFAULT_DINNER_BITES = 2
export const DEFAULT_DINNER_STARS = 3
export const DEFAULT_MATH_PROBLEMS = 5
export const DEFAULT_MATH_STARS = 3
export const DEFAULT_PV_PROBLEMS = 5
export const DEFAULT_PV_STARS = 3
export const DEFAULT_ALPHABET_PROBLEMS = 5
export const DEFAULT_ALPHABET_STARS = 3
export const MANAGE_STATUS_RESET_MS = 15 * 60 * 1000
export const BITE_COOLDOWN_SECONDS = 15

// ── Narrowing type guards ──

export function isEatingTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'eating' }> {
  return t.taskType === 'eating'
}

export function isMathTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'math' }> {
  return t.taskType === 'math'
}

export function isPositionalNotationTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'positional-notation' }> {
  return t.taskType === 'positional-notation'
}

export function isAlphabetTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'alphabet' }> {
  return t.taskType === 'alphabet'
}

export function isEatingTodo(t: TodoRecord): t is EatingTodo {
  return t.sourceTaskType === 'eating'
}

export function isMathTodo(t: TodoRecord): t is MathTodo {
  return t.sourceTaskType === 'math'
}

export function isPositionalNotationTodo(
  t: TodoRecord
): t is PositionalNotationTodo {
  return t.sourceTaskType === 'positional-notation'
}

export function isAlphabetTodo(t: TodoRecord): t is AlphabetTodo {
  return t.sourceTaskType === 'alphabet'
}

// ── TaskWithEphemeral helpers ──

export const getManageDinnerRemaining = (task: EatingTaskWithEphemeral) =>
  task.manageDinnerRemainingSeconds ?? task.dinnerDurationSeconds

export const getManageDinnerLiveRemaining = (task: EatingTaskWithEphemeral) => {
  const frozen = getManageDinnerRemaining(task)
  const startedAt = task.manageDinnerTimerStartedAt
  if (!startedAt) return frozen
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  return Math.max(0, frozen - elapsed)
}

export const getManageDinnerBitesLeft = (task: EatingTaskWithEphemeral) =>
  task.manageDinnerBitesLeft ?? task.dinnerTotalBites

export const getManageTaskCompletedAt = (task: TaskWithEphemeral) => {
  switch (task.taskType) {
    case 'eating':
      return task.manageDinnerCompletedAt ?? null
    case 'math':
      return task.manageMathCompletedAt ?? null
    case 'positional-notation':
      return task.managePVCompletedAt ?? null
    case 'alphabet':
      return task.manageAlphabetCompletedAt ?? null
    case 'standard':
      return task.manageCompletedAt ?? null
  }
}

export const isManageTaskCompleted = (task: TaskWithEphemeral) =>
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
