import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  TaskEphemeralState,
  TaskRecord,
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
  activeMathId: string | null
  activeLargeNumbersId: string | null
  activePVId: string | null
  activeAlphabetId: string | null
  activeSpellingId: string | null
  activeAnimalsId: string | null
  activeDinnerId: string | null
  activeWaterToiletId: string | null
  mathCheckTriggers: Record<string, number>
  largeNumbersCheckTriggers: Record<string, number>
  pvCheckTriggers: Record<string, number>
  alphabetCheckTriggers: Record<string, number>
  spellingCheckTriggers: Record<string, number>
  animalsCheckTriggers: Record<string, number>
  setMathCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setLargeNumbersCheckTriggers?: Dispatch<
    SetStateAction<Record<string, number>>
  >
  setPVCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setAlphabetCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setSpellingCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setAnimalsCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  activePrincessMealIcon?: string
  testFailureModeEnabled?: boolean
  renderDayTypeControl?: (task: TaskRecord) => ReactNode
  hideDeleteUtility?: boolean
}
