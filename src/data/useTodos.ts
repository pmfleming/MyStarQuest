// ── Real-time todo subscription + all daily-todo mutations ──

import { useEffect, useMemo, useRef, useState } from 'react'
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
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { completeTodoAndAwardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'
import {
  getTodayDescriptor,
  isScheduledForDay,
  normalizeChoreSchedule,
  type ChoreSchedule,
} from '../utils/today'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  sortByCreatedAtThenTitle,
  type TaskTemplate,
  type TaskType,
  type TodoRecord,
  type TodoUpdatableFields,
} from './types'

const getScheduleForItem = (item: ChoreSchedule) => ({
  schoolDayEnabled: item.schoolDayEnabled,
  nonSchoolDayEnabled: item.nonSchoolDayEnabled,
})

export function useTodos() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [todos, setTodos] = useState<TodoRecord[]>([])
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [todosLoaded, setTodosLoaded] = useState(false)
  const processedAutoAddIds = useRef(new Set<string>())
  const todayInfo = useMemo(() => getTodayDescriptor(), [])

  // Reset when child or date changes
  useEffect(() => {
    processedAutoAddIds.current.clear()
    setTodosLoaded(false)
  }, [activeChildId, todayInfo.dateKey])

  // ── Task template subscription (read-only for Today) ──
  useEffect(() => {
    if (!user) {
      setTasks([])
      setTasksLoaded(false)
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'tasks'),
      (snapshot) => {
        const nextTasks: TaskTemplate[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data()
            const taskType: TaskType =
              data.taskType === 'positional-notation' ||
              data.category === 'positional-notation'
                ? 'positional-notation'
                : data.taskType === 'math' || data.category === 'math'
                  ? 'math'
                  : data.taskType === 'eating' || data.category === 'eating'
                    ? 'eating'
                    : 'standard'

            return {
              id: docSnapshot.id,
              title: data.title ?? '',
              childId: data.childId ?? '',
              starValue: Number(data.starValue ?? 1),
              taskType,
              ...normalizeChoreSchedule(data),
              dinnerDurationSeconds:
                data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
              dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
              mathTotalProblems:
                data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
              pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
              createdAt: data.createdAt?.toDate?.(),
            }
          })
          .sort(sortByCreatedAtThenTitle)

        setTasks(nextTasks)
        setTasksLoaded(true)
      },
      (error) => {
        console.error('Task snapshot failed', error)
        setTasks([])
        setTasksLoaded(true)
      }
    )

    return unsubscribe
  }, [user])

  // ── Today's todos subscription ──
  useEffect(() => {
    if (!user || !activeChildId) {
      setTodos([])
      setTodosLoaded(false)
      return
    }

    const todoQuery = query(
      collection(db, 'users', user.uid, 'todos'),
      where('childId', '==', activeChildId),
      where('dateKey', '==', todayInfo.dateKey)
    )

    const unsubscribe = onSnapshot(
      todoQuery,
      (snapshot) => {
        const nextTodos: TodoRecord[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data()
            return {
              id: docSnapshot.id,
              title: data.title ?? '',
              childId: data.childId ?? '',
              sourceTaskId: data.sourceTaskId ?? '',
              sourceTaskType:
                data.sourceTaskType === 'positional-notation' ||
                data.sourceTaskType === 'math' ||
                data.sourceTaskType === 'eating'
                  ? data.sourceTaskType
                  : 'standard',
              starValue: Number(data.starValue ?? 1),
              ...normalizeChoreSchedule(data),
              autoAdded: data.autoAdded === true,
              completedAt: data.completedAt ?? null,
              dinnerDurationSeconds:
                data.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
              dinnerRemainingSeconds:
                data.dinnerRemainingSeconds ??
                data.dinnerDurationSeconds ??
                DEFAULT_DINNER_DURATION_SECONDS,
              dinnerTotalBites: data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
              dinnerBitesLeft:
                data.dinnerBitesLeft ??
                data.dinnerTotalBites ??
                DEFAULT_DINNER_BITES,
              mathTotalProblems:
                data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
              mathLastOutcome:
                data.mathLastOutcome === 'success' ||
                data.mathLastOutcome === 'failure'
                  ? data.mathLastOutcome
                  : null,
              pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
              pvLastOutcome:
                data.pvLastOutcome === 'success' ||
                data.pvLastOutcome === 'failure'
                  ? data.pvLastOutcome
                  : null,
              createdAt: data.createdAt?.toDate?.(),
            }
          })
          .sort(sortByCreatedAtThenTitle)

        setTodos(nextTodos)
        setTodosLoaded(true)
      },
      (error) => {
        console.error('Todo snapshot failed', error)
        setTodos([])
        setTodosLoaded(true)
      }
    )

    return unsubscribe
  }, [activeChildId, todayInfo.dateKey, user])

  // ── Derived data ──
  const choreTemplates = useMemo(
    () =>
      tasks.filter(
        (task) => task.childId === activeChildId && task.title.trim().length > 0
      ),
    [activeChildId, tasks]
  )

  const taskById = useMemo(
    () => new Map(choreTemplates.map((task) => [task.id, task])),
    [choreTemplates]
  )

  const choresForToday = useMemo(
    () =>
      choreTemplates.filter((task) =>
        isScheduledForDay(getScheduleForItem(task), todayInfo.dayType)
      ),
    [choreTemplates, todayInfo.dayType]
  )

  const todoSourceIds = useMemo(
    () => new Set(todos.map((todo) => todo.sourceTaskId)),
    [todos]
  )

  const availableChores = useMemo(
    () =>
      choreTemplates.filter(
        (task) =>
          !todoSourceIds.has(task.id) &&
          !isScheduledForDay(getScheduleForItem(task), todayInfo.dayType)
      ),
    [choreTemplates, todoSourceIds, todayInfo.dayType]
  )

  const completedCount = todos.filter((t) => Boolean(t.completedAt)).length

  // ── Type helpers ──
  const resolveTaskType = (todo: TodoRecord): TaskType =>
    todo.sourceTaskType ??
    taskById.get(todo.sourceTaskId)?.taskType ??
    'standard'

  const isEatingTodo = (todo: TodoRecord) => resolveTaskType(todo) === 'eating'
  const isMathTodo = (todo: TodoRecord) => resolveTaskType(todo) === 'math'
  const isPositionalNotationTodo = (todo: TodoRecord) =>
    resolveTaskType(todo) === 'positional-notation'

  // ── Field accessors ──
  const getDinnerDuration = (todo: TodoRecord) =>
    todo.dinnerDurationSeconds ??
    taskById.get(todo.sourceTaskId)?.dinnerDurationSeconds ??
    DEFAULT_DINNER_DURATION_SECONDS

  const getDinnerRemaining = (todo: TodoRecord) =>
    todo.dinnerRemainingSeconds ?? getDinnerDuration(todo)

  const getDinnerTotalBites = (todo: TodoRecord) =>
    todo.dinnerTotalBites ??
    taskById.get(todo.sourceTaskId)?.dinnerTotalBites ??
    DEFAULT_DINNER_BITES

  const getDinnerBitesLeft = (todo: TodoRecord) =>
    todo.dinnerBitesLeft ?? getDinnerTotalBites(todo)

  const getMathTotalProblems = (todo: TodoRecord) =>
    todo.mathTotalProblems ??
    taskById.get(todo.sourceTaskId)?.mathTotalProblems ??
    DEFAULT_MATH_PROBLEMS

  const getPVTotalProblems = (todo: TodoRecord) =>
    todo.pvTotalProblems ??
    taskById.get(todo.sourceTaskId)?.pvTotalProblems ??
    DEFAULT_PV_PROBLEMS

  // ── Generic field update ──
  const updateTodoFields = async (
    todoId: string,
    field: TodoUpdatableFields
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'todos'), todoId),
        field
      )
    } catch (error) {
      console.error('Failed to update todo', error)
    }
  }

  // ── Auto-add scheduled todos for today ──
  useEffect(() => {
    if (!user || !activeChildId || !tasksLoaded || !todosLoaded) return

    const existingSourceIds = new Set(todos.map((todo) => todo.sourceTaskId))
    const missing = choresForToday.filter(
      (task) =>
        !existingSourceIds.has(task.id) &&
        !processedAutoAddIds.current.has(task.id)
    )

    if (missing.length === 0) return

    for (const task of missing) {
      processedAutoAddIds.current.add(task.id)
    }

    Promise.all(
      missing.map((task) =>
        addDoc(collection(db, 'users', user.uid, 'todos'), {
          title: task.title,
          childId: activeChildId,
          sourceTaskId: task.id,
          sourceTaskType: task.taskType,
          starValue: task.starValue,
          schoolDayEnabled: task.schoolDayEnabled,
          nonSchoolDayEnabled: task.nonSchoolDayEnabled,
          dinnerDurationSeconds: task.dinnerDurationSeconds,
          dinnerRemainingSeconds: task.dinnerDurationSeconds,
          dinnerTotalBites: task.dinnerTotalBites,
          dinnerBitesLeft: task.dinnerTotalBites,
          mathTotalProblems: task.mathTotalProblems,
          mathLastOutcome: null,
          pvTotalProblems: task.pvTotalProblems,
          pvLastOutcome: null,
          autoAdded: true,
          dateKey: todayInfo.dateKey,
          createdAt: serverTimestamp(),
          completedAt: null,
        })
      )
    ).catch((error) => {
      console.error('Failed to auto-add scheduled todos', error)
      for (const task of missing) {
        processedAutoAddIds.current.delete(task.id)
      }
    })
  }, [
    activeChildId,
    choresForToday,
    tasksLoaded,
    todayInfo.dateKey,
    todosLoaded,
    todos,
    user,
  ])

  // ── Mutations ──
  const addTodo = async (task: TaskTemplate) => {
    if (!user || !activeChildId || todoSourceIds.has(task.id)) return
    processedAutoAddIds.current.delete(task.id)
    await addDoc(collection(db, 'users', user.uid, 'todos'), {
      title: task.title,
      childId: activeChildId,
      sourceTaskId: task.id,
      sourceTaskType: task.taskType,
      starValue: task.starValue,
      schoolDayEnabled: task.schoolDayEnabled,
      nonSchoolDayEnabled: task.nonSchoolDayEnabled,
      dinnerDurationSeconds: task.dinnerDurationSeconds,
      dinnerRemainingSeconds: task.dinnerDurationSeconds,
      dinnerTotalBites: task.dinnerTotalBites,
      dinnerBitesLeft: task.dinnerTotalBites,
      mathTotalProblems: task.mathTotalProblems,
      mathLastOutcome: null,
      pvTotalProblems: task.pvTotalProblems,
      pvLastOutcome: null,
      autoAdded: false,
      dateKey: todayInfo.dateKey,
      createdAt: serverTimestamp(),
      completedAt: null,
    })
  }

  const completeTodo = async (todo: TodoRecord) => {
    if (!user || !activeChildId || todo.completedAt) return false
    const completed = await completeTodoAndAwardStars({
      userId: user.uid,
      childId: activeChildId,
      todoId: todo.id,
      delta: todo.starValue,
    })
    if (completed) celebrateSuccess()
    return completed
  }

  const deleteTodo = async (todo: TodoRecord) => {
    if (!user) return
    processedAutoAddIds.current.add(todo.sourceTaskId)
    await deleteDoc(doc(db, 'users', user.uid, 'todos', todo.id))
  }

  // ── Dinner helpers ──
  const dinnerApplyBite = async (todo: TodoRecord) => {
    const remaining = getDinnerRemaining(todo)
    const bitesLeft = getDinnerBitesLeft(todo)
    if (remaining <= 0 || bitesLeft <= 0) return false

    const nextBites = Math.max(0, bitesLeft - 1)
    await updateTodoFields(todo.id, { dinnerBitesLeft: nextBites })

    if (nextBites === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 850))
      const completed = await completeTodoAndAwardStars({
        userId: user!.uid,
        childId: activeChildId!,
        todoId: todo.id,
        delta: todo.starValue,
      })
      if (completed) celebrateSuccess()
      return true // dinner complete
    }
    return false
  }

  const dinnerTickTimer = async (todo: TodoRecord) => {
    const remaining = getDinnerRemaining(todo)
    if (remaining <= 0) return true

    const nextRemaining = Math.max(0, remaining - 1)
    await updateTodoFields(todo.id, {
      dinnerRemainingSeconds: nextRemaining,
      ...(nextRemaining === 0 ? { completedAt: Date.now() } : {}),
    })
    return nextRemaining === 0
  }

  // ── Math handlers ──
  const mathComplete = async (todo: TodoRecord) => {
    if (!user || !activeChildId) return
    const completed = await completeTodoAndAwardStars({
      userId: user.uid,
      childId: activeChildId,
      todoId: todo.id,
      delta: todo.starValue,
      updates: { mathLastOutcome: 'success' },
    })
    if (completed) celebrateSuccess()
  }

  const mathFail = async (todo: TodoRecord) => {
    await updateTodoFields(todo.id, {
      completedAt: Date.now(),
      mathLastOutcome: 'failure',
    })
  }

  // ── PV handlers ──
  const pvComplete = async (todo: TodoRecord) => {
    if (!user || !activeChildId) return
    const completed = await completeTodoAndAwardStars({
      userId: user.uid,
      childId: activeChildId,
      todoId: todo.id,
      delta: todo.starValue,
      updates: { pvLastOutcome: 'success' },
    })
    if (completed) celebrateSuccess()
  }

  const pvFail = async (todo: TodoRecord) => {
    await updateTodoFields(todo.id, {
      completedAt: Date.now(),
      pvLastOutcome: 'failure',
    })
  }

  return {
    todos,
    todayInfo,
    choreTemplates,
    availableChores,
    completedCount,
    todoSourceIds,
    // Type helpers
    isEatingTodo,
    isMathTodo,
    isPositionalNotationTodo,
    // Field accessors
    getDinnerDuration,
    getDinnerRemaining,
    getDinnerTotalBites,
    getDinnerBitesLeft,
    getMathTotalProblems,
    getPVTotalProblems,
    // Mutations
    addTodo,
    completeTodo,
    deleteTodo,
    updateTodoFields,
    dinnerApplyBite,
    dinnerTickTimer,
    mathComplete,
    mathFail,
    pvComplete,
    pvFail,
  }
}
