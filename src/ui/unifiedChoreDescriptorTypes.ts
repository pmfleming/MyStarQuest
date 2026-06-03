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

export type UnifiedChoreDeps = {
  theme: import('../contexts/ThemeContext').Theme
  mode: 'manage' | 'today'
  onUpdateTaskField?: (id: string, field: TaskUpdatableFields) => void
  onUpdateTodoField?: (id: string, field: TodoUpdatableFields) => void
  onUpdateEphemeral?: (id: string, patch: Partial<TaskEphemeralState>) => void
  onSetTitleDraft?: (id: string, value: string) => void
  onCommitTitle?: (id: string, value: string) => void
  onDeleteTask?: (id: string) => void
  onDeleteTodo?: (id: string) => void
  onEnterChore?: (item: UnifiedChoreItem) => void
  onComplete?: (item: UnifiedChoreItem) => void
  onFail?: (item: UnifiedChoreItem) => void
  onReset?: (item: UnifiedChoreItem) => void
  onStartDinner?: (item: UnifiedChoreItem | null) => void
  onApplyBite?: (item: UnifiedChoreItem) => void
  onExpireDinner?: (item: UnifiedChoreItem) => void
  titleDrafts?: Record<string, string>
  activeMathId: string | null
  activePVId: string | null
  activeAlphabetId: string | null
  activeSpellingId: string | null
  activeDinnerId: string | null
  activeWaterToiletId: string | null
  mathCheckTriggers: Record<string, number>
  pvCheckTriggers: Record<string, number>
  alphabetCheckTriggers: Record<string, number>
  spellingCheckTriggers: Record<string, number>
  setMathCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setPVCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setAlphabetCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setSpellingCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  activePrincessMealIcon?: string
  renderDayTypeControl?: (task: TaskRecord) => ReactNode
  hideDeleteUtility?: boolean
}
