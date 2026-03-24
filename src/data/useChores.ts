// ── Unified chores subscription + mutations (Tasks & Todos) ──

import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type UpdateData,
} from 'firebase/firestore'
import { db, functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { awardStars, completeTodoAndAwardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import { getTodayDescriptor } from '../lib/today'
import { parseTaskSnapshot, parseTodoSnapshot } from '../lib/choreParser'
import {
  calculateAwardTaskPatch,
  calculateNextDinnerBiteState,
} from '../lib/choreLogic'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ALPHABET_STARS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_MATH_STARS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_PV_STARS,
  MANAGE_STATUS_RESET_MS,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  isEatingTask,
  isMathTask,
  isPositionalNotationTask,
  isAlphabetTask,
  isEatingTodo,
  isMathTodo,
  isPositionalNotationTodo,
  isAlphabetTodo,
  sortByCreatedAtThenTitle,
  type TaskRecord,
  type TodoRecord,
  type TaskEphemeralState,
  type TaskWithEphemeral,
  type TaskUpdatableFields,
  type TodoUpdatableFields,
  type EatingTodo,
  type EatingTaskWithEphemeral,
} from './types'

export function useChores() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [rawTasks, setRawTasks] = useState<TaskRecord[]>([])
  const [todos, setTodos] = useState<TodoRecord[]>([])
  const [ephemeral, setEphemeral] = useState<
    Record<string, TaskEphemeralState>
  >({})
  const [taskTitleDrafts, setTaskTitleDrafts] = useState<
    Record<string, string>
  >({})
  const [todayInfo, setTodayInfo] = useState(() => getTodayDescriptor())

  // ── Midnight Rollover ──
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayDescriptor()
      if (current.dateKey !== todayInfo.dateKey) {
        setTodayInfo(current)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [todayInfo.dateKey])

  // ── Subscriptions ──
  useEffect(() => {
    if (!user) {
      setRawTasks([])
      setTodos([])
      setEphemeral({})
      return
    }

    // 1. Subscribe to Tasks (templates)
    const taskUnsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'tasks'),
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((doc) => parseTaskSnapshot(doc.id, doc.data()))
          .filter((t): t is TaskRecord => t !== null)
          .sort(sortByCreatedAtThenTitle)

        setRawTasks(nextTasks)
        setTaskTitleDrafts((prev) => {
          const next = { ...prev }
          for (const t of nextTasks) {
            if (!(t.id in next)) next[t.id] = t.title
          }
          return next
        })
      }
    )

    // 2. Subscribe to Today's Todos
    let todoUnsubscribe = () => {}
    if (activeChildId) {
      const todoQuery = query(
        collection(db, 'users', user.uid, 'todos'),
        where('childId', '==', activeChildId),
        where('dateKey', '==', todayInfo.dateKey)
      )
      todoUnsubscribe = onSnapshot(todoQuery, (snapshot) => {
        const nextTodos = snapshot.docs
          .map((doc) =>
            parseTodoSnapshot(doc.id, doc.data(), todayInfo.dateKey)
          )
          .filter((t): t is TodoRecord => t !== null)
          .sort(sortByCreatedAtThenTitle)
        setTodos(nextTodos)
      })
    }

    return () => {
      taskUnsubscribe()
      todoUnsubscribe()
    }
  }, [user, activeChildId, todayInfo.dateKey])

  // ── Derived Data ──
  const tasks = rawTasks.map(
    (t) => ({ ...t, ...ephemeral[t.id] }) as TaskWithEphemeral
  )

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
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', taskId), field)
    } catch (err) {
      console.error('Failed to update task', err)
    }
  }

  const updateTodoField = async (
    todoId: string,
    field: TodoUpdatableFields
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'todos', todoId),
        field as UpdateData<DocumentData>
      )
    } catch (err) {
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
  const createStandardTask = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: '',
      childId: activeChildId,
      category: '',
      taskType: 'standard',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: 1,
      isRepeating: true,
      createdAt: serverTimestamp(),
    })
  }

  const createEatingTask = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Dinner',
      childId: activeChildId,
      category: 'eating',
      taskType: 'eating',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_DINNER_STARS,
      isRepeating: true,
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
      createdAt: serverTimestamp(),
    })
  }

  const createMathTask = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Arithmetic',
      childId: activeChildId,
      category: 'math',
      taskType: 'math',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_MATH_STARS,
      isRepeating: true,
      mathTotalProblems: DEFAULT_MATH_PROBLEMS,
      createdAt: serverTimestamp(),
    })
  }

  const createPVTask = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Positional Notation',
      childId: activeChildId,
      category: 'positional-notation',
      taskType: 'positional-notation',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_PV_STARS,
      isRepeating: true,
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
      createdAt: serverTimestamp(),
    })
  }

  const createAlphabetTask = async () => {
    if (!user || !activeChildId) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: 'Alphabet Match',
      childId: activeChildId,
      category: 'Learning',
      taskType: 'alphabet',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_ALPHABET_STARS,
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
      isRepeating: true,
      createdAt: serverTimestamp(),
    })
  }

  // ── Todo Actions ──
  const addTodo = async (task: TaskRecord) => {
    if (!user || !activeChildId || todoSourceIds.has(task.id)) return
    const base = {
      title: task.title,
      childId: activeChildId,
      sourceTaskId: task.id,
      sourceTaskType: task.taskType,
      starValue: task.starValue,
      schoolDayEnabled: task.schoolDayEnabled,
      nonSchoolDayEnabled: task.nonSchoolDayEnabled,
      autoAdded: false,
      dateKey: todayInfo.dateKey,
      createdAt: serverTimestamp(),
      completedAt: null,
    }

    let taskSpecific: Record<string, unknown> = {}
    if (isEatingTask(task)) {
      taskSpecific = {
        dinnerDurationSeconds: task.dinnerDurationSeconds,
        dinnerRemainingSeconds: task.dinnerDurationSeconds,
        dinnerTotalBites: task.dinnerTotalBites,
        dinnerBitesLeft: task.dinnerTotalBites,
      }
    } else if (isMathTask(task)) {
      taskSpecific = {
        mathTotalProblems: task.mathTotalProblems,
        mathDifficulty: task.mathDifficulty,
        mathLastOutcome: null,
      }
    } else if (isAlphabetTask(task)) {
      taskSpecific = {
        alphabetTotalProblems: task.alphabetTotalProblems,
        alphabetLastOutcome: null,
      }
    } else if (isPositionalNotationTask(task)) {
      taskSpecific = {
        pvTotalProblems: task.pvTotalProblems,
        pvLastOutcome: null,
      }
    }

    await addDoc(collection(db, 'users', user.uid, 'todos'), {
      ...base,
      ...taskSpecific,
    })
  }

  const deleteTodo = async (todoId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'todos', todoId))
  }

  const deleteTask = async (taskId: string) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId))
  }

  // ── Unified Activity Logic (Works for both Task & Todo) ──

  const applyBite = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskType' in item
    let bitesLeft = 0
    let isComplete = false

    if (isTodo) {
      if (isEatingTodo(item)) {
        bitesLeft = item.dinnerBitesLeft
        isComplete = Boolean(item.completedAt)
      }
    } else {
      if (isEatingTask(item)) {
        bitesLeft = getManageDinnerBitesLeft(item)
        isComplete = Boolean(item.manageDinnerCompletedAt)
      }
    }

    const result = calculateNextDinnerBiteState(bitesLeft, isComplete)
    if (!result) return false

    if (isTodo) {
      const todo = item as EatingTodo
      const startedAt = todo.dinnerTimerStartedAt
      const elapsed = startedAt
        ? Math.floor((Date.now() - startedAt) / 1000)
        : 0
      const frozenRemaining = Math.max(0, todo.dinnerRemainingSeconds - elapsed)

      await updateTodoField(todo.id, { dinnerBitesLeft: result.nextBites })
      if (result.isNowComplete) {
        await new Promise((r) => setTimeout(r, 850))
        await completeTodoAndAwardStars({
          userId: user!.uid,
          childId: activeChildId!,
          todoId: todo.id,
          delta: todo.starValue,
          updates: {
            dinnerTimerStartedAt: null,
            dinnerRemainingSeconds: frozenRemaining,
          },
        })
        return true
      }
    } else {
      const task = item as EatingTaskWithEphemeral
      const startedAt = task.manageDinnerTimerStartedAt
      const elapsed = startedAt
        ? Math.floor((Date.now() - startedAt) / 1000)
        : 0
      const frozenRemaining = Math.max(
        0,
        getManageDinnerRemaining(task) - elapsed
      )

      updateEphemeral(task.id, { manageDinnerBitesLeft: result.nextBites })
      if (result.isNowComplete) {
        await new Promise((r) => setTimeout(r, 850))
        updateEphemeral(task.id, {
          manageDinnerCompletedAt: Date.now(),
          manageDinnerTimerStartedAt: null,
          manageDinnerRemainingSeconds: frozenRemaining,
        })
        if (user && activeChildId) {
          await awardStars({
            userId: user.uid,
            childId: activeChildId,
            delta: task.starValue,
          })
        }
        return true
      }
    }
    return false
  }

  const startDinnerTimer = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskType' in item
    const now = Date.now()
    if (isTodo) {
      await updateTodoField(item.id, { dinnerTimerStartedAt: now })
    } else {
      updateEphemeral(item.id, { manageDinnerTimerStartedAt: now })
    }
  }

  const expireDinnerTimer = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskType' in item
    const now = Date.now()
    if (isTodo) {
      await updateTodoField(item.id, {
        dinnerTimerStartedAt: null,
        dinnerRemainingSeconds: 0,
        completedAt: now,
      })
    } else {
      updateEphemeral(item.id, {
        manageDinnerTimerStartedAt: null,
        manageDinnerRemainingSeconds: 0,
        manageDinnerCompletedAt: now,
      })
    }
  }

  const resetDinner = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskType' in item
    if (isTodo) {
      if (isEatingTodo(item)) {
        const todo = item as EatingTodo
        await updateTodoField(todo.id, {
          dinnerTimerStartedAt: null,
          dinnerRemainingSeconds: todo.dinnerDurationSeconds,
          dinnerBitesLeft: todo.dinnerTotalBites,
          completedAt: null,
        })
      }
    } else {
      const task = item as TaskWithEphemeral
      if (isEatingTask(task)) {
        updateEphemeral(task.id, {
          manageDinnerBitesLeft: task.dinnerTotalBites,
          manageDinnerRemainingSeconds: task.dinnerDurationSeconds,
          manageDinnerCompletedAt: null,
          manageDinnerTimerStartedAt: null,
        })
      }
    }
  }

  // ── Generic Completion (Standard & Tests) ──

  const completeChore = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskId' in item
    const now = Date.now()

    if (isTodo) {
      const todo = item as TodoRecord
      if (todo.completedAt) return
      const done = await completeTodoAndAwardStars({
        userId: user!.uid,
        childId: activeChildId!,
        todoId: todo.id,
        delta: todo.starValue,
      })
      if (done) celebrateSuccess()
    } else {
      const task = item as TaskWithEphemeral
      const patch = calculateAwardTaskPatch(task, now)
      updateEphemeral(task.id, patch)
      if (user && activeChildId) {
        await awardStars({
          userId: user.uid,
          childId: activeChildId,
          delta: task.starValue,
        })
        celebrateSuccess()
      }
      if (!task.isRepeating) {
        await deleteTask(task.id)
      }
    }
  }

  const failChore = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskId' in item
    const now = Date.now()
    if (isTodo) {
      const field: TodoUpdatableFields = { completedAt: now }
      if (isMathTodo(item)) field.mathLastOutcome = 'failure'
      else if (isAlphabetTodo(item)) field.alphabetLastOutcome = 'failure'
      else if (isPositionalNotationTodo(item)) field.pvLastOutcome = 'failure'
      await updateTodoField(item.id, field)
    } else {
      const task = item as TaskWithEphemeral
      const patch: Partial<TaskEphemeralState> = {}
      if (isMathTask(task)) {
        patch.manageMathCompletedAt = now
        patch.manageMathLastOutcome = 'failure'
      } else if (isAlphabetTask(task)) {
        patch.manageAlphabetCompletedAt = now
        patch.manageAlphabetLastOutcome = 'failure'
      } else if (isPositionalNotationTask(task)) {
        patch.managePVCompletedAt = now
        patch.managePVLastOutcome = 'failure'
      }
      updateEphemeral(task.id, patch)
    }
  }

  const resetChore = async (item: TaskWithEphemeral | TodoRecord) => {
    const isTodo = 'sourceTaskId' in item
    if (isTodo) {
      const field: TodoUpdatableFields = { completedAt: null }
      if (isMathTodo(item)) field.mathLastOutcome = null
      else if (isAlphabetTodo(item)) field.alphabetLastOutcome = null
      else if (isPositionalNotationTodo(item)) field.pvLastOutcome = null
      await updateTodoField(item.id, field)
    } else {
      const task = item as TaskWithEphemeral
      const patch: Partial<TaskEphemeralState> = {}
      if (isMathTask(task)) {
        patch.manageMathCompletedAt = null
        patch.manageMathLastOutcome = null
      } else if (isAlphabetTask(task)) {
        patch.manageAlphabetCompletedAt = null
        patch.manageAlphabetLastOutcome = null
      } else if (isPositionalNotationTask(task)) {
        patch.managePVCompletedAt = null
        patch.managePVLastOutcome = null
      } else if (task.taskType === 'standard') patch.manageCompletedAt = null
      updateEphemeral(task.id, patch)
    }
  }

  // ── Auto-Reset Timer for Ephemeral State ──
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      const now = Date.now()
      setEphemeral((prev) => {
        let next = prev
        for (const task of rawTasks) {
          const e = prev[task.id]
          if (!e) continue

          const lastActive =
            e.manageCompletedAt ||
            e.manageDinnerCompletedAt ||
            e.manageMathCompletedAt ||
            e.managePVCompletedAt ||
            e.manageAlphabetCompletedAt
          if (lastActive && now - lastActive >= MANAGE_STATUS_RESET_MS) {
            if (next === prev) next = { ...prev }
            const rest = { ...next }
            delete rest[task.id]
            next = rest
          }
        }
        return next
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [rawTasks, user])

  const resetTodayTodos = async () => {
    if (!user || !activeChildId) return
    const callable = httpsCallable(functions, 'resetTodayTodos')
    await callable({ childId: activeChildId })
  }

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
    createMathTask,
    createPVTask,
    createAlphabetTask,
    addTodo,
    deleteTodo,
    deleteTask,
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
    completeChore,
    failChore,
    resetChore,
    resetTodayTodos,
  }
}
