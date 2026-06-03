// ── Tests subscription + mutations (Test templates & daily Test Todos) ──

import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { awardStars, completeTodoAndAwardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import { parseTestSnapshot, parseTestTodoSnapshot } from '../lib/choreParser'
import { calculateAwardTaskPatch } from '../lib/choreLogic'
import {
  buildDefaultTests,
  buildTestDocument,
  buildTestTodoDocument,
} from './taskDocuments'
import {
  getTestLastActive,
  manageTestOutcomePatch,
  mergeTestEphemeral,
  mergeTodoOverrides,
  pruneResolvedTodoOverrides,
  removeOptimisticPatchFields,
  testTodoOutcomePatch,
  useEphemeralExpiry,
  useTitleDraftBackfill,
  useTodayInfo,
} from './dailyTaskState'
import {
  resetTodayTodosResultSchema,
  sortByCreatedAtThenTitle,
  type TaskEphemeralState,
  type TaskUpdatableFields,
  type TestRecord,
  type TestTodoRecord,
  type TestType,
  type TestWithEphemeral,
  type TodoUpdatableFields,
} from './types'

export function useTests() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [rawTests, setRawTests] = useState<TestRecord[]>([])
  const [rawTestTodos, setRawTestTodos] = useState<TestTodoRecord[]>([])
  const [testTodoOverrides, setTestTodoOverrides] = useState<
    Record<string, TodoUpdatableFields>
  >({})
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

  useEffect(() => {
    if (!user) {
      setRawTests([])
      setRawTestTodos([])
      setTestTodoOverrides({})
      setEphemeral({})
      return
    }

    const testUnsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'tests'),
      (snapshot) => {
        const nextTests = snapshot.docs
          .map((doc) => parseTestSnapshot(doc.id, doc.data()))
          .filter((test): test is TestRecord => test !== null)
          .sort(sortByCreatedAtThenTitle)

        setRawTests(nextTests)
      },
      (error) => {
        console.error('Failed to subscribe to tests', error)
        setRawTests([])
      }
    )

    let testTodoUnsubscribe = () => {}
    if (activeChildId) {
      const testTodoQuery = query(
        collection(db, 'users', user.uid, 'testTodos'),
        where('childId', '==', activeChildId),
        where('dateKey', '==', todayInfo.dateKey)
      )
      testTodoUnsubscribe = onSnapshot(
        testTodoQuery,
        (snapshot) => {
          const nextTestTodos = snapshot.docs
            .map((doc) =>
              parseTestTodoSnapshot(doc.id, doc.data(), todayInfo.dateKey)
            )
            .filter((testTodo): testTodo is TestTodoRecord => testTodo !== null)
            .sort(sortByCreatedAtThenTitle)

          setRawTestTodos(nextTestTodos)
          setTestTodoOverrides((prev) =>
            pruneResolvedTodoOverrides(prev, nextTestTodos)
          )
        },
        (error) => {
          console.error('Failed to subscribe to test todos', error)
          setRawTestTodos([])
          setTestTodoOverrides({})
        }
      )
    }

    return () => {
      testUnsubscribe()
      testTodoUnsubscribe()
    }
  }, [user, activeChildId, todayInfo.dateKey])

  useTitleDraftBackfill(rawTests, setTestTitleDrafts)

  const savedTestTypes = new Set(
    rawTests
      .filter((test) => test.childId === activeChildId)
      .map((test) => test.taskType)
  )

  const tests = [
    ...defaultTests.filter((test) => !savedTestTypes.has(test.taskType)),
    ...rawTests,
  ].map((test) => mergeTestEphemeral(test, ephemeral[test.id]))

  const testTodos = mergeTodoOverrides(rawTestTodos, testTodoOverrides)

  const activeChildTests = useMemo(
    () =>
      tests.filter(
        (test) => test.childId === activeChildId && test.title.trim().length > 0
      ),
    [tests, activeChildId]
  )

  const testTodoSourceIds = useMemo(
    () => new Set(testTodos.map((testTodo) => testTodo.sourceTaskId)),
    [testTodos]
  )

  const availableTests = useMemo(
    () => activeChildTests.filter((test) => !testTodoSourceIds.has(test.id)),
    [activeChildTests, testTodoSourceIds]
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
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tests', testId), field)
    } catch (err) {
      console.error('Failed to update test', err)
    }
  }

  const updateTestTodoField = async (
    todoId: string,
    field: TodoUpdatableFields
  ) => {
    if (!user) return
    setTestTodoOverrides((prev) => ({
      ...prev,
      [todoId]: { ...prev[todoId], ...field },
    }))
    try {
      await updateDoc(doc(db, 'users', user.uid, 'testTodos', todoId), field)
    } catch (err) {
      setTestTodoOverrides((prev) =>
        removeOptimisticPatchFields(prev, todoId, field)
      )
      console.error('Failed to update test todo', err)
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
  const createPVTest = () => createTest('positional-notation')
  const createAlphabetTest = () => createTest('alphabet')
  const createSpellingTest = () => createTest('spelling')

  const addTestTodo = async (test: TestRecord) => {
    if (!user || !activeChildId || testTodoSourceIds.has(test.id)) return
    await addDoc(
      collection(db, 'users', user.uid, 'testTodos'),
      buildTestTodoDocument(test, activeChildId, todayInfo.dateKey)
    )
  }

  const deleteTestTodo = async (todoId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'testTodos', todoId))
  }

  const deleteTest = async (testId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'tests', testId))
  }

  const completeTest = async (item: TestWithEphemeral | TestTodoRecord) => {
    const isTodo = 'sourceTaskId' in item
    const now = Date.now()

    if (isTodo) {
      if (!user || !activeChildId) return
      if (item.completedAt) return
      const done = await completeTodoAndAwardStars({
        userId: user.uid,
        childId: activeChildId,
        todoId: item.id,
        delta: item.starValue,
        todoCollection: 'testTodos',
      })
      if (done && item.starValue > 0) celebrateSuccess()
    } else {
      const patch = calculateAwardTaskPatch(item, now)
      updateEphemeral(item.id, patch)
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
  }

  const failTest = async (item: TestWithEphemeral | TestTodoRecord) => {
    const isTodo = 'sourceTaskId' in item
    const now = Date.now()
    if (isTodo) {
      await updateTestTodoField(
        item.id,
        testTodoOutcomePatch(item.sourceTaskType, now, 'failure')
      )
    } else {
      updateEphemeral(
        item.id,
        manageTestOutcomePatch(item.taskType, now, 'failure')
      )
    }
  }

  const resetTest = async (item: TestWithEphemeral | TestTodoRecord) => {
    const isTodo = 'sourceTaskId' in item
    if (isTodo) {
      await updateTestTodoField(
        item.id,
        testTodoOutcomePatch(item.sourceTaskType, null, null)
      )
    } else {
      updateEphemeral(
        item.id,
        manageTestOutcomePatch(item.taskType, null, null)
      )
    }
  }

  useEphemeralExpiry(Boolean(user), rawTests, setEphemeral, getTestLastActive)

  const resetTodayTests = async () => {
    if (!user || !activeChildId) return
    const callable = httpsCallable(functions, 'resetTodayTests')
    const result = await callable({ childId: activeChildId })
    resetTodayTodosResultSchema.parse(result)
  }

  return {
    tests,
    testTodos,
    todayInfo,
    availableTests,
    testTitleDrafts,
    setTestTitleDraft,
    commitTestTitle,
    updateTestField,
    updateTestTodoField,
    updateEphemeral,
    createMathTest,
    createPVTest,
    createAlphabetTest,
    createSpellingTest,
    addTestTodo,
    deleteTestTodo,
    deleteTest,
    completeTest,
    failTest,
    resetTest,
    resetTodayTests,
  }
}
