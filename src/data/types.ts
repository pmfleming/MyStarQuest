// ── Shared data types and constants for the chore/task system ──

import type { ThemeId } from '../ui/themeOptions'
import { z } from 'zod'

export type TaskType =
  | 'standard'
  | 'eating'
  | 'math'
  | 'large-numbers'
  | 'positional-notation'
  | 'alphabet'
  | 'spelling'
  | 'animals'
  | 'watertoiletcheck'

export type ChoreType = Extract<
  TaskType,
  'standard' | 'eating' | 'watertoiletcheck'
>

export type TestType = Extract<
  TaskType,
  | 'math'
  | 'large-numbers'
  | 'positional-notation'
  | 'alphabet'
  | 'spelling'
  | 'animals'
>

export type WaterLevel = 'full' | 'twothirds' | 'onethird' | 'empty'

export type ToiletStatus = 'notpeepee' | 'didpeepee'
export type TaskOutcome = 'success' | 'failure'

export const taskTypeSchema = z.enum([
  'standard',
  'eating',
  'math',
  'large-numbers',
  'positional-notation',
  'alphabet',
  'spelling',
  'animals',
  'watertoiletcheck',
])

export const choreTypeSchema = z.enum([
  'standard',
  'eating',
  'watertoiletcheck',
])

export const testTypeSchema = z.enum([
  'math',
  'large-numbers',
  'positional-notation',
  'alphabet',
  'spelling',
  'animals',
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
    testFailureModeEnabled: z.boolean().catch(true),
    createdAt: firestoreTimestampLikeSchema.optional(),
  })
  .passthrough()

export const rewardSnapshotDataSchema = z
  .object({
    title: z.string().catch(''),
    costStars: z.number().finite().catch(0),
    isRepeating: z.boolean().catch(false),
    imageKey: z.string().optional(),
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
    imageKey: z.string().optional(),
    createdAt: firestoreTimestampLikeSchema.optional(),
    dinnerDurationSeconds: z
      .number()
      .finite()
      .catch(10 * 60),
    dinnerTotalBites: z.number().finite().catch(2),
    mathTotalProblems: z.number().finite().catch(5),
    mathDifficulty: mathDifficultySchema.catch('easy'),
    largeNumbersTotalProblems: z.number().finite().catch(5),
    pvTotalProblems: z.number().finite().catch(5),
    alphabetTotalProblems: z.number().finite().catch(5),
    spellingTotalProblems: z.number().finite().catch(5),
    animalsTotalProblems: z.number().finite().catch(5),
    lastAttemptedAt: z.number().finite().nullable().catch(null),
    lastAttemptDateKey: z.string().catch(''),
    lastAttemptOutcome: taskOutcomeSchema.nullable().catch(null),
    manageCompletedAt: z.number().finite().nullable().optional(),
    manageDinnerRemainingSeconds: z.number().finite().optional(),
    manageDinnerBitesLeft: z.number().finite().optional(),
    manageDinnerTimerStartedAt: z.number().finite().nullable().optional(),
    manageDinnerCompletedAt: z.number().finite().nullable().optional(),
    manageWaterLevel: waterLevelSchema.optional(),
    manageToiletStatus: toiletStatusSchema.optional(),
    manageWaterToiletCompletedAt: z.number().finite().nullable().optional(),
  })
  .passthrough()

export const choreSnapshotDataSchema = taskSnapshotDataSchema.extend({
  choreType: z.string().optional(),
})

export const testSnapshotDataSchema = taskSnapshotDataSchema.extend({
  testType: z.string().optional(),
})

export const todoSnapshotDataSchema = z
  .object({
    title: z.string().catch(''),
    childId: z.string().catch(''),
    sourceTaskId: z.string().catch(''),
    sourceTaskType: z.string().catch('standard'),
    sourceChoreId: z.string().optional(),
    sourceChoreType: z.string().optional(),
    starValue: z.number().finite().catch(1),
    schoolDayEnabled: z.boolean().catch(false),
    nonSchoolDayEnabled: z.boolean().catch(false),
    autoAdded: z.boolean().catch(false),
    imageKey: z.string().optional(),
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
    largeNumbersTotalProblems: z.number().finite().catch(5),
    largeNumbersLastOutcome: taskOutcomeSchema.nullable().catch(null),
    pvTotalProblems: z.number().finite().catch(5),
    pvLastOutcome: taskOutcomeSchema.nullable().catch(null),
    alphabetTotalProblems: z.number().finite().catch(5),
    alphabetLastOutcome: taskOutcomeSchema.nullable().catch(null),
    spellingTotalProblems: z.number().finite().catch(5),
    spellingLastOutcome: taskOutcomeSchema.nullable().catch(null),
    animalsTotalProblems: z.number().finite().catch(5),
    animalsLastOutcome: taskOutcomeSchema.nullable().catch(null),
    waterLevel: waterLevelSchema.catch('full'),
    toiletStatus: toiletStatusSchema.catch('notpeepee'),
  })
  .passthrough()

