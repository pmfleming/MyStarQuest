import type {
  TaskEphemeralState,
  TaskType,
  TestType,
  TaskUpdatableFields,
  TaskWithEphemeral,
} from '../data/types'

export type UnifiedChoreItem = TaskWithEphemeral
export type ThemedAsset = string | undefined
type MaybePromise = void | Promise<void>

export type UnifiedChoreDeps = {
  theme: import('../contexts/ThemeContext').Theme
  onUpdateTaskField?: (id: string, field: TaskUpdatableFields) => MaybePromise
  onUpdateEphemeral?: (
    id: string,
    patch: Partial<TaskEphemeralState>
  ) => MaybePromise
  onDeleteTask?: (id: string) => MaybePromise
  onEnterChore?: (item: UnifiedChoreItem) => MaybePromise
  onExitActivity?: () => void
  onComplete?: (item: UnifiedChoreItem) => MaybePromise
  onFail?: (item: UnifiedChoreItem) => MaybePromise
  onReset?: (item: UnifiedChoreItem) => MaybePromise
  onStartDinner?: (item: UnifiedChoreItem | null) => MaybePromise
  onApplyBite?: (item: UnifiedChoreItem) => MaybePromise
  onExpireDinner?: (item: UnifiedChoreItem) => MaybePromise
  activeIds: Partial<Record<TaskType, string | null>>
  checkTriggers: Partial<Record<TestType, Record<string, number>>>
  onCheck?: (type: TestType, id: string) => void
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  activeMealIcon?: string
  testFailureModeEnabled?: boolean
  hideDeleteUtility?: boolean
}
