// ── Shared data types and constants for the chore/task system ──

import type { ThemeId } from '../ui/themeOptions'
import { z } from 'zod'

export type TaskType =
  | 'standard'
  | 'eating'
  | 'math'
  | 'positional-notation'
  | 'alphabet'
  | 'watertoiletcheck'

export type WaterLevel = 'full' | 'twothirds' | 'onethird' | 'empty'

export type ToiletStatus = 'notpeepee' | 'didpeepee'
export type TaskOutcome = 'success' | 'failure'

export const taskTypeSchema = z.enum([
  'standard',
  'eating',
  'math',
  'positional-notation',
  'alphabet',
  'watertoiletcheck',
])

export const waterLevelSchema = z.enum([
  'full',
  'twothirds',
  'onethird',
  'empty',
])
export const toiletStatusSchema = z.enum(['notpeepee', 'didpeepee'])
export const mathDifficultySchema = z.enum(['easy', 'hard'])
export const taskOutcomeSchema = z.enum(['success', 'failure'])

export const firestoreTimestampLikeSchema = z.custom<{ toDate?: () => Date }>(
  (value) => value == null || typeof value === 'object'
)

export const childSnapshotDataSchema = z
  .object({
    displayName: z.string().catch(''),
    avatarToken: z.string().catch('⭐'),
    totalStars: z.number().finite().catch(0),
    themeId: z.string().optional(),
    createdAt: firestoreTimestampLikeSchema.optional(),
  })
  .passthrough()

export const rewardSnapshotDataSchema = z
  .object({
    title: z.string().catch(''),
    costStars: z.number().finite().catch(0),
    isRepeating: z.boolean().catch(false),
    createdAt: firestoreTimestampLikeSchema.optional(),
  })
  .passthrough()

export const taskSnapshotDataSchema = z
  .object({
    title: z.string().catch(''),
    childId: z.string().catch(''),
    category: z.string().catch(''),
    taskType: z.string().catch('standard'),
    schoolDayEnabled: z.boolean().catch(false),
    nonSchoolDayEnabled: z.boolean().catch(false),
    starValue: z.number().finite().catch(1),
    isRepeating: z.boolean().catch(false),
    createdAt: firestoreTimestampLikeSchema.optional(),
    dinnerDurationSeconds: z
      .number()
      .finite()
      .catch(10 * 60),
    dinnerTotalBites: z.number().finite().catch(2),
    mathTotalProblems: z.number().finite().catch(5),
    mathDifficulty: mathDifficultySchema.catch('easy'),
    pvTotalProblems: z.number().finite().catch(5),
    alphabetTotalProblems: z.number().finite().catch(5),
  })
  .passthrough()

export const todoSnapshotDataSchema = z
  .object({
    title: z.string().catch(''),
    childId: z.string().catch(''),
    sourceTaskId: z.string().catch(''),
    sourceTaskType: z.string().catch('standard'),
    starValue: z.number().finite().catch(1),
    schoolDayEnabled: z.boolean().catch(false),
    nonSchoolDayEnabled: z.boolean().catch(false),
    autoAdded: z.boolean().catch(false),
    completedAt: z.number().finite().nullable().catch(null),
    dateKey: z.string().optional(),
    createdAt: firestoreTimestampLikeSchema.optional(),
    dinnerDurationSeconds: z
      .number()
      .finite()
      .catch(10 * 60),
    dinnerRemainingSeconds: z.number().finite().optional(),
    dinnerTotalBites: z.number().finite().catch(2),
    dinnerBitesLeft: z.number().finite().optional(),
    dinnerTimerStartedAt: z.number().finite().nullable().catch(null),
    mathTotalProblems: z.number().finite().catch(5),
    mathDifficulty: mathDifficultySchema.catch('easy'),
    mathLastOutcome: taskOutcomeSchema.nullable().catch(null),
    pvTotalProblems: z.number().finite().catch(5),
    pvLastOutcome: taskOutcomeSchema.nullable().catch(null),
    alphabetTotalProblems: z.number().finite().catch(5),
    alphabetLastOutcome: taskOutcomeSchema.nullable().catch(null),
    waterLevel: waterLevelSchema.catch('full'),
    toiletStatus: toiletStatusSchema.catch('notpeepee'),
  })
  .passthrough()

