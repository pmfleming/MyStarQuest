import { parseChildScope } from '../sharing/scope'
// Tests subscription + mutations.

import { doc, runTransaction, updateDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo } from 'react'
import { db } from '../firebaseDb'
import { saveActivityPatch, saveDocument } from '../offline/actions'
import { offlineRuntime } from '../offline/runtime'
import { useCoalescedDocumentUpdates } from '../hooks/useCoalescedDocumentUpdates'
import { celebrateSuccess } from '../lib/celebrate'
import { calculateAwardTaskPatch } from '../lib/choreLogic'
import { parseTestSnapshot } from '../lib/choreParser'
import { completeTaskAndAwardStars } from '../lib/starActions'
import {
  mergeOptimisticItems,
  settleOptimisticPatch,
} from '../lib/optimisticState'
import {
  filterActiveChildItems,
  getTestLastActive,
  manageTestOutcomePatch,
  mergeTestEphemeral,
  useEphemeralExpiry,
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
  const {
    items: rawTests,
    user,
    storageKey,
    queued,
    canAdmin,
    activeChildId,
    todayInfo,
    ephemeral,
    setEphemeral,
  } = useChildTaskCollection({
    collectionName: 'tests',
    parseDocument: parseTestSnapshot,
    getPersistedState: getPersistedAttemptState,
  })

  const canManageTests = Boolean(parseChildScope(storageKey))
  const defaultTests = useMemo<TestRecord[]>(() => {
    if (!activeChildId || canManageTests) return []
    return buildDefaultTests(activeChildId)
  }, [activeChildId, canManageTests])

  const persistTestField = useCallback(
    async (testId: string, field: TaskUpdatableFields) => {
      if (!user) return
      const defaultTest = defaultTests.find((test) => test.id === testId)
      if (queued) {
        const runtime = offlineRuntime(storageKey!)
        if (
          defaultTest &&
          !runtime.documents('tests').some((test) => test.id === testId)
        ) {
          await saveDocument(
            storageKey!,
            'tests',
            testId,
            'put',
            buildTestDocument(defaultTest.childId, defaultTest.taskType)
          )
        }
        if ('lastAttemptedAt' in field && activeChildId) {
          await saveActivityPatch(
            storageKey!,
            'tests',
            testId,
            activeChildId,
            field,
            field.lastAttemptedAt === null
          )
        } else await saveDocument(storageKey!, 'tests', testId, 'patch', field)
        return
      }
      const testRef = doc(db, 'users', storageKey!, 'tests', testId)
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
    [activeChildId, defaultTests, user, storageKey, queued]
  )
  const {
    overrides: optimisticFields,
    queueUpdate: queueTestField,
    reconcile: reconcileTestFields,
  } = useCoalescedDocumentUpdates<TaskUpdatableFields>({
    persist: persistTestField,
    delayMs: queued ? 0 : undefined,
    onError: (_testId, _field, error) => {
      console.error('Failed to update test', error)
      if (queued && user) offlineRuntime(storageKey!).report(error)
    },
  })

  useEffect(() => {
    reconcileTestFields(rawTests)
  }, [rawTests, reconcileTestFields])

  const configuredTests = useMemo(() => {
    const defaultSlotTests = defaultTests.map(
      (test) =>
        rawTests.find(
          (saved) =>
            saved.childId === activeChildId && saved.taskType === test.taskType
        ) ?? test
    )
    const defaultSlotIds = new Set(defaultSlotTests.map((test) => test.id))
    const merged = mergeOptimisticItems(
      [
        ...defaultSlotTests,
        ...rawTests.filter((test) => !defaultSlotIds.has(test.id)),
      ],
      optimisticFields
    )
    const consumed =
      queued && user
        ? offlineRuntime(storageKey!).store.getSnapshot()?.consumed
        : undefined
    return consumed
      ? merged.filter((test) => !consumed[`tests/${test.id}`])
      : merged
  }, [
    activeChildId,
    defaultTests,
    optimisticFields,
    rawTests,
    user,
    storageKey,
    queued,
  ])

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
    if (queued && user && activeChildId) {
      void saveActivityPatch(
        storageKey!,
        'tests',
        testId,
        activeChildId,
        patch
      ).catch(offlineRuntime(storageKey!).report)
    }
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
    // Native completion/reset publishes only after the activity and star change
    // are committed together; never save an intermediate 'done' state.
    if (queued) return persist()
    const previousPatch = ephemeral[testId]
    updateEphemeral(testId, patch)
    try {
      return await persist()
    } catch (error) {
      setEphemeral((previous) =>
        settleOptimisticPatch(previous, testId, patch, previousPatch)
      )
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
          ...(queued
            ? manageTestOutcomePatch(item.taskType, attemptedAt, outcome)
            : {}),
          lastAttemptedAt: attemptedAt,
          lastAttemptDateKey: attemptedAt ? todayInfo.dateKey : '',
          lastAttemptOutcome: outcome,
        })
    )
  }

  const completeTest = async (
    item: TestWithEphemeral,
    onAward?: (delta: number, starsBefore?: number) => void
  ) => {
    const now = Date.now()
    const patch = calculateAwardTaskPatch(item, now)
    if (user && activeChildId) {
      const defaultTest = defaultTests.find((test) => test.id === item.id)
      const result = await persistEphemeral(item.id, patch, () =>
        completeTaskAndAwardStars({
          userId: storageKey!,
          childId: activeChildId,
          taskId: item.id,
          taskCollection: 'tests',
          dateKey: todayInfo.dateKey,
          delta: item.starValue,
          updates: {
            ...(queued ? patch : {}),
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
      if (result.appliedDelta > 0) {
        if (onAward) onAward(result.appliedDelta, result.starsBefore)
        else celebrateSuccess()
      }
    } else {
      updateEphemeral(item.id, patch)
    }
  }

  const failTest = (item: TestWithEphemeral) =>
    persistTestAttempt(item, Date.now(), 'failure')

  const resetTest = (item: TestWithEphemeral) => {
    if (!canAdmin)
      return Promise.reject(
        new Error('Only the admin can reset saved progress.')
      )
    return persistTestAttempt(item, null, null)
  }

  useEphemeralExpiry(Boolean(user), rawTests, setEphemeral, getTestLastActive)

  const createTest = async (type: TestType) => {
    if (!storageKey || !activeChildId || !canManageTests) return
    await saveDocument(
      storageKey,
      'tests',
      crypto.randomUUID(),
      'put',
      buildTestDocument(activeChildId, type)
    )
  }
  const deleteTest = async (id: string) => {
    if (!storageKey || !canManageTests) return
    await saveDocument(storageKey, 'tests', id, 'delete')
  }
  return {
    canManageTests,
    createTest,
    deleteTest,
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
