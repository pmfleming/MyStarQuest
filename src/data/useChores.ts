// ── Unified chores subscription + mutations (Tasks & Todos) ──

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
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { parseChoreSnapshot, parseChoreTodoSnapshot } from '../lib/choreParser'
import {
  buildChoreDocument,
  buildChoreTodoDocument,
  type ChoreDocumentSettings,
} from './taskDocuments'
import { isScheduledForDay } from '../lib/today'
import {
  getChoreLastActive,
  mergeTaskEphemeral,
  mergeTodoOverrides,
  pruneResolvedTodoOverrides,
  removeOptimisticPatchFields,
  useEphemeralExpiry,
  useTitleDraftBackfill,
  useTodayInfo,
} from './dailyTaskState'
import { useChoreActivityActions } from './useChoreActivityActions'
import {
  sortByCreatedAtThenTitle,
  type ChoreRecord,
  type ChoreType,
  type TaskEphemeralState,
  type TaskRecord,
  type TaskUpdatableFields,
  type TodoRecord,
  type TodoUpdatableFields,
} from './types'

type StoredTaskRecord = TaskRecord & {
  storageCollection: 'chores' | 'tasks'
}

const withStorageCollection = (
  task: TaskRecord,
  storageCollection: StoredTaskRecord['storageCollection']
): StoredTaskRecord => ({
  ...task,
  storageCollection,
})

const isPermissionDenied = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'permission-denied'

