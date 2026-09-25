// ── Shared data types and constants for the chore/task system ──

import { z } from 'zod'
import type { ThemeId } from '../ui/themeOptions'
import {
  MAX_DINNER_SLICES,
  MAX_TASK_VALUE,
  MIN_DINNER_SLICES,
  MIN_TASK_VALUE,
} from './taskLimits'

const taskValueSchema = z.number().int().min(MIN_TASK_VALUE).max(MAX_TASK_VALUE)

const dinnerSliceCountSchema = z
  .number()
  .int()
  .min(MIN_DINNER_SLICES)
  .max(MAX_DINNER_SLICES)

const taskSnapshotValue = (fallback: number) => taskValueSchema.catch(fallback)
const dinnerSliceSnapshotValue = (fallback: number) =>
  dinnerSliceCountSchema.catch(fallback)

export type TaskType = z.infer<typeof taskTypeSchema>
export type TestType = z.infer<typeof testTypeSchema>
export type ChoreType = Exclude<TaskType, TestType>

export type WaterLevel = 'full' | 'twothirds' | 'onethird' | 'empty'

export type ToiletStatus = 'notpeepee' | 'didpeepee'
export type TaskOutcome = 'success' | 'failure'

export const taskTypeSchema = z.enum([
  'standard',
  'eating',
  'math',
  'large-numbers',
  'fractions',
  'positional-notation',
  'alphabet',
  'spelling',
  'animals',
  'watertoiletcheck',
])

const testTypeSchema = z.enum([
  'math',
  'large-numbers',
  'fractions',
  'positional-notation',
  'alphabet',
  'spelling',
  'animals',
])
export const TEST_TYPES = testTypeSchema.options
const TEST_TYPE_SET: ReadonlySet<TaskType> = new Set(TEST_TYPES)

export const isTestType = (type: TaskType): type is TestType =>
  TEST_TYPE_SET.has(type)

const waterLevelSchema = z.enum(['full', 'twothirds', 'onethird', 'empty'])
const toiletStatusSchema = z.enum(['notpeepee', 'didpeepee'])
const mathDifficultySchema = z.enum(['easy', 'hard'])
const taskOutcomeSchema = z.enum(['success', 'failure'])

const firestoreTimestampLikeSchema = z
  .custom<{ toDate?: () => Date }>(
    (value) =>
      value !== null &&
      typeof value === 'object' &&
      (!('toDate' in value) ||
        value.toDate === undefined ||
        typeof value.toDate === 'function')
  )
  .nullish()

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
    starValue: taskSnapshotValue(1),
    isRepeating: z.boolean().catch(false),
    imageKey: z.string().optional(),
    createdAt: firestoreTimestampLikeSchema.optional(),
    dinnerDurationSeconds: z
      .number()
      .finite()
      .catch(10 * 60),
    dinnerTotalBites: dinnerSliceSnapshotValue(2),
    mathTotalProblems: taskSnapshotValue(5),
    mathDifficulty: mathDifficultySchema.catch('easy'),
    largeNumbersTotalProblems: taskSnapshotValue(5),
    fractionsTotalProblems: taskSnapshotValue(5),
    pvTotalProblems: taskSnapshotValue(5),
    alphabetTotalProblems: taskSnapshotValue(5),
    spellingTotalProblems: taskSnapshotValue(5),
    animalsTotalProblems: taskSnapshotValue(5),
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

type StandardTaskState = {
  manageCompletedAt?: number | null
}
type EatingTaskState = {
  manageDinnerRemainingSeconds?: number
  manageDinnerBitesLeft?: number
  manageDinnerTimerStartedAt?: number | null
  manageDinnerCompletedAt?: number | null
}
type WaterToiletTaskState = {
  manageWaterLevel?: WaterLevel
  manageToiletStatus?: ToiletStatus
  manageWaterToiletCompletedAt?: number | null
}

type StandardTask = TaskBase & StandardTaskState & { taskType: 'standard' }
type EatingTask = TaskBase &
  EatingTaskState & {
    taskType: 'eating'
    dinnerDurationSeconds: number
    dinnerTotalBites: number
  }
export type MathDifficulty = 'easy' | 'hard'