export const childStarsSnapshotDataSchema = z
  .object({
    totalStars: z.number().finite().catch(0),
  })
  .passthrough()

export const resetTodayTodosResultSchema = z.object({
  data: z.unknown().optional(),
})

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
export type WaterToiletTask = TaskBase & {
  taskType: 'watertoiletcheck'
}

export type TaskRecord =
  | StandardTask
  | EatingTask
  | MathTask
  | PositionalNotationTask
  | AlphabetTask
  | WaterToiletTask

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
  manageWaterLevel?: WaterLevel
  manageToiletStatus?: ToiletStatus
  manageWaterToiletCompletedAt?: number | null
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
  manageMathLastOutcome?: TaskOutcome | null
}
export type PVTaskWithEphemeral = PositionalNotationTask & {
  managePVCompletedAt?: number | null
  managePVLastOutcome?: TaskOutcome | null
}
export type AlphabetTaskWithEphemeral = AlphabetTask & {
  manageAlphabetCompletedAt?: number | null
  manageAlphabetLastOutcome?: TaskOutcome | null
}
export type WaterToiletTaskWithEphemeral = WaterToiletTask & {
  manageWaterLevel?: WaterLevel
  manageToiletStatus?: ToiletStatus
  manageWaterToiletCompletedAt?: number | null
}

export type TaskWithEphemeral =
  | StandardTaskWithEphemeral
  | EatingTaskWithEphemeral
  | MathTaskWithEphemeral
  | PVTaskWithEphemeral
  | AlphabetTaskWithEphemeral
  | WaterToiletTaskWithEphemeral

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
  mathLastOutcome: TaskOutcome | null
}
export type PositionalNotationTodo = TodoBase & {
  sourceTaskType: 'positional-notation'
  pvTotalProblems: number
  pvLastOutcome: TaskOutcome | null
}
export type AlphabetTodo = TodoBase & {
  sourceTaskType: 'alphabet'
  alphabetTotalProblems: number
  alphabetLastOutcome: TaskOutcome | null
}
export type WaterToiletTodo = TodoBase & {
  sourceTaskType: 'watertoiletcheck'
  waterLevel: WaterLevel
  toiletStatus: ToiletStatus
}

export type TodoRecord =
  | StandardTodo
  | EatingTodo
  | MathTodo
  | PositionalNotationTodo
  | AlphabetTodo
  | WaterToiletTodo

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
  mathLastOutcome: TaskOutcome | null
  pvLastOutcome: TaskOutcome | null
  alphabetLastOutcome: TaskOutcome | null
  waterLevel: WaterLevel
  toiletStatus: ToiletStatus
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
export const DEFAULT_WATER_TOILET_STARS = 0
export const DEFAULT_WATER_LEVEL: WaterLevel = 'full'
export const DEFAULT_TOILET_STATUS: ToiletStatus = 'notpeepee'
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

export function isWaterToiletTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'watertoiletcheck' }> {
  return t.taskType === 'watertoiletcheck'
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

export function isWaterToiletTodo(t: TodoRecord): t is WaterToiletTodo {
  return t.sourceTaskType === 'watertoiletcheck'
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

export const getManageWaterLevel = (task: WaterToiletTaskWithEphemeral) =>
  task.manageWaterLevel ?? DEFAULT_WATER_LEVEL

export const getManageToiletStatus = (task: WaterToiletTaskWithEphemeral) =>
  task.manageToiletStatus ?? DEFAULT_TOILET_STATUS

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
    case 'watertoiletcheck':
      return task.manageWaterToiletCompletedAt ?? null
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
