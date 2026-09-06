import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getTodayDescriptor } from '../lib/today'
import {
  DEFAULT_TOILET_STATUS,
  DEFAULT_WATER_LEVEL,
  MANAGE_STATUS_RESET_MS,
  isTestRecord,
  isTestType,
  manageCompletedAtFieldByType,
  manageOutcomeFieldByType,
  type ChoreRecord,
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

const choreEphemeralFields = {
  standard: ['manageCompletedAt'],
  eating: [
    'manageDinnerRemainingSeconds',
    'manageDinnerBitesLeft',
    'manageDinnerTimerStartedAt',
    'manageDinnerCompletedAt',
  ],
  watertoiletcheck: [
    'manageWaterLevel',
    'manageToiletStatus',
    'manageWaterToiletCompletedAt',
  ],
} satisfies {
  [Type in ChoreRecord['taskType']]: (keyof Extract<
    ChoreRecord,
    { taskType: Type }
  > &
    keyof TaskEphemeralState)[]
}

export const mergeTaskEphemeral = (
  task: TaskRecord,
  state: TaskEphemeralState = {}
): TaskWithEphemeral => {
  if (isTestRecord(task)) return mergeTestEphemeral(task, state)
  const saved: TaskEphemeralState = task
  const patch = Object.fromEntries(
    choreEphemeralFields[task.taskType].map((key) => [
      key,
      state[key] !== undefined ? state[key] : saved[key],
    ])
  )
  return { ...task, ...patch }
}

export const mergeTestEphemeral = (
  task: TestRecord,
  state: TaskEphemeralState = {}
): TestWithEphemeral => {
  const completedAt = manageCompletedAtFieldByType[task.taskType]
  const outcome = manageOutcomeFieldByType[task.taskType]
  return {
    ...task,
    [completedAt]: state[completedAt],
    [outcome]: state[outcome],
  }
}

export const reconcileTaskEphemeral = (
  previous: Record<string, TaskEphemeralState>,
  items: Array<{ id: string } & TaskEphemeralState>
) => {
  let next = previous
  for (const item of items) {
    const patch = previous[item.id]
    if (!patch) continue
    const remaining = { ...patch }
    for (const key of Object.keys(patch) as Array<keyof TaskEphemeralState>) {
      if (Object.is(item[key], patch[key])) delete remaining[key]
    }
    if (Object.keys(remaining).length === Object.keys(patch).length) continue
    if (next === previous) next = { ...previous }
    if (Object.keys(remaining).length === 0) delete next[item.id]
    else next[item.id] = remaining
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
  if (!isTestType(taskType)) return {}
  return {
    [manageCompletedAtFieldByType[taskType]]: completedAt,
    [manageOutcomeFieldByType[taskType]]: outcome,
  }
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
