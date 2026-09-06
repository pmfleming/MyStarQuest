// ── Chores subscription + mutations ──

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { parseChoreSnapshot } from '../lib/choreParser'
import { buildChoreDocument, type ChoreDocumentSettings } from './taskDocuments'
import { isScheduledForDay } from '../lib/today'
import {
  filterActiveChildItems,
  mergeTaskEphemeral,
  useCollectionTitleDrafts,
  useTodayInfo,
} from './dailyTaskState'
import { useChoreActivityActions } from './useChoreActivityActions'
import {
  getManageTaskCompletedAt,
  type ChoreRecord,
  type ChoreType,
  type TaskEphemeralState,
  type TaskUpdatableFields,
} from './types'
import { validateTaskFields } from './taskLimits'
import { mergeOptimisticItems } from '../hooks/useCoalescedDocumentUpdates'
import { useUserDocumentUpdates } from './useUserDocumentUpdates'
import { useChildTaskCollection } from './useChildTaskCollection'

export function useChores() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const todayInfo = useTodayInfo()

  const {
    overrides: optimisticFields,
    queueUpdate: queueTaskField,
    cancelUpdate: cancelTaskFieldUpdate,
    reconcile: reconcileTaskFields,
    persistUpdate: persistTaskField,
  } = useUserDocumentUpdates<TaskUpdatableFields>({
    userId: user?.uid,
    collectionName: 'chores',
    errorMessage: 'Failed to update chore',
  })

  const reconcileActivityState = useCallback((items: ChoreRecord[]) => {
    // Keep optimistic activity changes until the subscription reflects them.
    // A successful write can settle before React receives the new snapshot.
    setEphemeral((previous) => {
      let next = previous
      for (const chore of items) {
        const patch = previous[chore.id]
        if (!patch) continue
        const saved: TaskEphemeralState = chore
        const remaining = { ...patch }
        for (const key of Object.keys(patch) as Array<
          keyof TaskEphemeralState
        >) {
          if (Object.is(saved[key], patch[key])) delete remaining[key]
        }
        if (Object.keys(remaining).length === Object.keys(patch).length)
          continue
        if (next === previous) next = { ...previous }
        if (Object.keys(remaining).length === 0) delete next[chore.id]
        else next[chore.id] = remaining
      }
      return next
    })
  }, [])

  const rawChores = useChildTaskCollection({
    userId: user?.uid,
    activeChildId,
    collectionName: 'chores',
    errorMessage: 'Failed to subscribe to chores',
    parseDocument: parseChoreSnapshot,
    clearEphemeral: setEphemeral,
    onItems: reconcileActivityState,
  })

  useEffect(() => {
    reconcileTaskFields(rawChores)
  }, [rawChores, reconcileTaskFields])

  // ── Derived Data ──
  const rawChoreTemplates = useMemo(
    () => mergeOptimisticItems(rawChores, optimisticFields),
    [optimisticFields, rawChores]
  )

  const chores = useMemo(
    () =>
      rawChoreTemplates.map((chore) =>
        mergeTaskEphemeral(chore, ephemeral[chore.id])
      ),
    [ephemeral, rawChoreTemplates]
  )

  const activeChildChores = useMemo(
    () => filterActiveChildItems(chores, activeChildId),
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

    return updateDoc(doc(db, 'users', user.uid, 'chores', taskId), patch).catch(
      (err) => {
        clearResolvedPatch()
        console.error('Failed to update chore state', err)
        throw err
      }
    )
  }

  // ── Generic Mutations ──
  const updateTaskField = (taskId: string, field: TaskUpdatableFields) => {
    validateTaskFields(field)
    queueTaskField(taskId, field)
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

    validateTaskFields(patch)
    await persistTaskField(taskId, patch)
  }

  const {
    drafts: taskTitleDrafts,
    setDraft: setTaskTitleDraft,
    removeDraft: removeTaskTitleDraft,
    commitDraft: commitTaskTitle,
  } = useCollectionTitleDrafts(rawChoreTemplates, (taskId, title) =>
    updateTaskField(taskId, { title })
  )

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
    cancelTaskFieldUpdate(taskId)
    await deleteDoc(doc(db, 'users', user.uid, 'chores', taskId))

    removeTaskTitleDraft(taskId)
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
