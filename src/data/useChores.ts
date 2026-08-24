// ── Chores subscription + mutations ──

import { useCallback, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  type DocumentData,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { parseChoreSnapshot } from '../lib/choreParser'
import { buildChoreDocument, type ChoreDocumentSettings } from './taskDocuments'
import { isScheduledForDay } from '../lib/today'
import {
  mergeTaskEphemeral,
  useTitleDraftBackfill,
  useTodayInfo,
} from './dailyTaskState'
import { useChoreActivityActions } from './useChoreActivityActions'
import { useUserCollection } from './useUserCollection'
import {
  sortByCreatedAtThenTitle,
  getManageTaskCompletedAt,
  type ChoreRecord,
  type ChoreType,
  type TaskEphemeralState,
  type TaskUpdatableFields,
} from './types'

export function useChores() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const [taskTitleDrafts, setTaskTitleDrafts] = useState<
    Record<string, string>
  >({})
  const todayInfo = useTodayInfo()

  const parseChoreDocument = useCallback(
    (id: string, data: DocumentData) => parseChoreSnapshot(id, data),
    []
  )
  const sortChores = useCallback(
    (chores: ChoreRecord[]) => [...chores].sort(sortByCreatedAtThenTitle),
    []
  )
  const clearEphemeral = useCallback(() => setEphemeral({}), [])
  const rawChores = useUserCollection({
    userId: activeChildId ? user?.uid : undefined,
    collectionName: 'chores',
    whereEqualToField: 'childId',
    whereEqualToValue: activeChildId ?? undefined,
    errorMessage: 'Failed to subscribe to chores',
    mapDocument: parseChoreDocument,
    normalizeItems: sortChores,
    onClear: clearEphemeral,
  })

  // ── Derived Data ──
  const rawChoreTemplates = rawChores

  useTitleDraftBackfill(rawChoreTemplates, setTaskTitleDrafts)

  const chores = rawChoreTemplates.map((chore) =>
    mergeTaskEphemeral(chore, ephemeral[chore.id])
  )

  const activeChildChores = useMemo(
    () =>
      chores.filter(
        (t) => t.childId === activeChildId && t.title.trim().length > 0
      ),
    [chores, activeChildId]
  )

  const todayChores = useMemo(
    () =>
      activeChildChores.filter((chore) =>
        isScheduledForDay(chore, todayInfo.dayType)
      ),
    [activeChildChores, todayInfo.dayType]
  )

  const availableChores = todayChores
  const completedTodoCount = todayChores.filter((chore) =>
    Boolean(getManageTaskCompletedAt(chore))
  ).length

  const addChoreDocument = async (data: Record<string, unknown>) => {
    if (!user) return
    return await addDoc(collection(db, 'users', user.uid, 'chores'), data)
  }

  // ── Ephemeral State Helpers ──
  const updateEphemeral = (
    taskId: string,
    patch: Partial<TaskEphemeralState>
  ): Promise<void> => {
    setEphemeral((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...patch },
    }))

    const clearResolvedPatch = () => {
      setEphemeral((prev) => {
        const current = prev[taskId]
        if (!current) return prev

        const remaining = { ...current }
        for (const key of Object.keys(patch) as Array<
          keyof TaskEphemeralState
        >) {
          if (remaining[key] === patch[key]) delete remaining[key]
        }

        const next = { ...prev }
        if (Object.keys(remaining).length === 0) delete next[taskId]
        else next[taskId] = remaining
        return next
      })
    }

    if (!user) {
      clearResolvedPatch()
      return Promise.resolve()
    }

    return updateDoc(doc(db, 'users', user.uid, 'chores', taskId), patch)
      .catch((err) => {
        console.error('Failed to update chore state', err)
        throw err
      })
      .finally(clearResolvedPatch)
  }

  // ── Generic Mutations ──
  const updateTaskField = async (
    taskId: string,
    field: TaskUpdatableFields
  ) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid, 'chores', taskId), field)
  }

  const updateChoreAndTodayTodoField = async (
    taskId: string,
    field: TaskUpdatableFields
  ) => {
    const patch: TaskUpdatableFields = { ...field }
    if (typeof field.dinnerDurationSeconds === 'number') {
      patch.manageDinnerRemainingSeconds = field.dinnerDurationSeconds
    }
    if (typeof field.dinnerTotalBites === 'number') {
      patch.manageDinnerBitesLeft = field.dinnerTotalBites
    }

    await updateTaskField(taskId, patch)
  }

  // ── Title Draft Helpers ──
  const setTaskTitleDraft = (taskId: string, value: string) =>
    setTaskTitleDrafts((prev) => ({ ...prev, [taskId]: value }))

  const commitTaskTitle = (taskId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateTaskField(taskId, { title: trimmed })
    } else {
      const saved = rawChoreTemplates.find((t) => t.id === taskId)
      if (saved)
        setTaskTitleDrafts((prev) => ({ ...prev, [taskId]: saved.title }))
    }
  }

  // ── Creation Handlers ──
  const createChoreTask = async (
    choreType: ChoreType,
    settings: ChoreDocumentSettings = {}
  ): Promise<ChoreRecord | undefined> => {
    if (!user || !activeChildId) return
    const document = buildChoreDocument(activeChildId, choreType, settings)
    const docRef = await addChoreDocument(document)
    if (!docRef) return
    return parseChoreSnapshot(docRef.id, document) ?? undefined
  }

  const createStandardTask = (settings?: ChoreDocumentSettings) =>
    createChoreTask('standard', settings)
  const createEatingTask = (settings?: ChoreDocumentSettings) =>
    createChoreTask('eating', settings)
  const createWaterToiletTask = (settings?: ChoreDocumentSettings) =>
    createChoreTask('watertoiletcheck', settings)

  const createChoreForToday = async (
    choreType: ChoreType,
    settings: ChoreDocumentSettings
  ) => {
    if (!user || !activeChildId) return
    const task = await createChoreTask(choreType, settings)
    return task
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'chores', taskId))

    setTaskTitleDrafts((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
    setEphemeral((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
  }

  const activityActions = useChoreActivityActions({
    user,
    activeChildId,
    dateKey: todayInfo.dateKey,
    updateEphemeral,
  })

  return {
    chores,
    todos: todayChores,
    todayInfo,
    availableChores,
    completedTodoCount,
    taskTitleDrafts,
    setTaskTitleDraft,
    commitTaskTitle,
    updateTaskField,
    updateChoreAndTodayTodoField,
    updateEphemeral,
    createStandardTask,
    createEatingTask,
    createWaterToiletTask,
    createChoreForToday,
    deleteTask,
    ...activityActions,
  }
}
