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
} from './types'

type DraftableItem = {
  id: string
  title: string
}

type ChildTaskItem = DraftableItem & {
  childId: string
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
  animals: {
    completedAt: 'manageAnimalsCompletedAt',
    outcome: 'manageAnimalsLastOutcome',
  },
  'positional-notation': {
    completedAt: 'managePVCompletedAt',
    outcome: 'managePVLastOutcome',
  },
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

const useTitleDraftBackfill = <T extends DraftableItem>(
  items: T[],
  setDrafts: Dispatch<SetStateAction<Record<string, string>>>
) => {
  useEffect(() => {
    setDrafts((prev) => mergeMissingTitleDrafts(prev, items))
  }, [items, setDrafts])
}

export const useCollectionTitleDrafts = <T extends DraftableItem>(
  items: T[],
  onCommit: (id: string, title: string) => void,
  maxLength = 80
) => {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  useTitleDraftBackfill(items, setDrafts)

  const setDraft = (id: string, value: string) =>
    setDraftValue(setDrafts, id, value)
  const removeDraft = (id: string) =>
    setDrafts((previous) => {
      if (!(id in previous)) return previous
      const next = { ...previous }
      delete next[id]
      return next
    })
  const commitDraft = (id: string, value: string) =>
    commitBoundedDraft(
      value,
      maxLength,
      items.find((item) => item.id === id)?.title,
      (title) => onCommit(id, title),
      (title) => setDraft(id, title)
    )

  return { drafts, setDraft, removeDraft, commitDraft }
}

export const filterActiveChildItems = <T extends ChildTaskItem>(
  items: T[],
  activeChildId: string | null
) =>
  items.filter(
    (item) => item.childId === activeChildId && item.title.trim().length > 0
  )

export const setDraftValue = (
  setDrafts: Dispatch<SetStateAction<Record<string, string>>>,
  id: string,
  value: string
) => setDrafts((previous) => ({ ...previous, [id]: value }))

export const commitBoundedDraft = (
  value: string,
  maxLength: number,
  savedValue: string | undefined,
  onCommit: (value: string) => void,
  onRestore: (value: string) => void
) => {
  const trimmed = value.trim()
  if (trimmed.length > 0 && trimmed.length <= maxLength) {
    onCommit(trimmed)
  } else if (savedValue !== undefined) {
    onRestore(savedValue)
  }
}

export const mergeTaskEphemeral = (
  task: TaskRecord,
  state: TaskEphemeralState = {}
): TaskWithEphemeral => {
  switch (task.taskType) {
    case 'standard':
      return {
        ...task,
        manageCompletedAt:
          state.manageCompletedAt !== undefined
            ? state.manageCompletedAt
            : task.manageCompletedAt,
      }
    case 'eating':
      return {
        ...task,
        manageDinnerRemainingSeconds:
          state.manageDinnerRemainingSeconds !== undefined
            ? state.manageDinnerRemainingSeconds
            : task.manageDinnerRemainingSeconds,
        manageDinnerBitesLeft:
          state.manageDinnerBitesLeft !== undefined
            ? state.manageDinnerBitesLeft
            : task.manageDinnerBitesLeft,
        manageDinnerTimerStartedAt:
          state.manageDinnerTimerStartedAt !== undefined
            ? state.manageDinnerTimerStartedAt
            : task.manageDinnerTimerStartedAt,
        manageDinnerCompletedAt:
          state.manageDinnerCompletedAt !== undefined
            ? state.manageDinnerCompletedAt
            : task.manageDinnerCompletedAt,
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
    case 'animals':
      return {
        ...task,
        manageAnimalsCompletedAt: state.manageAnimalsCompletedAt,
        manageAnimalsLastOutcome: state.manageAnimalsLastOutcome,
      }
    case 'watertoiletcheck':
      return {
        ...task,
        manageWaterLevel:
          state.manageWaterLevel !== undefined
            ? state.manageWaterLevel
            : task.manageWaterLevel,
        manageToiletStatus:
          state.manageToiletStatus !== undefined
            ? state.manageToiletStatus
            : task.manageToiletStatus,
        manageWaterToiletCompletedAt:
          state.manageWaterToiletCompletedAt !== undefined
            ? state.manageWaterToiletCompletedAt
            : task.manageWaterToiletCompletedAt,
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

export const getTestLastActive = (state: TaskEphemeralState) =>
  state.manageMathCompletedAt ||
  state.manageLargeNumbersCompletedAt ||
  state.managePVCompletedAt ||
  state.manageAlphabetCompletedAt ||
  state.manageSpellingCompletedAt ||
  state.manageAnimalsCompletedAt

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
