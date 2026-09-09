// Tests subscription + mutations.

import { doc, runTransaction, updateDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { db } from '../firebaseDb'
import {
  mergeOptimisticItems,
  useCoalescedDocumentUpdates,
} from '../hooks/useCoalescedDocumentUpdates'
import { celebrateSuccess } from '../lib/celebrate'
import { calculateAwardTaskPatch } from '../lib/choreLogic'
import { parseTestSnapshot } from '../lib/choreParser'
import { completeTaskAndAwardStars } from '../lib/starActions'
import { getTodayDescriptor } from '../lib/today'
import {
  filterActiveChildItems,
  getTestLastActive,
  manageTestOutcomePatch,
  mergeTestEphemeral,
  reconcileTaskEphemeral,
  useEphemeralExpiry,
  useTodayInfo,
} from './dailyTaskState'
import { buildDefaultTests, buildTestDocument } from './taskDocuments'
import { validateTaskFields } from './taskLimits'
import {
  type TaskEphemeralState,
  type TaskOutcome,
  type TaskUpdatableFields,
  type TestRecord,
  type TestType,
  type TestWithEphemeral,
} from './types'
import { useChildTaskCollection } from './useChildTaskCollection'

const getPersistedAttemptState = (
  test: TestRecord,
  dateKey: string
): Partial<TaskEphemeralState> => {
  if (
    test.lastAttemptDateKey !== dateKey ||
    typeof test.lastAttemptedAt !== 'number'
  ) {
    return manageTestOutcomePatch(test.taskType, null, null)
  }

  return manageTestOutcomePatch(
    test.taskType,
    test.lastAttemptedAt,
    test.lastAttemptOutcome ?? 'success'
  )
}

export function useTests() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const todayInfo = useTodayInfo()

  const defaultTests = useMemo<TestRecord[]>(() => {
    if (!activeChildId) return []
    return buildDefaultTests(activeChildId)
  }, [activeChildId])

  const persistTestField = useCallback(
    async (testId: string, field: TaskUpdatableFields) => {
      if (!user) return
      const defaultTest = defaultTests.find((test) => test.id === testId)
      const testRef = doc(db, 'users', user.uid, 'tests', testId)
      if (defaultTest) {
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(testRef)
          if (snapshot.exists()) {
            transaction.update(testRef, field)
          } else {
            transaction.set(testRef, {
              ...buildTestDocument(defaultTest.childId, defaultTest.taskType),
              ...field,
            })
          }
        })
        return
      }

      await updateDoc(testRef, field)
    },
    [defaultTests, user]
  )
  const {
    overrides: optimisticFields,
    queueUpdate: queueTestField,
    reconcile: reconcileTestFields,
  } = useCoalescedDocumentUpdates<TaskUpdatableFields>({
    persist: persistTestField,
    onError: (_testId, _field, error) => {
      console.error('Failed to update test', error)
    },
  })

  const reconcileAttemptState = useCallback((items: TestRecord[]) => {
    const dateKey = getTodayDescriptor().dateKey
    setEphemeral((previous) =>
      reconcileTaskEphemeral(
        previous,
        items.map((test) => ({
          id: test.id,
          ...getPersistedAttemptState(test, dateKey),
        }))
      )
    )
  }, [])

  const rawTests = useChildTaskCollection({
    userId: user?.uid,
    activeChildId,
    collectionName: 'tests',
    errorMessage: 'Failed to subscribe to tests',
    parseDocument: parseTestSnapshot,
    clearEphemeral: setEphemeral,
    onItems: reconcileAttemptState,
  })

  useEffect(() => {
    reconcileTestFields(rawTests)
  }, [rawTests, reconcileTestFields])

  const configuredTests = useMemo(() => {
    const savedDefaultsByType = new Map<TestType, TestRecord>()
    for (const test of rawTests) {
      if (test.childId !== activeChildId) continue
      if (!savedDefaultsByType.has(test.taskType)) {
        savedDefaultsByType.set(test.taskType, test)
      }
    }

    const defaultSlotTests = defaultTests.map(
      (test) => savedDefaultsByType.get(test.taskType) ?? test
    )
    const defaultSlotIds = new Set(defaultSlotTests.map((test) => test.id))
    return mergeOptimisticItems(
      [
        ...defaultSlotTests,
        ...rawTests.filter((test) => !defaultSlotIds.has(test.id)),
      ],
      optimisticFields
    )
  }, [activeChildId, defaultTests, optimisticFields, rawTests])

  const tests = useMemo(
    () =>
      configuredTests.map((test) =>
        mergeTestEphemeral(test, {
          ...getPersistedAttemptState(test, todayInfo.dateKey),
          ...ephemeral[test.id],
        })
      ),
    [configuredTests, ephemeral, todayInfo.dateKey]
  )

  const activeChildTests = useMemo(
    () => filterActiveChildItems(tests, activeChildId),
    [tests, activeChildId]
  )

  const updateEphemeral = (
    testId: string,
    patch: Partial<TaskEphemeralState>
  ) => {
    setEphemeral((prev) => ({
      ...prev,
      [testId]: { ...prev[testId], ...patch },
    }))
  }

  const updateTestField = (testId: string, field: TaskUpdatableFields) => {
    validateTaskFields(field)
    queueTestField(testId, field)
  }

  const persistEphemeral = async <T>(
    testId: string,
    patch: TaskEphemeralState,
    persist: () => Promise<T>
  ) => {
    const previousPatch = ephemeral[testId]
    updateEphemeral(testId, patch)
    try {
      return await persist()
    } catch (error) {
      setEphemeral((previous) => {
        const current = previous[testId]
        if (!current) return previous
        const remaining = { ...current }
        for (const key of Object.keys(patch) as Array<
          keyof TaskEphemeralState
        >) {
          if (!Object.is(current[key], patch[key])) continue
          delete remaining[key]
          if (previousPatch && key in previousPatch) {
            Object.assign(remaining, { [key]: previousPatch[key] })
          }
        }
        const next = { ...previous }
        if (Object.keys(remaining).length === 0) delete next[testId]
        else next[testId] = remaining
        return next
      })
      throw error
    }
  }

  const persistTestAttempt = async (
    item: TestWithEphemeral,
    attemptedAt: number | null,
    outcome: TaskOutcome | null
  ) => {
    await persistEphemeral(
      item.id,
      manageTestOutcomePatch(item.taskType, attemptedAt, outcome),
      () =>
        persistTestField(item.id, {
          lastAttemptedAt: attemptedAt,
          lastAttemptDateKey: attemptedAt ? todayInfo.dateKey : '',
          lastAttemptOutcome: outcome,
        })
    )
  }

  const completeTest = async (item: TestWithEphemeral) => {
    const now = Date.now()
    const patch = calculateAwardTaskPatch(item, now)
    if (user && activeChildId) {
      const defaultTest = defaultTests.find((test) => test.id === item.id)
      const result = await persistEphemeral(item.id, patch, () =>
        completeTaskAndAwardStars({
          userId: user.uid,
          childId: activeChildId,
          taskId: item.id,
          taskCollection: 'tests',
          dateKey: todayInfo.dateKey,
          delta: item.starValue,
          updates: {
            lastAttemptedAt: now,
            lastAttemptDateKey: todayInfo.dateKey,
            lastAttemptOutcome: 'success',
          },
          initialTaskData: defaultTest
            ? buildTestDocument(defaultTest.childId, defaultTest.taskType)
            : undefined,
          deleteOnComplete: !item.isRepeating,
        })
      )
      if (result.appliedDelta > 0) celebrateSuccess()
    } else {
      updateEphemeral(item.id, patch)
    }
  }

  const failTest = async (item: TestWithEphemeral) => {
    const now = Date.now()
    await persistTestAttempt(item, now, 'failure')
  }

  const resetTest = async (item: TestWithEphemeral) => {
    await persistTestAttempt(item, null, null)
  }

  useEphemeralExpiry(Boolean(user), rawTests, setEphemeral, getTestLastActive)

  return {
    tests,
    todayInfo,
    availableTests: activeChildTests,
    updateTestField,
    updateEphemeral,
    completeTest,
    failTest,
    resetTest,
  }
}