export const choreTodoSnapshotDataSchema = todoSnapshotDataSchema.extend({
  sourceChoreId: z.string().catch(''),
  sourceChoreType: z.string().catch('standard'),
})

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
  imageKey?: string
  createdAt?: Date
  lastAttemptedAt?: number | null
  lastAttemptDateKey?: string
  lastAttemptOutcome?: TaskOutcome | null
}

export type StandardTaskState = {
  manageCompletedAt?: number | null
}
export type EatingTaskState = {
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerTimerStartedAt?: number | null
  manageDinnerCompletedAt?: number | null
}
export type WaterToiletTaskState = {
  manageWaterLevel?: WaterLevel
  manageToiletStatus?: ToiletStatus
  manageWaterToiletCompletedAt?: number | null
}

export type StandardTask = TaskBase &
  StandardTaskState & { taskType: 'standard' }
export type EatingTask = TaskBase &
  EatingTaskState & {
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
export type LargeNumbersTask = TaskBase & {
  taskType: 'large-numbers'
  largeNumbersTotalProblems: number
}
export type PositionalNotationTask = TaskBase & {
  taskType: 'positional-notation'
  pvTotalProblems: number
}
export type AlphabetTask = TaskBase & {
  taskType: 'alphabet'
  alphabetTotalProblems: number
}
export type SpellingTask = TaskBase & {
  taskType: 'spelling'
  spellingTotalProblems: number
}
export type AnimalsTask = TaskBase & {
  taskType: 'animals'
  animalsTotalProblems: number
}
export type WaterToiletTask = TaskBase &
  WaterToiletTaskState & {
    taskType: 'watertoiletcheck'
  }

export type TaskRecord =
  | StandardTask
  | EatingTask
  | MathTask
  | LargeNumbersTask
  | PositionalNotationTask
  | AlphabetTask
  | SpellingTask
  | AnimalsTask
  | WaterToiletTask

export type ChoreRecord = Extract<
  TaskRecord,
  { taskType: 'standard' | 'eating' | 'watertoiletcheck' }
>

export type TestRecord = Extract<
  TaskRecord,
  {
    taskType:
      | 'math'
      | 'large-numbers'
      | 'positional-notation'
      | 'alphabet'
      | 'spelling'
      | 'animals'
  }
>

// ── TaskEphemeralState: flat bag for in-memory storage ──

export type TaskEphemeralState = {
  manageCompletedAt?: number | null
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerTimerStartedAt?: number | null
  manageDinnerCompletedAt?: number | null
  manageMathCompletedAt?: number | null
  manageMathLastOutcome?: 'success' | 'failure' | null
  manageLargeNumbersCompletedAt?: number | null
  manageLargeNumbersLastOutcome?: 'success' | 'failure' | null
  managePVCompletedAt?: number | null
  managePVLastOutcome?: 'success' | 'failure' | null
  manageAlphabetCompletedAt?: number | null
  manageAlphabetLastOutcome?: 'success' | 'failure' | null
  manageSpellingCompletedAt?: number | null
  manageSpellingLastOutcome?: 'success' | 'failure' | null
  manageAnimalsCompletedAt?: number | null
  manageAnimalsLastOutcome?: 'success' | 'failure' | null
  manageWaterLevel?: WaterLevel
  manageToiletStatus?: ToiletStatus
  manageWaterToiletCompletedAt?: number | null
}

// ── TaskWithEphemeral: discriminated union pairing each variant with its ephemeral fields ──

export type StandardTaskWithEphemeral = StandardTask & StandardTaskState
export type EatingTaskWithEphemeral = EatingTask & EatingTaskState
export type MathTaskWithEphemeral = MathTask & {
  manageMathCompletedAt?: number | null
  manageMathLastOutcome?: TaskOutcome | null
}
export type LargeNumbersTaskWithEphemeral = LargeNumbersTask & {
  manageLargeNumbersCompletedAt?: number | null
  manageLargeNumbersLastOutcome?: TaskOutcome | null
}
export type PVTaskWithEphemeral = PositionalNotationTask & {
  managePVCompletedAt?: number | null
  managePVLastOutcome?: TaskOutcome | null
}
export type AlphabetTaskWithEphemeral = AlphabetTask & {
  manageAlphabetCompletedAt?: number | null
  manageAlphabetLastOutcome?: TaskOutcome | null
}
export type SpellingTaskWithEphemeral = SpellingTask & {
  manageSpellingCompletedAt?: number | null
  manageSpellingLastOutcome?: TaskOutcome | null
}
export type AnimalsTaskWithEphemeral = AnimalsTask & {
  manageAnimalsCompletedAt?: number | null
  manageAnimalsLastOutcome?: TaskOutcome | null
}
export type WaterToiletTaskWithEphemeral = WaterToiletTask &
  WaterToiletTaskState

export type TaskWithEphemeral =
  | StandardTaskWithEphemeral
  | EatingTaskWithEphemeral
  | MathTaskWithEphemeral
  | LargeNumbersTaskWithEphemeral
  | PVTaskWithEphemeral
  | AlphabetTaskWithEphemeral
  | SpellingTaskWithEphemeral
  | AnimalsTaskWithEphemeral
  | WaterToiletTaskWithEphemeral

export type ChoreWithEphemeral = Extract<
  TaskWithEphemeral,
  { taskType: 'standard' | 'eating' | 'watertoiletcheck' }
>

export type TestWithEphemeral = Extract<
  TaskWithEphemeral,
  {
    taskType:
      | 'math'
      | 'large-numbers'
      | 'positional-notation'
      | 'alphabet'
      | 'spelling'
      | 'animals'
  }
>

export function isChoreRecord(task: TaskRecord): task is ChoreRecord {
  return (
    task.taskType === 'standard' ||
    task.taskType === 'eating' ||
    task.taskType === 'watertoiletcheck'
  )
}

export function isTestRecord(task: TaskRecord): task is TestRecord {
  return (
    task.taskType === 'math' ||
    task.taskType === 'large-numbers' ||
    task.taskType === 'positional-notation' ||
    task.taskType === 'alphabet' ||
    task.taskType === 'spelling' ||
    task.taskType === 'animals'
  )
}

export function isTaskWithEphemeral(
  item: TaskWithEphemeral | TodoRecord
): item is TaskWithEphemeral {
  return 'taskType' in item
}

export function isTestWithEphemeral(
  item: TaskWithEphemeral | TodoRecord
): item is TestWithEphemeral {
  return isTaskWithEphemeral(item) && isTestRecord(item)
}

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
  imageKey?: string
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
export type LargeNumbersTodo = TodoBase & {
  sourceTaskType: 'large-numbers'
  largeNumbersTotalProblems: number
  largeNumbersLastOutcome: TaskOutcome | null
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
export type SpellingTodo = TodoBase & {
  sourceTaskType: 'spelling'
  spellingTotalProblems: number
  spellingLastOutcome: TaskOutcome | null
}
export type AnimalsTodo = TodoBase & {
  sourceTaskType: 'animals'
  animalsTotalProblems: number
  animalsLastOutcome: TaskOutcome | null
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
  | LargeNumbersTodo
  | PositionalNotationTodo
  | AlphabetTodo
  | SpellingTodo
  | AnimalsTodo
  | WaterToiletTodo

export type ChoreTodoRecord = Extract<
  TodoRecord,
  { sourceTaskType: 'standard' | 'eating' | 'watertoiletcheck' }
>

export function isChoreTodoRecord(todo: TodoRecord): todo is ChoreTodoRecord {
  return (
    todo.sourceTaskType === 'standard' ||
    todo.sourceTaskType === 'eating' ||
    todo.sourceTaskType === 'watertoiletcheck'
  )
}

// ── Updatable field subsets ──

export type TaskUpdatableFields = Partial<{
  title: string
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  isRepeating: boolean
  imageKey: string
  dinnerDurationSeconds: number
  dinnerTotalBites: number
  mathTotalProblems: number
  mathDifficulty: MathDifficulty
  largeNumbersTotalProblems: number
  pvTotalProblems: number
  alphabetTotalProblems: number
  spellingTotalProblems: number
  animalsTotalProblems: number
  lastAttemptedAt: number | null
  lastAttemptDateKey: string
  lastAttemptOutcome: TaskOutcome | null
  manageCompletedAt: number | null
  manageDinnerRemainingSeconds: number
  manageDinnerBitesLeft: number
  manageDinnerTimerStartedAt: number | null
  manageDinnerCompletedAt: number | null
  manageWaterLevel: WaterLevel
  manageToiletStatus: ToiletStatus
  manageWaterToiletCompletedAt: number | null
}>

export type TodoUpdatableFields = Partial<{
  title: string
  starValue: number
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  imageKey: string
  completedAt: number | null
  dinnerDurationSeconds: number
  dinnerRemainingSeconds: number
  dinnerTotalBites: number
  dinnerBitesLeft: number
  dinnerTimerStartedAt: number | null
  mathLastOutcome: TaskOutcome | null
  largeNumbersLastOutcome: TaskOutcome | null
  pvLastOutcome: TaskOutcome | null
  alphabetLastOutcome: TaskOutcome | null
  spellingLastOutcome: TaskOutcome | null
  animalsLastOutcome: TaskOutcome | null
  waterLevel: WaterLevel
  toiletStatus: ToiletStatus
}>

// ── Constants ──

export const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
export const DEFAULT_DINNER_BITES = 2
export const DEFAULT_DINNER_STARS = 3
export const DEFAULT_MATH_PROBLEMS = 5
export const DEFAULT_MATH_STARS = 3
export const DEFAULT_LARGE_NUMBERS_PROBLEMS = 5
export const DEFAULT_LARGE_NUMBERS_STARS = 3
export const DEFAULT_PV_PROBLEMS = 5
export const DEFAULT_PV_STARS = 3
export const DEFAULT_ALPHABET_PROBLEMS = 5
export const DEFAULT_ALPHABET_STARS = 3
export const DEFAULT_SPELLING_PROBLEMS = 5
export const DEFAULT_SPELLING_STARS = 3
export const DEFAULT_ANIMALS_PROBLEMS = 5
export const DEFAULT_ANIMALS_STARS = 3
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

export function isLargeNumbersTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'large-numbers' }> {
  return t.taskType === 'large-numbers'
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

export function isSpellingTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'spelling' }> {
  return t.taskType === 'spelling'
}

export function isAnimalsTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'animals' }> {
  return t.taskType === 'animals'
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

export function isLargeNumbersTodo(t: TodoRecord): t is LargeNumbersTodo {
  return t.sourceTaskType === 'large-numbers'
}

export function isPositionalNotationTodo(
  t: TodoRecord
): t is PositionalNotationTodo {
  return t.sourceTaskType === 'positional-notation'
}

export function isAlphabetTodo(t: TodoRecord): t is AlphabetTodo {
  return t.sourceTaskType === 'alphabet'
}

export function isSpellingTodo(t: TodoRecord): t is SpellingTodo {
  return t.sourceTaskType === 'spelling'
}

export function isAnimalsTodo(t: TodoRecord): t is AnimalsTodo {
  return t.sourceTaskType === 'animals'
}

export function isWaterToiletTodo(t: TodoRecord): t is WaterToiletTodo {
  return t.sourceTaskType === 'watertoiletcheck'
}

// ── TaskWithEphemeral helpers ──

export const getManageDinnerRemaining = (task: EatingTaskWithEphemeral) =>
  task.manageDinnerRemainingSeconds ?? task.dinnerDurationSeconds

export const getManageDinnerBitesLeft = (task: EatingTaskWithEphemeral) =>
  task.manageDinnerBitesLeft ?? task.dinnerTotalBites

export const getManageWaterLevel = (task: WaterToiletTaskWithEphemeral) =>
  task.manageWaterLevel ?? DEFAULT_WATER_LEVEL

export const getManageToiletStatus = (task: WaterToiletTaskWithEphemeral) =>
  task.manageToiletStatus ?? DEFAULT_TOILET_STATUS

const manageCompletedAtFieldByType = {
  standard: 'manageCompletedAt',
  eating: 'manageDinnerCompletedAt',
  math: 'manageMathCompletedAt',
  'large-numbers': 'manageLargeNumbersCompletedAt',
  'positional-notation': 'managePVCompletedAt',
  alphabet: 'manageAlphabetCompletedAt',
  spelling: 'manageSpellingCompletedAt',
  animals: 'manageAnimalsCompletedAt',
  watertoiletcheck: 'manageWaterToiletCompletedAt',
} satisfies Record<TaskType, keyof TaskEphemeralState>

type TaskCompletionState = Partial<
  Record<(typeof manageCompletedAtFieldByType)[TaskType], number | null>
>

export const getManageTaskCompletedAt = (task: TaskWithEphemeral) =>
  (task as TaskCompletionState)[manageCompletedAtFieldByType[task.taskType]] ??
  null

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
  testFailureModeEnabled: boolean
  createdAt?: Date
}

export type ChildUpdatableFields = Partial<
  Pick<
    ChildProfile,
    | 'displayName'
    | 'avatarToken'
    | 'themeId'
    | 'totalStars'
    | 'testFailureModeEnabled'
  >
>

// ── Reward ──

export type RewardRecord = {
  id: string
  title: string
  costStars: number
  isRepeating: boolean
  imageKey?: string
  createdAt?: Date
}

export type RewardUpdatableFields = Partial<
  Pick<RewardRecord, 'title' | 'costStars' | 'isRepeating' | 'imageKey'>
>
