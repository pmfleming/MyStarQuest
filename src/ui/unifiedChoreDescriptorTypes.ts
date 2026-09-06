import type { ReactNode } from 'react'
import type {
  TaskEphemeralState,
  TaskRecord,
  TaskType,
  TestType,
  TaskUpdatableFields,
  TaskWithEphemeral,
  TodoRecord,
  TodoUpdatableFields,
} from '../data/types'

export type UnifiedChoreItem = TaskWithEphemeral | TodoRecord
export type PrincessAsset = string | undefined
type MaybePromise = void | Promise<void>

export type UnifiedChoreDeps = {
  theme: import('../contexts/ThemeContext').Theme
  mode: 'manage' | 'today'
  onUpdateTaskField?: (id: string, field: TaskUpdatableFields) => MaybePromise
  onUpdateTodoField?: (id: string, field: TodoUpdatableFields) => MaybePromise
  onUpdateEphemeral?: (
    id: string,
    patch: Partial<TaskEphemeralState>
  ) => MaybePromise
  onSetTitleDraft?: (id: string, value: string) => void
  onCommitTitle?: (id: string, value: string) => MaybePromise
  onDeleteTask?: (id: string) => MaybePromise
  onDeleteTodo?: (id: string) => MaybePromise
  onEnterChore?: (item: UnifiedChoreItem) => MaybePromise
  onExitActivity?: () => void
  onComplete?: (item: UnifiedChoreItem) => MaybePromise
  onFail?: (item: UnifiedChoreItem) => MaybePromise
  onReset?: (item: UnifiedChoreItem) => MaybePromise
  onStartDinner?: (item: UnifiedChoreItem | null) => MaybePromise
  onApplyBite?: (item: UnifiedChoreItem) => MaybePromise
  onExpireDinner?: (item: UnifiedChoreItem) => MaybePromise
  titleDrafts?: Record<string, string>
  activeIds: Partial<Record<TaskType, string | null>>
  checkTriggers: Partial<Record<TestType, Record<string, number>>>
  onCheck?: (type: TestType, id: string) => void
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  activePrincessMealIcon?: string
  testFailureModeEnabled?: boolean
  renderDayTypeControl?: (task: TaskRecord) => ReactNode
  hideDeleteUtility?: boolean
}
