import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getTodayDescriptor } from '../lib/today'
import {
  DEFAULT_TOILET_STATUS,
  DEFAULT_WATER_LEVEL,
  MANAGE_STATUS_RESET_MS,
  isTestWithEphemeral,
  type TaskEphemeralState,
  type TaskOutcome,
  type TaskRecord,
  type TaskType,
  type TaskWithEphemeral,
  type TestRecord,
  type TestWithEphemeral,
  type TodoUpdatableFields,
} from './types'

type DraftableItem = {
  id: string
  title: string
}

type TodoLike = {
  id: string
} & Partial<TodoUpdatableFields>

const todoUpdatableFieldKeys: Array<keyof TodoUpdatableFields> = [
  'title',
  'starValue',
  'schoolDayEnabled',
  'nonSchoolDayEnabled',
  'imageKey',
  'completedAt',
  'dinnerDurationSeconds',
  'dinnerRemainingSeconds',
  'dinnerTotalBites',
  'dinnerBitesLeft',
  'dinnerTimerStartedAt',
  'mathLastOutcome',
  'largeNumbersLastOutcome',
  'pvLastOutcome',
  'alphabetLastOutcome',
  'spellingLastOutcome',
  'waterLevel',
  'toiletStatus',
]

const testOutcomeFieldByType: Partial<
  Record<TaskType, keyof TodoUpdatableFields>
> = {
  math: 'mathLastOutcome',
  'large-numbers': 'largeNumbersLastOutcome',
  alphabet: 'alphabetLastOutcome',
  spelling: 'spellingLastOutcome',
  'positional-notation': 'pvLastOutcome',
}

type ManageOutcomePatchFields = {
  completedAt: keyof TaskEphemeralState
  outcome: keyof TaskEphemeralState
}

const manageOutcomePatchByType: Partial<
  Record<TaskType, ManageOutcomePatchFields>
> = {
  math: {
    completedAt: 'manageMathCompletedAt',
    outcome: 'manageMathLastOutcome',
  },
  'large-numbers': {
    completedAt: 'manageLargeNumbersCompletedAt',
    outcome: 'manageLargeNumbersLastOutcome',
  },
  alphabet: {
    completedAt: 'manageAlphabetCompletedAt',
    outcome: 'manageAlphabetLastOutcome',
  },
  spelling: {
    completedAt: 'manageSpellingCompletedAt',
    outcome: 'manageSpellingLastOutcome',
  },
  'positional-notation': {
    completedAt: 'managePVCompletedAt',
    outcome: 'managePVLastOutcome',
  },
}

const copyRemainingPatchField = <K extends keyof TodoUpdatableFields>(
  remainingPatch: TodoUpdatableFields,
  key: K,
  todo: TodoLike,
  patch: TodoUpdatableFields
) => {
  const value = patch[key]
  if (todo[key] !== value) remainingPatch[key] = value
}

export const useTodayInfo = () => {
  const [todayInfo, setTodayInfo] = useState(() => getTodayDescriptor())

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayDescriptor()
      if (current.dateKey !== todayInfo.dateKey) {
        setTodayInfo(current)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [todayInfo.dateKey])

  return todayInfo
}

export const mergeMissingTitleDrafts = <T extends DraftableItem>(
  previousDrafts: Record<string, string>,
  items: T[]
) => {
  let changed = false
  const next = { ...previousDrafts }
  for (const item of items) {
    if (!(item.id in next)) {
      next[item.id] = item.title
      changed = true
    }
  }
  return changed ? next : previousDrafts
}

export const useTitleDraftBackfill = <T extends DraftableItem>(
  items: T[],
  setDrafts: Dispatch<SetStateAction<Record<string, string>>>
) => {
  useEffect(() => {
    setDrafts((prev) => mergeMissingTitleDrafts(prev, items))
  }, [items, setDrafts])
}

export const pruneResolvedTodoOverrides = <T extends TodoLike>(
  previousOverrides: Record<string, TodoUpdatableFields>,
  nextTodos: T[]
) => {
  let changed = false
  const todoMap = new Map(nextTodos.map((todo) => [todo.id, todo]))
  const nextOverrides: Record<string, TodoUpdatableFields> = {}

  for (const [todoId, patch] of Object.entries(previousOverrides)) {
    const todo = todoMap.get(todoId)
    if (!todo) {
      changed = true
      continue
    }

    const remainingPatch: TodoUpdatableFields = {}
    for (const key of todoUpdatableFieldKeys) {
      if (!(key in patch)) continue
      copyRemainingPatchField(remainingPatch, key, todo, patch)
    }

    if (Object.keys(remainingPatch).length > 0) {
      nextOverrides[todoId] = remainingPatch
    } else {
      changed = true
    }
  }

  return changed ? nextOverrides : previousOverrides
}

export const mergeTodoOverrides = <T extends TodoLike>(
  todos: T[],
  overrides: Record<string, TodoUpdatableFields>
) => todos.map((todo): T => ({ ...todo, ...overrides[todo.id] }))

