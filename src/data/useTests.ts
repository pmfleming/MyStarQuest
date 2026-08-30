// Tests subscription + mutations.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  runTransaction,
  type DocumentData,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { completeTaskAndAwardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import { parseTestSnapshot } from '../lib/choreParser'
import { calculateAwardTaskPatch } from '../lib/choreLogic'
import { buildDefaultTests, buildTestDocument } from './taskDocuments'
import {
  commitBoundedDraft,
  getTestLastActive,
  manageTestOutcomePatch,
  mergeTestEphemeral,
  setDraftValue,
  useEphemeralExpiry,
  useTitleDraftBackfill,
  useTodayInfo,
} from './dailyTaskState'
import {
  sortByCreatedAtThenTitle,
  type TaskEphemeralState,
  type TaskOutcome,
  type TaskUpdatableFields,
  type TestRecord,
  type TestType,
  type TestWithEphemeral,
} from './types'
import { useUserCollection } from './useUserCollection'
import { validateTaskFields } from './taskLimits'
import {
  mergeOptimisticItems,
  useCoalescedDocumentUpdates,
} from '../hooks/useCoalescedDocumentUpdates'

const getPersistedAttemptState = (
  test: TestRecord,
  dateKey: string
): Partial<TaskEphemeralState> => {
  if (
    test.lastAttemptDateKey !== dateKey ||
    typeof test.lastAttemptedAt !== 'number'
  ) {
    return {}
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
  const [testTitleDrafts, setTestTitleDrafts] = useState<
    Record<string, string>
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
    cancelUpdate: cancelTestFieldUpdate,
    reconcile: reconcileTestFields,
  } = useCoalescedDocumentUpdates<TaskUpdatableFields>({
    persist: persistTestField,
    onError: (_testId, _field, error) => {
      console.error('Failed to update test', error)
    },
  })

  const parseTestDocument = useCallback(
    (id: string, data: DocumentData) => parseTestSnapshot(id, data),
    []
  )
  const sortTests = useCallback(
    (tests: TestRecord[]) => [...tests].sort(sortByCreatedAtThenTitle),
    []
  )
  const clearEphemeral = useCallback(() => setEphemeral({}), [])
  const rawTests = useUserCollection({
    userId: activeChildId ? user?.uid : undefined,
    collectionName: 'tests',
    whereEqualToField: 'childId',
    whereEqualToValue: activeChildId ?? undefined,
    errorMessage: 'Failed to subscribe to tests',
    mapDocument: parseTestDocument,
    normalizeItems: sortTests,
    onClear: clearEphemeral,
  })

  useEffect(() => {
    reconcileTestFields(rawTests)
  }, [rawTests, reconcileTestFields])

  useTitleDraftBackfill(rawTests, setTestTitleDrafts)

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
    () =>
      tests.filter(
        (test) => test.childId === activeChildId && test.title.trim().length > 0
      ),
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

  const setTestTitleDraft = (testId: string, value: string) =>
    setDraftValue(setTestTitleDrafts, testId, value)

  const commitTestTitle = (testId: string, title: string) =>
    commitBoundedDraft(
      title,
      80,
      rawTests.find((test) => test.id === testId)?.title,
      (nextTitle) => updateTestField(testId, { title: nextTitle }),
      (savedTitle) => setTestTitleDraft(testId, savedTitle)
    )

  const createTest = async (testType: TestType) => {
    if (!user || !activeChildId) return
    await addDoc(
      collection(db, 'users', user.uid, 'tests'),
      buildTestDocument(activeChildId, testType)
    )
  }

  const createMathTest = () => createTest('math')
  const createLargeNumbersTest = () => createTest('large-numbers')
  const createPVTest = () => createTest('positional-notation')
  const createAlphabetTest = () => createTest('alphabet')
  const createSpellingTest = () => createTest('spelling')
  const createAnimalsTest = () => createTest('animals')

  const deleteTest = async (testId: string) => {
    if (!user) return
    cancelTestFieldUpdate(testId)
    await deleteDoc(doc(db, 'users', user.uid, 'tests', testId))
  }

  const persistTestAttempt = async (
    item: TestWithEphemeral,
    attemptedAt: number | null,
    outcome: TaskOutcome | null
  ) => {
    await persistTestField(item.id, {
      lastAttemptedAt: attemptedAt,
      lastAttemptDateKey: attemptedAt ? todayInfo.dateKey : '',
      lastAttemptOutcome: outcome,
    })
  }

  const completeTest = async (item: TestWithEphemeral) => {
    const now = Date.now()
    const patch = calculateAwardTaskPatch(item, now)
    if (user && activeChildId) {
      const defaultTest = defaultTests.find((test) => test.id === item.id)
      const result = await completeTaskAndAwardStars({
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
      updateEphemeral(item.id, patch)
      if (result.appliedDelta > 0) celebrateSuccess()
    } else {
      updateEphemeral(item.id, patch)
    }
  }

  const failTest = async (item: TestWithEphemeral) => {
    const now = Date.now()
    updateEphemeral(
      item.id,
      manageTestOutcomePatch(item.taskType, now, 'failure')
    )
    await persistTestAttempt(item, now, 'failure')
  }

  const resetTest = async (item: TestWithEphemeral) => {
    updateEphemeral(item.id, manageTestOutcomePatch(item.taskType, null, null))
    await persistTestAttempt(item, null, null)
  }

  useEphemeralExpiry(Boolean(user), rawTests, setEphemeral, getTestLastActive)

  return {
    tests,
    todayInfo,
    availableTests: activeChildTests,
    testTitleDrafts,
    setTestTitleDraft,
    commitTestTitle,
    updateTestField,
    updateEphemeral,
    createMathTest,
    createLargeNumbersTest,
    createPVTest,
    createAlphabetTest,
    createSpellingTest,
    createAnimalsTest,
    deleteTest,
    completeTest,
    failTest,
    resetTest,
  }
}