type MathTask = TaskBase & {
  taskType: 'math'
  mathTotalProblems: number
  mathDifficulty?: MathDifficulty
}
type LargeNumbersTask = TaskBase & {
  taskType: 'large-numbers'
  largeNumbersTotalProblems: number
}
type FractionsTask = TaskBase & {
  taskType: 'fractions'
  fractionsTotalProblems: number
}
type PositionalNotationTask = TaskBase & {
  taskType: 'positional-notation'
  pvTotalProblems: number
}
type AlphabetTask = TaskBase & {
  taskType: 'alphabet'
  alphabetTotalProblems: number
}
type SpellingTask = TaskBase & {
  taskType: 'spelling'
  spellingTotalProblems: number
}
type AnimalsTask = TaskBase & {
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
  | FractionsTask
  | PositionalNotationTask
  | AlphabetTask
  | SpellingTask
  | AnimalsTask
  | WaterToiletTask

export type ChoreRecord = Extract<TaskRecord, { taskType: ChoreType }>

export type TestRecord = Extract<TaskRecord, { taskType: TestType }>

// Quiz variants share a state shape while preserving their stored field names.
type TestStatePrefixes = {
  math: 'Math'
  'large-numbers': 'LargeNumbers'
  fractions: 'Fractions'
  'positional-notation': 'PV'
  alphabet: 'Alphabet'
  spelling: 'Spelling'
  animals: 'Animals'
}
type TestState<Prefix extends string> = {
  [Field in `manage${Prefix}CompletedAt`]?: number | null
} & { [Field in `manage${Prefix}LastOutcome`]?: TaskOutcome | null }

// Flat bag for in-memory storage; the discriminated union below restricts each task.
export type TaskEphemeralState = StandardTaskState &
  EatingTaskState &
  WaterToiletTaskState &
  TestState<TestStatePrefixes[TestType]>
export type TestWithEphemeral = {
  [Type in TestType]: Extract<TestRecord, { taskType: Type }> &
    TestState<TestStatePrefixes[Type]>
}[TestType]
export type EatingTaskWithEphemeral = EatingTask
export type ChoreWithEphemeral = ChoreRecord
export type TaskWithEphemeral = ChoreWithEphemeral | TestWithEphemeral

const isChoreType = (type: TaskType): type is ChoreType =>
  type === 'standard' || type === 'eating' || type === 'watertoiletcheck'

export function isChoreRecord(task: TaskRecord): task is ChoreRecord {
  return isChoreType(task.taskType)
}

export function isTestRecord(task: TaskRecord): task is TestRecord {
  return isTestType(task.taskType)
}

export function isChoreWithEphemeral(
  item: TaskWithEphemeral
): item is ChoreWithEphemeral {
  return isChoreRecord(item)
}

export function isTestWithEphemeral(
  item: TaskWithEphemeral
): item is TestWithEphemeral {
  return isTestRecord(item)
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
  fractionsTotalProblems: number
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

// ── Constants ──

export const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
export const DEFAULT_DINNER_BITES = 2
export const DEFAULT_DINNER_STARS = 3
export const DEFAULT_MATH_PROBLEMS = 5
export const DEFAULT_MATH_STARS = 3
export const DEFAULT_LARGE_NUMBERS_PROBLEMS = 5
export const DEFAULT_LARGE_NUMBERS_STARS = 3
export const DEFAULT_FRACTIONS_PROBLEMS = 5
export const DEFAULT_FRACTIONS_STARS = 3
export const DEFAULT_PV_PROBLEMS = 5
export const DEFAULT_PV_STARS = 3
export const DEFAULT_ALPHABET_PROBLEMS = 5
export const DEFAULT_ALPHABET_STARS = 3
export const DEFAULT_SPELLING_PROBLEMS = 5
export const DEFAULT_SPELLING_STARS = 3
export const DEFAULT_ANIMALS_PROBLEMS = 5
export const DEFAULT_ANIMALS_STARS = 3
export const DEFAULT_WATER_TOILET_STARS = 1
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

export function isWaterToiletTask<T extends { taskType: TaskType }>(
  t: T
): t is Extract<T, { taskType: 'watertoiletcheck' }> {
  return t.taskType === 'watertoiletcheck'
}

// ── TaskWithEphemeral helpers ──

export const getManageDinnerRemaining = (task: EatingTaskWithEphemeral) =>
  task.manageDinnerRemainingSeconds ?? task.dinnerDurationSeconds

export const getManageDinnerBitesLeft = (task: EatingTaskWithEphemeral) =>
  task.manageDinnerBitesLeft ?? task.dinnerTotalBites

export const getManageWaterLevel = (task: WaterToiletTask) =>
  task.manageWaterLevel ?? DEFAULT_WATER_LEVEL

export const getManageToiletStatus = (task: WaterToiletTask) =>
  task.manageToiletStatus ?? DEFAULT_TOILET_STATUS

export const manageCompletedAtFieldByType = {
  standard: 'manageCompletedAt',
  eating: 'manageDinnerCompletedAt',
  math: 'manageMathCompletedAt',
  'large-numbers': 'manageLargeNumbersCompletedAt',
  fractions: 'manageFractionsCompletedAt',
  'positional-notation': 'managePVCompletedAt',
  alphabet: 'manageAlphabetCompletedAt',
  spelling: 'manageSpellingCompletedAt',
  animals: 'manageAnimalsCompletedAt',
  watertoiletcheck: 'manageWaterToiletCompletedAt',
} satisfies {
  [Type in TaskType]: Extract<
    keyof Extract<TaskWithEphemeral, { taskType: Type }>,
    `${string}CompletedAt`
  >
}

export const manageOutcomeFieldByType = {
  math: 'manageMathLastOutcome',
  'large-numbers': 'manageLargeNumbersLastOutcome',
  fractions: 'manageFractionsLastOutcome',
  alphabet: 'manageAlphabetLastOutcome',
  spelling: 'manageSpellingLastOutcome',
  animals: 'manageAnimalsLastOutcome',
  'positional-notation': 'managePVLastOutcome',
} satisfies {
  [Type in TestType]: Extract<
    keyof Extract<TestWithEphemeral, { taskType: Type }>,
    `${string}LastOutcome`
  >
}

export const getManageTaskCompletedAt = (task: TaskWithEphemeral) => {
  const state: TaskEphemeralState = task
  return state[manageCompletedAtFieldByType[task.taskType]] ?? null
}

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
