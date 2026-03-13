// ── Real-time todo subscription + all daily-todo mutations ──

import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  type DocumentData,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  type UpdateData,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, functions } from '../firebase'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { completeTodoAndAwardStars } from '../lib/starActions'
import { celebrateSuccess } from '../lib/celebrate'
import { getTodayDescriptor, normalizeChoreSchedule } from '../lib/today'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  sortByCreatedAtThenTitle,
  type EatingTodo,
  type MathTodo,
  type PositionalNotationTodo,
  type TaskRecord,
  type TaskType,
  type TodoRecord,
  type TodoUpdatableFields,
} from './types'

export function useTodos() {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()

  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [todos, setTodos] = useState<TodoRecord[]>([])

  // ── Midnight Rollover Fix ──
  // Evaluates the current date and automatically updates if the day changes
  const [todayInfo, setTodayInfo] = useState(() => getTodayDescriptor())

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayDescriptor()
      if (current.dateKey !== todayInfo.dateKey) {
        setTodayInfo(current)
      }
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [todayInfo.dateKey])

  // ── Task template subscription (read-only for Today) ──
  useEffect(() => {
    if (!user) {
      setTasks([])
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'tasks'),
      (snapshot) => {
        const nextTasks: TaskRecord[] = snapshot.docs
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
                    : data.taskType === 'daynight' ||
                        data.category === 'daynight'
                      ? 'daynight'
                      : 'standard'

            const base = {
              id: docSnapshot.id,
              title: data.title ?? '',
              childId: data.childId ?? '',
              category: data.category ?? '',
              isRepeating: data.isRepeating ?? false,
              starValue: Number(data.starValue ?? 1),
              ...normalizeChoreSchedule(data),
              createdAt: data.createdAt?.toDate?.(),
            }

            switch (taskType) {
              case 'eating':
                return {
                  ...base,
                  taskType: 'eating' as const,
                  dinnerDurationSeconds:
                    data.dinnerDurationSeconds ??
                    DEFAULT_DINNER_DURATION_SECONDS,
                  dinnerTotalBites:
                    data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
                }
              case 'math':
                return {
                  ...base,
                  taskType: 'math' as const,
                  mathTotalProblems:
                    data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
                }
              case 'positional-notation':
                return {
                  ...base,
                  taskType: 'positional-notation' as const,
                  pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
                }
              case 'daynight':
                return { ...base, taskType: 'daynight' as const }
              default:
                return { ...base, taskType: 'standard' as const }
            }
          })
          .sort(sortByCreatedAtThenTitle)

        setTasks(nextTasks)
      },
      (error) => {
        console.error('Task snapshot failed', error)
        setTasks([])
      }
    )

    return unsubscribe
  }, [user])

  // ── Today's todos subscription ──
  useEffect(() => {
    if (!user || !activeChildId) {
      setTodos([])
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
            const sourceTaskType: TaskType =
              data.sourceTaskType === 'positional-notation' ||
              data.sourceTaskType === 'math' ||
              data.sourceTaskType === 'eating' ||
              data.sourceTaskType === 'daynight'
                ? data.sourceTaskType
                : 'standard'

            const base = {
              id: docSnapshot.id,
              title: data.title ?? '',
              childId: data.childId ?? '',
              sourceTaskId: data.sourceTaskId ?? '',
              starValue: Number(data.starValue ?? 1),
              ...normalizeChoreSchedule(data),
              autoAdded: data.autoAdded === true,
              completedAt: data.completedAt ?? null,
              createdAt: data.createdAt?.toDate?.(),
            }

            switch (sourceTaskType) {
              case 'eating':
                return {
                  ...base,
                  sourceTaskType: 'eating' as const,
                  dinnerDurationSeconds:
                    data.dinnerDurationSeconds ??
                    DEFAULT_DINNER_DURATION_SECONDS,
                  dinnerRemainingSeconds:
                    data.dinnerRemainingSeconds ??
                    data.dinnerDurationSeconds ??
                    DEFAULT_DINNER_DURATION_SECONDS,
                  dinnerTotalBites:
                    data.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
                  dinnerBitesLeft:
                    data.dinnerBitesLeft ??
                    data.dinnerTotalBites ??
                    DEFAULT_DINNER_BITES,
                  dinnerTimerStartedAt: data.dinnerTimerStartedAt ?? null,
                }
              case 'math':
                return {
                  ...base,
                  sourceTaskType: 'math' as const,
                  mathTotalProblems:
                    data.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
                  mathLastOutcome:
                    data.mathLastOutcome === 'success' ||
                    data.mathLastOutcome === 'failure'
                      ? data.mathLastOutcome
                      : null,
                }
              case 'positional-notation':
                return {
                  ...base,
                  sourceTaskType: 'positional-notation' as const,
                  pvTotalProblems: data.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
                  pvLastOutcome:
                    data.pvLastOutcome === 'success' ||
                    data.pvLastOutcome === 'failure'
                      ? data.pvLastOutcome
                      : null,
                }
              case 'daynight':
                return {
                  ...base,
                  sourceTaskType: 'daynight' as const,
                }
              default:
                return {
                  ...base,
                  sourceTaskType: 'standard' as const,
                }
            }
          })
          .sort(sortByCreatedAtThenTitle)

        setTodos(nextTodos)
      },
      (error) => {
        console.error('Todo snapshot failed', error)
        setTodos([])
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

  const todoSourceIds = useMemo(
    () => new Set(todos.map((todo) => todo.sourceTaskId)),
    [todos]
  )

  const availableChores = useMemo(
    () => choreTemplates.filter((task) => !todoSourceIds.has(task.id)),
    [choreTemplates, todoSourceIds]
  )

  const completedCount = todos.filter((t) => Boolean(t.completedAt)).length

  // ── Field accessors (narrowed to specific todo types) ──
  const getDinnerDuration = (todo: EatingTodo) => todo.dinnerDurationSeconds

  const getDinnerRemaining = (todo: EatingTodo) => todo.dinnerRemainingSeconds

  const getDinnerLiveRemaining = (todo: EatingTodo) => {
    const frozen = getDinnerRemaining(todo)
    const startedAt = todo.dinnerTimerStartedAt
    if (!startedAt) return frozen
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    return Math.max(0, frozen - elapsed)
  }

  const getDinnerTotalBites = (todo: EatingTodo) => todo.dinnerTotalBites

  const getDinnerBitesLeft = (todo: EatingTodo) => todo.dinnerBitesLeft

  const getMathTotalProblems = (todo: MathTodo) => todo.mathTotalProblems

  const getPVTotalProblems = (todo: PositionalNotationTodo) =>
    todo.pvTotalProblems

  // ── Generic field update ──
  const updateTodoFields = async (
    todoId: string,
    field: TodoUpdatableFields
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'todos'), todoId),
        field as UpdateData<DocumentData>
      )
    } catch (error) {
      console.error('Failed to update todo', error)
    }
  }

  // ── Mutations ──
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
    switch (task.taskType) {
      case 'eating':
        taskSpecific = {
          dinnerDurationSeconds:
            task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
          dinnerRemainingSeconds:
            task.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
          dinnerTotalBites: task.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
          dinnerBitesLeft: task.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
        }
        break
      case 'math':
        taskSpecific = {
          mathTotalProblems: task.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
          mathLastOutcome: null,
        }
        break
      case 'positional-notation':
        taskSpecific = {
          pvTotalProblems: task.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
          pvLastOutcome: null,
        }
        break
    }

    await addDoc(collection(db, 'users', user.uid, 'todos'), {
      ...base,
      ...taskSpecific,
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
    await deleteDoc(doc(db, 'users', user.uid, 'todos', todo.id))
  }

  // ── Dinner helpers ──
  const dinnerApplyBite = async (todo: EatingTodo) => {
    const remaining = getDinnerLiveRemaining(todo)
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
        updates: { dinnerTimerStartedAt: null },
      })
      if (completed) celebrateSuccess()
      return true // dinner complete
    }
    return false
  }

  const dinnerStartTimer = async (todo: EatingTodo) => {
    await updateTodoFields(todo.id, {
      dinnerTimerStartedAt: Date.now(),
    })
  }

  const dinnerTimerExpired = async (todo: EatingTodo) => {
    await updateTodoFields(todo.id, {
      dinnerTimerStartedAt: null,
      dinnerRemainingSeconds: 0,
      completedAt: serverTimestamp() as unknown as number,
    })
  }

  const dinnerReset = async (todo: EatingTodo) => {
    await updateTodoFields(todo.id, {
      dinnerTimerStartedAt: null,
      dinnerRemainingSeconds: todo.dinnerDurationSeconds,
      dinnerBitesLeft: todo.dinnerTotalBites,
      completedAt: null,
    })
  }

  // ── Math handlers ──
  const mathComplete = async (todo: MathTodo) => {
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

  const mathFail = async (todo: MathTodo) => {
    await updateTodoFields(todo.id, {
      completedAt: serverTimestamp() as unknown as number,
      mathLastOutcome: 'failure',
    })
  }

  const mathReset = async (todo: MathTodo) => {
    await updateTodoFields(todo.id, {
      completedAt: null,
      mathLastOutcome: null,
    })
  }

  // ── PV handlers ──
  const pvComplete = async (todo: PositionalNotationTodo) => {
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

  const pvFail = async (todo: PositionalNotationTodo) => {
    await updateTodoFields(todo.id, {
      completedAt: serverTimestamp() as unknown as number,
      pvLastOutcome: 'failure',
    })
  }

  const pvReset = async (todo: PositionalNotationTodo) => {
    await updateTodoFields(todo.id, {
      completedAt: null,
      pvLastOutcome: null,
    })
  }

  const resetTodayTodos = async () => {
    if (!user || !activeChildId) return
    const callable = httpsCallable(functions, 'resetTodayTodos')
    await callable({ childId: activeChildId })
  }

  return {
    todos,
    todayInfo,
    choreTemplates,
    availableChores,
    completedCount,
    todoSourceIds,
    // Field accessors
    getDinnerDuration,
    getDinnerLiveRemaining,
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
    dinnerStartTimer,
    dinnerTimerExpired,
    dinnerReset,
    mathComplete,
    mathFail,
    mathReset,
    pvComplete,
    pvFail,
    pvReset,
    resetTodayTodos,
  }
}
