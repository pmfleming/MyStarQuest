import type {
  TaskEphemeralState,
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
  onExitActivity?: (item: UnifiedChoreItem) => void
  onComplete?: (item: UnifiedChoreItem) => MaybePromise
  onFail?: (item: UnifiedChoreItem) => MaybePromise
  onReset?: (item: UnifiedChoreItem) => MaybePromise
  onStartDinner?: (item: UnifiedChoreItem) => MaybePromise
  onApplyBite?: (item: UnifiedChoreItem) => MaybePromise
  onExpireDinner?: (item: UnifiedChoreItem) => MaybePromise
  activeIds: ReadonlySet<string>
  checkTriggers: Partial<Record<TestType, Record<string, number>>>
  onCheck?: (type: TestType, id: string) => void
  biteCooldownSeconds: number
  biteCooldowns?: Readonly<Record<string, number>>
  activeMealIcon?: string
  testFailureModeEnabled?: boolean
  canReset?: boolean
  hideDeleteUtility?: boolean
}
