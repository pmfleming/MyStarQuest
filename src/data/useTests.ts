// Tests subscription + mutations.

import { useCallback, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  setDoc,
  type DocumentData,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { awardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import { parseTestSnapshot } from '../lib/choreParser'
import { calculateAwardTaskPatch } from '../lib/choreLogic'
import { buildDefaultTests, buildTestDocument } from './taskDocuments'
import {
  getTestLastActive,
  manageTestOutcomePatch,
  mergeTestEphemeral,
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
    userId: user?.uid,
    collectionName: 'tests',
    errorMessage: 'Failed to subscribe to tests',
    mapDocument: parseTestDocument,
    normalizeItems: sortTests,
    onClear: clearEphemeral,
  })

  useTitleDraftBackfill(rawTests, setTestTitleDrafts)

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

  const tests = [
    ...defaultSlotTests,
    ...rawTests.filter((test) => !defaultSlotIds.has(test.id)),
  ].map((test) =>
    mergeTestEphemeral(test, {
      ...getPersistedAttemptState(test, todayInfo.dateKey),
      ...ephemeral[test.id],
    })
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

  const updateTestField = async (
    testId: string,
    field: TaskUpdatableFields
  ) => {
    if (!user) return
    const defaultTest = defaultTests.find((test) => test.id === testId)
    try {
      if (defaultTest) {
        await setDoc(doc(db, 'users', user.uid, 'tests', testId), {
          ...buildTestDocument(defaultTest.childId, defaultTest.taskType),
          ...field,
        })
        return
      }

      await updateDoc(doc(db, 'users', user.uid, 'tests', testId), field)
    } catch (err) {
      console.error('Failed to update test', err)
    }
  }

  const setTestTitleDraft = (testId: string, value: string) =>
    setTestTitleDrafts((prev) => ({ ...prev, [testId]: value }))

  const commitTestTitle = (testId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateTestField(testId, { title: trimmed })
    } else {
      const saved = rawTests.find((test) => test.id === testId)
      if (saved) {
        setTestTitleDrafts((prev) => ({ ...prev, [testId]: saved.title }))
      }
    }
  }

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

  const deleteTest = async (testId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'tests', testId))
  }

  const persistTestAttempt = async (
    item: TestWithEphemeral,
    attemptedAt: number | null,
    outcome: TaskOutcome | null
  ) => {
    await updateTestField(item.id, {
      lastAttemptedAt: attemptedAt,
      lastAttemptDateKey: attemptedAt ? todayInfo.dateKey : '',
      lastAttemptOutcome: outcome,
    })
  }

  const completeTest = async (item: TestWithEphemeral) => {
    const now = Date.now()
    const patch = calculateAwardTaskPatch(item, now)
    updateEphemeral(item.id, patch)
    await persistTestAttempt(item, now, 'success')
    if (user && activeChildId) {
      await awardStars({
        userId: user.uid,
        childId: activeChildId,
        delta: item.starValue,
      })
      if (item.starValue > 0) celebrateSuccess()
    }
    if (!item.isRepeating) {
      await deleteTest(item.id)
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
    deleteTest,
    completeTest,
    failTest,
    resetTest,
  }
}
