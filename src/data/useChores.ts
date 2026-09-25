// ── Chores subscription + mutations ──

import { useMemo } from 'react'
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { isOfflineEnabled } from '../offline/platform'
import { saveActivityPatch, saveDocument } from '../offline/actions'
import { snapshotDocument } from '../offline/firebaseTransport'
import { parseChoreSnapshot } from '../lib/choreParser'
import { buildChoreDocument, type ChoreDocumentSettings } from './taskDocuments'
import { isScheduledForDay } from '../lib/today'
import { settleOptimisticPatch } from '../lib/optimisticState'
import { filterActiveChildItems, mergeTaskEphemeral } from './dailyTaskState'
import { useChoreActivityActions } from './useChoreActivityActions'
import {
  type ChoreRecord,
  type ChoreType,
  type TaskEphemeralState,
  type TaskUpdatableFields,
} from './types'
import { validateTaskFields } from './taskLimits'
import { useChildTaskCollection } from './useChildTaskCollection'
import { deleteUserDocument } from './useUserDocumentUpdates'

export function useChores() {
  const {
    items: rawChores,
    user,
    activeChildId,
    todayInfo,
    ephemeral,
    setEphemeral,
  } = useChildTaskCollection({
    collectionName: 'chores',
    parseDocument: parseChoreSnapshot,
  })

  const chores = useMemo(
    () =>
      rawChores.map((chore) => mergeTaskEphemeral(chore, ephemeral[chore.id])),
    [ephemeral, rawChores]
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

  const updateEphemeral = (
    taskId: string,
    patch: Partial<TaskEphemeralState>
  ): Promise<void> => {
    if (isOfflineEnabled() && user && activeChildId) {
      const reset = Object.entries(patch).some(
        ([key, value]) => key.endsWith('CompletedAt') && value === null
      )
      return saveActivityPatch(
        user.uid,
        'chores',
        taskId,
        activeChildId,
        patch,
        reset
      ).then(() => {})
    }
    setEphemeral((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...patch },
    }))

    const clearResolvedPatch = () => {
      setEphemeral((prev) => settleOptimisticPatch(prev, taskId, patch))
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
    if (isOfflineEnabled() && user) {
      const settings = Object.fromEntries(
        Object.entries(patch).filter(([key]) => !key.startsWith('manage'))
      )
      await saveDocument(user.uid, 'chores', taskId, 'patch', settings)
      if (activeChildId) {
        const progress = Object.fromEntries(
          Object.entries(patch).filter(([key]) => key.startsWith('manage'))
        )
        if (Object.keys(progress).length)
          await saveActivityPatch(
            user.uid,
            'chores',
            taskId,
            activeChildId,
            progress
          )
      }
      return
    }
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid, 'chores', taskId), patch)
  }

  const createChoreForToday = async (
    choreType: ChoreType,
    settings: ChoreDocumentSettings
  ): Promise<ChoreRecord | undefined> => {
    if (!user || !activeChildId) return
    const document = buildChoreDocument(activeChildId, choreType, settings)
    if (isOfflineEnabled()) {
      const id = crypto.randomUUID()
      const data = { ...document, createdAt: new Date() }
      await saveDocument(user.uid, 'chores', id, 'put', data)
      return parseChoreSnapshot(id, snapshotDocument(data)) ?? undefined
    }
    const docRef = await addDoc(
      collection(db, 'users', user.uid, 'chores'),
      document
    )
    return parseChoreSnapshot(docRef.id, document) ?? undefined
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return
    await deleteUserDocument(user.uid, 'chores', taskId)

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
    updateChoreAndTodayTodoField,
    updateEphemeral,
    createChoreForToday,
    deleteTask,
    ...activityActions,
  }
}