export const mergeTaskEphemeral = (
  task: TaskRecord,
  state: TaskEphemeralState = {}
): TaskWithEphemeral => {
  switch (task.taskType) {
    case 'standard':
      return {
        ...task,
        manageCompletedAt: state.manageCompletedAt ?? task.manageCompletedAt,
      }
    case 'eating':
      return {
        ...task,
        manageDinnerRemainingSeconds:
          state.manageDinnerRemainingSeconds ??
          task.manageDinnerRemainingSeconds,
        manageDinnerBitesLeft:
          state.manageDinnerBitesLeft ?? task.manageDinnerBitesLeft,
        manageDinnerTimerStartedAt:
          state.manageDinnerTimerStartedAt ?? task.manageDinnerTimerStartedAt,
        manageDinnerCompletedAt:
          state.manageDinnerCompletedAt ?? task.manageDinnerCompletedAt,
      }
    case 'math':
      return {
        ...task,
        manageMathCompletedAt: state.manageMathCompletedAt,
        manageMathLastOutcome: state.manageMathLastOutcome,
      }
    case 'large-numbers':
      return {
        ...task,
        manageLargeNumbersCompletedAt: state.manageLargeNumbersCompletedAt,
        manageLargeNumbersLastOutcome: state.manageLargeNumbersLastOutcome,
      }
    case 'positional-notation':
      return {
        ...task,
        managePVCompletedAt: state.managePVCompletedAt,
        managePVLastOutcome: state.managePVLastOutcome,
      }
    case 'alphabet':
      return {
        ...task,
        manageAlphabetCompletedAt: state.manageAlphabetCompletedAt,
        manageAlphabetLastOutcome: state.manageAlphabetLastOutcome,
      }
    case 'spelling':
      return {
        ...task,
        manageSpellingCompletedAt: state.manageSpellingCompletedAt,
        manageSpellingLastOutcome: state.manageSpellingLastOutcome,
      }
    case 'watertoiletcheck':
      return {
        ...task,
        manageWaterLevel: state.manageWaterLevel ?? task.manageWaterLevel,
        manageToiletStatus: state.manageToiletStatus ?? task.manageToiletStatus,
        manageWaterToiletCompletedAt:
          state.manageWaterToiletCompletedAt ??
          task.manageWaterToiletCompletedAt,
      }
  }
}

export const mergeTestEphemeral = (
  task: TestRecord,
  state: TaskEphemeralState = {}
): TestWithEphemeral => {
  const merged = mergeTaskEphemeral(task, state)
  if (isTestWithEphemeral(merged)) return merged
  throw new Error(`Expected test task, received ${task.taskType}`)
}

export const removeOptimisticPatchFields = (
  previousOverrides: Record<string, TodoUpdatableFields>,
  todoId: string,
  field: TodoUpdatableFields
) => {
  const existingPatch = previousOverrides[todoId]
  if (!existingPatch) return previousOverrides

  const nextPatch = { ...existingPatch }
  for (const key of todoUpdatableFieldKeys) {
    if (key in field) delete nextPatch[key]
  }

  const next = { ...previousOverrides }
  if (Object.keys(nextPatch).length === 0) {
    delete next[todoId]
  } else {
    next[todoId] = nextPatch
  }
  return next
}

export const useEphemeralExpiry = <T extends { id: string }>(
  enabled: boolean,
  items: T[],
  setEphemeral: Dispatch<SetStateAction<Record<string, TaskEphemeralState>>>,
  getLastActive: (state: TaskEphemeralState) => number | null | undefined
) => {
  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => {
      const now = Date.now()
      setEphemeral((prev) => {
        let next = prev
        for (const item of items) {
          const state = prev[item.id]
          if (!state) continue

          const lastActive = getLastActive(state)
          if (lastActive && now - lastActive >= MANAGE_STATUS_RESET_MS) {
            if (next === prev) next = { ...prev }
            delete next[item.id]
          }
        }
        return next
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [enabled, getLastActive, items, setEphemeral])
}

export const getChoreLastActive = (state: TaskEphemeralState) =>
  state.manageCompletedAt ||
  state.manageDinnerCompletedAt ||
  state.manageMathCompletedAt ||
  state.manageLargeNumbersCompletedAt ||
  state.managePVCompletedAt ||
  state.manageAlphabetCompletedAt ||
  state.manageSpellingCompletedAt ||
  state.manageWaterToiletCompletedAt

export const getTestLastActive = (state: TaskEphemeralState) =>
  state.manageMathCompletedAt ||
  state.manageLargeNumbersCompletedAt ||
  state.managePVCompletedAt ||
  state.manageAlphabetCompletedAt ||
  state.manageSpellingCompletedAt

export const todoOutcomePatch = (
  taskType: TaskType,
  completedAt: number | null,
  outcome: TaskOutcome | null
): TodoUpdatableFields => {
  const outcomeField = testOutcomeFieldByType[taskType]
  return outcomeField
    ? { completedAt, [outcomeField]: outcome }
    : { completedAt }
}

export const manageTestOutcomePatch = (
  taskType: TaskType,
  completedAt: number | null,
  outcome: TaskOutcome | null
): Partial<TaskEphemeralState> => {
  const fields = manageOutcomePatchByType[taskType]
  return fields
    ? { [fields.completedAt]: completedAt, [fields.outcome]: outcome }
    : {}
}

export const resetManageChorePatch = (
  taskType: TaskType
): Partial<TaskEphemeralState> => {
  if (taskType === 'watertoiletcheck') {
    return {
      manageWaterLevel: DEFAULT_WATER_LEVEL,
      manageToiletStatus: DEFAULT_TOILET_STATUS,
      manageWaterToiletCompletedAt: null,
    }
  }

  if (taskType === 'standard') return { manageCompletedAt: null }
  return manageTestOutcomePatch(taskType, null, null)
}