export function useChores() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [rawChoreTasks, setRawChoreTasks] = useState<StoredTaskRecord[]>([])
  const [rawLegacyTasks, setRawLegacyTasks] = useState<StoredTaskRecord[]>([])
  const [rawTodos, setRawTodos] = useState<TodoRecord[]>([])
  const [todoOverrides, setTodoOverrides] = useState<
    Record<string, TodoUpdatableFields>
  >({})
  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const [taskTitleDrafts, setTaskTitleDrafts] = useState<
    Record<string, string>
  >({})
  const todayInfo = useTodayInfo()

  // ── Subscriptions ──
  useEffect(() => {
    if (!user) {
      setRawChoreTasks([])
      setRawLegacyTasks([])
      setRawTodos([])
      setTodoOverrides({})
      setEphemeral({})
      return
    }

    // 1. Subscribe to Chores (templates)
    const choreUnsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'chores'),
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((doc) => parseChoreSnapshot(doc.id, doc.data()))
          .filter((t): t is NonNullable<typeof t> => t !== null)
          .map((task) => withStorageCollection(task, 'chores'))
          .sort(sortByCreatedAtThenTitle)

        setRawChoreTasks(nextTasks)
      },
      (error) => {
        console.error('Failed to subscribe to chores', error)
        setRawChoreTasks([])
      }
    )

    // Compatibility: old deployed rules may still only permit the legacy tasks collection.
    const legacyTaskUnsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'tasks'),
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((doc) => parseChoreSnapshot(doc.id, doc.data()))
          .filter((t): t is NonNullable<typeof t> => t !== null)
          .map((task) => withStorageCollection(task, 'tasks'))
          .sort(sortByCreatedAtThenTitle)

        setRawLegacyTasks(nextTasks)
      },
      (error) => {
        console.error('Failed to subscribe to legacy chore tasks', error)
        setRawLegacyTasks([])
      }
    )

    // 2. Subscribe to Today's Chore Todos
    let todoUnsubscribe = () => {}
    if (activeChildId) {
      const todoQuery = query(
        collection(db, 'users', user.uid, 'choreTodos'),
        where('childId', '==', activeChildId),
        where('dateKey', '==', todayInfo.dateKey)
      )
      todoUnsubscribe = onSnapshot(
        todoQuery,
        (snapshot) => {
          const nextTodos = snapshot.docs
            .map((doc) =>
              parseChoreTodoSnapshot(doc.id, doc.data(), todayInfo.dateKey)
            )
            .filter((t): t is NonNullable<typeof t> => t !== null)
            .sort(sortByCreatedAtThenTitle)
          setRawTodos(nextTodos)
          setTodoOverrides((prev) =>
            pruneResolvedTodoOverrides(prev, nextTodos)
          )
        },
        (error) => {
          console.error('Failed to subscribe to chore todos', error)
          setRawTodos([])
          setTodoOverrides({})
        }
      )
    }

    return () => {
      choreUnsubscribe()
      legacyTaskUnsubscribe()
      todoUnsubscribe()
    }
  }, [user, activeChildId, todayInfo.dateKey])

  // ── Derived Data ──
  const rawTasks = useMemo(() => {
    const choreIds = new Set(rawChoreTasks.map((task) => task.id))
    return [
      ...rawChoreTasks,
      ...rawLegacyTasks.filter((task) => !choreIds.has(task.id)),
    ].sort(sortByCreatedAtThenTitle)
  }, [rawChoreTasks, rawLegacyTasks])

  useTitleDraftBackfill(rawTasks, setTaskTitleDrafts)

  const tasks = rawTasks.map((task) =>
    mergeTaskEphemeral(task, ephemeral[task.id])
  )

  const todos = mergeTodoOverrides(rawTodos, todoOverrides)

  const activeChildTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.childId === activeChildId && t.title.trim().length > 0
      ),
    [tasks, activeChildId]
  )

  const todoSourceIds = useMemo(
    () => new Set(todos.map((t) => t.sourceTaskId)),
    [todos]
  )

  const availableChores = useMemo(
    () => activeChildTasks.filter((t) => !todoSourceIds.has(t.id)),
    [activeChildTasks, todoSourceIds]
  )

  const completedTodoCount = todos.filter((t) => Boolean(t.completedAt)).length

  const getTaskStorageCollection = (taskId: string) =>
    rawTasks.find((task) => task.id === taskId)?.storageCollection ?? 'chores'

  const addChoreDocument = async (data: Record<string, unknown>) => {
    if (!user) return

    try {
      return await addDoc(collection(db, 'users', user.uid, 'chores'), data)
    } catch (error) {
      if (!isPermissionDenied(error)) throw error
      return await addDoc(collection(db, 'users', user.uid, 'tasks'), data)
    }
  }

  // ── Ephemeral State Helpers ──
  const updateEphemeral = (
    taskId: string,
    patch: Partial<TaskEphemeralState>
  ) => {
    setEphemeral((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...patch },
    }))
  }

  // ── Generic Mutations ──
  const updateTaskField = async (
    taskId: string,
    field: TaskUpdatableFields
  ) => {
    if (!user) return
    const storageCollection = getTaskStorageCollection(taskId)
    try {
      await updateDoc(
        doc(db, 'users', user.uid, storageCollection, taskId),
        field
      )
    } catch (err) {
      console.error('Failed to update task', err)
    }
  }

  const updateTodoField = async (
    todoId: string,
    field: TodoUpdatableFields
  ) => {
    if (!user) return
    setTodoOverrides((prev) => ({
      ...prev,
      [todoId]: { ...prev[todoId], ...field },
    }))
    try {
      await updateDoc(doc(db, 'users', user.uid, 'choreTodos', todoId), field)
    } catch (err) {
      setTodoOverrides((prev) =>
        removeOptimisticPatchFields(prev, todoId, field)
      )
      console.error('Failed to update todo', err)
    }
  }

  // ── Title Draft Helpers ──
  const setTaskTitleDraft = (taskId: string, value: string) =>
    setTaskTitleDrafts((prev) => ({ ...prev, [taskId]: value }))

  const commitTaskTitle = (taskId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateTaskField(taskId, { title: trimmed })
    } else {
      const saved = rawTasks.find((t) => t.id === taskId)
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

  // ── Todo Actions ──
  const addTodo = async (task: TaskRecord) => {
    if (!user || !activeChildId || todoSourceIds.has(task.id)) return
    await addDoc(
      collection(db, 'users', user.uid, 'choreTodos'),
      buildChoreTodoDocument(task, activeChildId, todayInfo.dateKey)
    )
  }

  const createChoreForToday = async (
    choreType: ChoreType,
    settings: ChoreDocumentSettings
  ) => {
    if (!user || !activeChildId) return
    const task = await createChoreTask(choreType, settings)
    if (!task || !isScheduledForDay(task, todayInfo.dayType)) return task

    await addDoc(
      collection(db, 'users', user.uid, 'choreTodos'),
      buildChoreTodoDocument(task, activeChildId, todayInfo.dateKey)
    )

    return task
  }

  const deleteTodo = async (todoId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'choreTodos', todoId))
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return
    const storageCollection = getTaskStorageCollection(taskId)
    await deleteDoc(doc(db, 'users', user.uid, storageCollection, taskId))
  }

  // ── Auto-Reset Timer for Ephemeral State ──
  useEphemeralExpiry(Boolean(user), rawTasks, setEphemeral, getChoreLastActive)

  const activityActions = useChoreActivityActions({
    user,
    activeChildId,
    updateTodoField,
    updateEphemeral,
    deleteTask,
  })

  return {
    tasks,
    todos,
    todayInfo,
    availableChores,
    completedTodoCount,
    taskTitleDrafts,
    setTaskTitleDraft,
    commitTaskTitle,
    updateTaskField,
    updateTodoField,
    updateEphemeral,
    createStandardTask,
    createEatingTask,
    createWaterToiletTask,
    createChoreForToday,
    addTodo,
    deleteTodo,
    deleteTask,
    ...activityActions,
  }
}
