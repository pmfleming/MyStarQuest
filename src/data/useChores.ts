// ── Chores subscription + mutations ──

import { useCallback, useMemo, useState } from 'react'
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
import { settleOptimisticPatch } from '../lib/optimisticState'
import {
  filterActiveChildItems,
  mergeTaskEphemeral,
  reconcileTaskEphemeral,
  useTodayInfo,
} from './dailyTaskState'
import { useChoreActivityActions } from './useChoreActivityActions'
import {
  type ChoreRecord,
  type ChoreType,
  type TaskEphemeralState,
  type TaskUpdatableFields,
} from './types'
import { validateTaskFields } from './taskLimits'
import { useChildTaskCollection } from './useChildTaskCollection'

export function useChores() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const todayInfo = useTodayInfo()

  const reconcileActivityState = useCallback((items: ChoreRecord[]) => {
    // Keep optimistic activity changes until the subscription reflects them.
    // A successful write can settle before React receives the new snapshot.
    setEphemeral((previous) => reconcileTaskEphemeral(previous, items))
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
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid, 'chores', taskId), patch)
  }

  const createChoreForToday = async (
    choreType: ChoreType,
    settings: ChoreDocumentSettings
  ): Promise<ChoreRecord | undefined> => {
    if (!user || !activeChildId) return
    const document = buildChoreDocument(activeChildId, choreType, settings)
    const docRef = await addDoc(
      collection(db, 'users', user.uid, 'chores'),
      document
    )
    return parseChoreSnapshot(docRef.id, document) ?? undefined
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'chores', taskId))

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
