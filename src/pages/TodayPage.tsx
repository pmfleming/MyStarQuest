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
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import DinnerCountdown, {
  BITE_COOLDOWN_SECONDS,
} from '../components/DinnerCountdown'
import ArithmeticTester from '../components/ArithmeticTester'
import PositionalNotationTester from '../components/PositionalNotationTaskTester'
import { completeTodoAndAwardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'
import {
  CURRENT_DAY_LABELS,
  getScheduleLabel,
  getTodayDescriptor,
  isScheduledForDay,
  normalizeChoreSchedule,
  type ChoreSchedule,
} from '../utils/today'
import { uiTokens } from '../ui/tokens'
import {
  princessActiveIcon,
  princessBiteIcon,
  princessChoresIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessHomeIcon,
  princessMathsCorrectImage,
  princessMathsIcon,
  princessMathsIncorrectImage,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayWinterImage,
  princessPlateImage,
  princessSchoolDayImage,
} from '../assets/themes/princess/assets'

type TaskType = 'standard' | 'eating' | 'math' | 'positional-notation'

type TaskTemplate = {
  id: string
  title: string
  childId: string
  starValue: number
  taskType: TaskType
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  dinnerDurationSeconds?: number
  dinnerTotalBites?: number
  mathTotalProblems?: number
  pvTotalProblems?: number
  createdAt?: Date
}

type TodoRecord = {
  id: string
  title: string
  childId: string
  sourceTaskId: string
  sourceTaskType?: TaskType
  starValue: number
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  autoAdded: boolean
  completedAt: number | null
  dinnerDurationSeconds?: number
  dinnerRemainingSeconds?: number
  dinnerTotalBites?: number
  dinnerBitesLeft?: number
  mathTotalProblems?: number
  mathLastOutcome?: 'success' | 'failure' | null
  pvTotalProblems?: number
  pvLastOutcome?: 'success' | 'failure' | null
  createdAt?: Date
}

const DEFAULT_DINNER_DURATION_SECONDS = 10 * 60
const DEFAULT_DINNER_BITES = 2
const DEFAULT_MATH_PROBLEMS = 5
const DEFAULT_PV_PROBLEMS = 5

const getScheduleForItem = (item: ChoreSchedule) => ({
  schoolDayEnabled: item.schoolDayEnabled,
  nonSchoolDayEnabled: item.nonSchoolDayEnabled,
})

const sortByCreatedAtThenTitle = <
  T extends { createdAt?: Date; title: string },
>(
  left: T,
  right: T
) => {
  const leftTime = left.createdAt?.getTime() ?? 0
  const rightTime = right.createdAt?.getTime() ?? 0
  if (leftTime !== rightTime) {
    return leftTime - rightTime
  }
  return left.title.localeCompare(right.title)
}

const getPrincessNonSchoolDayImage = (
  season: ReturnType<typeof getTodayDescriptor>['season']
) => {
  switch (season) {
    case 'spring':
      return princessNonSchoolDaySpringImage
    case 'summer':
      return princessNonSchoolDaySummerImage
    case 'autumn':
      return princessNonSchoolDayAutumnImage
    case 'winter':
    default:
      return princessNonSchoolDayWinterImage
  }
}

const TodayPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [todos, setTodos] = useState<TodoRecord[]>([])
  const [showAddChooser, setShowAddChooser] = useState(false)
  const [pendingTodoId, setPendingTodoId] = useState<string | null>(null)
  const [tasksLoaded, setTasksLoaded] = useState(false)
  const [todosLoaded, setTodosLoaded] = useState(false)
  const processedAutoAddIds = useRef(new Set<string>())
  const [activeDinnerTodoId, setActiveDinnerTodoId] = useState<string | null>(
    null
  )
  const [activeMathTodoId, setActiveMathTodoId] = useState<string | null>(null)
  const [activePVTodoId, setActivePVTodoId] = useState<string | null>(null)
  const [mathCheckTriggerByTodo, setMathCheckTriggerByTodo] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggerByTodo, setPVCheckTriggerByTodo] = useState<
    Record<string, number>
  >({})
  const [biteCooldownSeconds, setBiteCooldownSeconds] = useState(0)
  const [pendingDinnerBiteTodoId, setPendingDinnerBiteTodoId] = useState<
    string | null
  >(null)
  const todayInfo = useMemo(() => getTodayDescriptor(), [])
  const princessNonSchoolDayImage = getPrincessNonSchoolDayImage(
    todayInfo.season
  )

  useEffect(() => {
    processedAutoAddIds.current.clear()
    setTodosLoaded(false)
    setActiveDinnerTodoId(null)
    setActiveMathTodoId(null)
    setActivePVTodoId(null)
    setMathCheckTriggerByTodo({})
    setPVCheckTriggerByTodo({})
    setBiteCooldownSeconds(0)
    setPendingDinnerBiteTodoId(null)
  }, [activeChildId, todayInfo.dateKey])

  useEffect(() => {
    if (biteCooldownSeconds <= 0) return
    const timer = window.setTimeout(() => {
      setBiteCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [biteCooldownSeconds])

  useEffect(() => {
    if (!activeDinnerTodoId && !pendingDinnerBiteTodoId) {
      setBiteCooldownSeconds(0)
    }
  }, [activeDinnerTodoId, pendingDinnerBiteTodoId])

  useEffect(() => {
    if (!user) {
      setTasks([])
      setTasksLoaded(false)
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'tasks'),
      (snapshot) => {
        const nextTasks = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data()
            const taskType: TaskTemplate['taskType'] =
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
        const nextTodos = snapshot.docs
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

  const resolveTaskType = (todo: TodoRecord): TaskType =>
    todo.sourceTaskType ??
    taskById.get(todo.sourceTaskId)?.taskType ??
    'standard'

  const isEatingTodo = (todo: TodoRecord) => resolveTaskType(todo) === 'eating'
  const isMathTodo = (todo: TodoRecord) => resolveTaskType(todo) === 'math'
  const isPositionalNotationTodo = (todo: TodoRecord) =>
    resolveTaskType(todo) === 'positional-notation'

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

  const updateTodoFields = async (
    todoId: string,
    field: Partial<
      Pick<
        TodoRecord,
        | 'completedAt'
        | 'dinnerRemainingSeconds'
        | 'dinnerBitesLeft'
        | 'mathLastOutcome'
        | 'pvLastOutcome'
      >
    >
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

  useEffect(() => {
    if (
      !pendingDinnerBiteTodoId ||
      biteCooldownSeconds > 0 ||
      !user ||
      !activeChildId
    ) {
      return
    }

    const applyBiteAfterCooldown = async () => {
      const todo = todos.find((item) => item.id === pendingDinnerBiteTodoId)
      setPendingDinnerBiteTodoId(null)

      if (!todo || !isEatingTodo(todo) || todo.completedAt) return

      const remaining = getDinnerRemaining(todo)
      const bitesLeft = getDinnerBitesLeft(todo)
      if (remaining <= 0 || bitesLeft <= 0) return

      const nextBites = Math.max(0, bitesLeft - 1)
      await updateTodoFields(todo.id, { dinnerBitesLeft: nextBites })

      if (nextBites === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 850))
        try {
          const completed = await completeTodoAndAwardStars({
            userId: user.uid,
            childId: activeChildId,
            todoId: todo.id,
            delta: todo.starValue,
          })

          if (completed) {
            celebrateSuccess()
          }
        } catch (error) {
          console.error('Failed to finish dinner todo', error)
          alert('Failed to finish that chore. Please try again.')
        }
        setActiveDinnerTodoId(null)
      }
    }

    applyBiteAfterCooldown()
  }, [activeChildId, biteCooldownSeconds, pendingDinnerBiteTodoId, todos, user])

  useEffect(() => {
    if (!user || !activeDinnerTodoId) return

    const timer = window.setInterval(async () => {
      const todo = todos.find((item) => item.id === activeDinnerTodoId)
      if (!todo || !isEatingTodo(todo) || todo.completedAt) {
        setActiveDinnerTodoId(null)
        return
      }

      const remaining = getDinnerRemaining(todo)
      const bitesLeft = getDinnerBitesLeft(todo)

      if (remaining <= 0 || bitesLeft <= 0) {
        setActiveDinnerTodoId(null)
        return
      }

      const nextRemaining = Math.max(0, remaining - 1)
      await updateTodoFields(todo.id, {
        dinnerRemainingSeconds: nextRemaining,
        ...(nextRemaining === 0 ? { completedAt: Date.now() } : {}),
      })

      if (nextRemaining === 0) {
        setActiveDinnerTodoId(null)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [activeDinnerTodoId, todos, user])

  const completedCount = todos.filter((todo) =>
    Boolean(todo.completedAt)
  ).length

  const handleAddTodo = async (task: TaskTemplate) => {
    if (!user || !activeChildId || todoSourceIds.has(task.id)) return

    try {
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
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to add todo', error)
      alert('Failed to add that todo. Please try again.')
    }
  }

  const handleCompleteTodo = async (todo: TodoRecord) => {
    if (!user || !activeChildId || todo.completedAt || pendingTodoId) return

    setPendingTodoId(todo.id)
    try {
      const completed = await completeTodoAndAwardStars({
        userId: user.uid,
        childId: activeChildId,
        todoId: todo.id,
        delta: todo.starValue,
      })

      if (completed) {
        celebrateSuccess()
      }
    } catch (error) {
      console.error('Failed to complete todo', error)
      alert('Failed to complete that todo. Please try again.')
    } finally {
      setPendingTodoId(null)
    }
  }

  const handleDeleteTodo = async (todo: TodoRecord) => {
    if (!user) return

    try {
      if (activeDinnerTodoId === todo.id) {
        setActiveDinnerTodoId(null)
      }
      if (activeMathTodoId === todo.id) {
        setActiveMathTodoId(null)
      }
      if (activePVTodoId === todo.id) {
        setActivePVTodoId(null)
      }
      if (pendingDinnerBiteTodoId === todo.id) {
        setPendingDinnerBiteTodoId(null)
      }
      processedAutoAddIds.current.add(todo.sourceTaskId)

      await deleteDoc(doc(db, 'users', user.uid, 'todos', todo.id))
    } catch (error) {
      console.error('Failed to delete todo', error)
      alert('Failed to remove that todo. Please try again.')
    }
  }

  const handleDinnerBite = async (todo: TodoRecord) => {
    if (!isEatingTodo(todo) || todo.completedAt) return
    if (biteCooldownSeconds > 0 || pendingDinnerBiteTodoId) return

    const bitesLeft = getDinnerBitesLeft(todo)
    if (bitesLeft <= 0) return

    setPendingDinnerBiteTodoId(todo.id)
    setBiteCooldownSeconds(BITE_COOLDOWN_SECONDS)
  }

  const handleMathComplete = async (todo: TodoRecord) => {
    if (!user || !activeChildId) return

    setActiveMathTodoId(null)
    try {
      const completed = await completeTodoAndAwardStars({
        userId: user.uid,
        childId: activeChildId,
        todoId: todo.id,
        delta: todo.starValue,
        updates: { mathLastOutcome: 'success' },
      })

      if (completed) {
        celebrateSuccess()
      }
    } catch (error) {
      console.error('Failed to complete arithmetic todo', error)
      alert('Failed to finish that chore. Please try again.')
    }
  }

  const handleMathFail = async (todo: TodoRecord) => {
    setActiveMathTodoId(null)
    await updateTodoFields(todo.id, {
      completedAt: Date.now(),
      mathLastOutcome: 'failure',
    })
  }

  const handlePVComplete = async (todo: TodoRecord) => {
    if (!user || !activeChildId) return

    setActivePVTodoId(null)
    try {
      const completed = await completeTodoAndAwardStars({
        userId: user.uid,
        childId: activeChildId,
        todoId: todo.id,
        delta: todo.starValue,
        updates: { pvLastOutcome: 'success' },
      })

      if (completed) {
        celebrateSuccess()
      }
    } catch (error) {
      console.error('Failed to complete place-value todo', error)
      alert('Failed to finish that chore. Please try again.')
    }
  }

  const handlePVFail = async (todo: TodoRecord) => {
    setActivePVTodoId(null)
    await updateTodoFields(todo.id, {
      completedAt: Date.now(),
      pvLastOutcome: 'failure',
    })
  }

  const summaryText =
    todos.length === 0
      ? 'No todos planned for today yet.'
      : `${completedCount} of ${todos.length} completed.`

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Today"
        fontFamily={theme.fonts.heading}
        right={
          <>
            <TopIconButton
              theme={theme}
              to="/settings/manage-tasks"
              ariaLabel="Chores"
              icon={
                theme.id === 'princess' ? (
                  <img
                    src={princessChoresIcon}
                    alt="Chores"
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-2xl">🧹</span>
                )
              }
            />
            <TopIconButton
              theme={theme}
              to="/"
              ariaLabel="Home"
              icon={
                theme.id === 'princess' ? (
                  <img
                    src={princessHomeIcon}
                    alt="Home"
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-2xl">🏠</span>
                )
              }
            />
          </>
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto flex w-full flex-col"
          style={{
            maxWidth: `${uiTokens.contentMaxWidth}px`,
            gap: `${uiTokens.singleVerticalSpace}px`,
          }}
        >
          <section
            style={{
              borderRadius: '28px',
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              color: theme.id === 'space' ? '#000' : '#fff',
              padding: '24px',
              boxShadow: `0 10px 30px ${theme.colors.primary}33`,
            }}
          >
            <div className="text-sm font-bold tracking-[0.2em] uppercase opacity-80">
              {CURRENT_DAY_LABELS[todayInfo.dayType]}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: '1.9rem',
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: '8px',
              }}
            >
              {todayInfo.dayName}
            </div>
            <div className="mt-2 text-lg font-semibold">
              {todayInfo.formattedDate}
            </div>
            <div className="mt-4 text-base font-semibold opacity-90">
              {summaryText}
            </div>
          </section>

          {!activeChildId ? (
            <div className="mt-10 flex flex-col items-center text-center opacity-70">
              <span className="mb-4 text-6xl">👶</span>
              <p className="text-2xl font-bold">
                Pick a child before planning today.
              </p>
            </div>
          ) : (
            <StandardActionList
              theme={theme}
              items={todos}
              getKey={(todo) => todo.id}
              getStarCount={(todo) => todo.starValue}
              isHighlighted={(todo) => Boolean(todo.completedAt)}
              renderItem={(todo) => (
                <div
                  className="flex flex-col"
                  style={{
                    gap: `${Math.max(12, uiTokens.singleVerticalSpace / 2)}px`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        lineHeight: 1.2,
                      }}
                    >
                      {todo.title}
                    </div>

                    <div className="flex items-center gap-3">
                      {todo.schoolDayEnabled && (
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            minWidth: '60px',
                            borderRadius: '20px',
                            border: `2px solid ${theme.colors.primary}`,
                            background: theme.colors.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                          }}
                        >
                          {theme.id === 'princess' ? (
                            <img
                              src={princessSchoolDayImage}
                              alt="Schoolday"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🏫</span>
                          )}
                        </div>
                      )}

                      {todo.nonSchoolDayEnabled && (
                        <div
                          style={{
                            width: '60px',
                            height: '60px',
                            minWidth: '60px',
                            borderRadius: '20px',
                            border: `2px solid ${theme.colors.primary}`,
                            background: theme.colors.surface,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                          }}
                        >
                          {theme.id === 'princess' ? (
                            <img
                              src={princessNonSchoolDayImage}
                              alt="Non-school day"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🌤️</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEatingTodo(todo) &&
                  (activeDinnerTodoId === todo.id ||
                    Boolean(todo.completedAt)) ? (
                    <DinnerCountdown
                      theme={theme}
                      duration={getDinnerDuration(todo)}
                      remaining={getDinnerRemaining(todo)}
                      totalBites={getDinnerTotalBites(todo)}
                      bitesLeft={getDinnerBitesLeft(todo)}
                      starReward={todo.starValue}
                      isTimerRunning={activeDinnerTodoId === todo.id}
                      plateImage={
                        theme.id === 'princess' ? princessPlateImage : undefined
                      }
                      onAdjustTime={() => undefined}
                      onAdjustBites={() => undefined}
                      onStarsChange={() => undefined}
                      isCompleted={Boolean(todo.completedAt)}
                      completionImage={
                        theme.id === 'princess'
                          ? princessEatingFullImage
                          : undefined
                      }
                      failureImage={
                        theme.id === 'princess'
                          ? princessEatingFailImage
                          : undefined
                      }
                      biteCooldownSeconds={biteCooldownSeconds}
                      biteIcon={
                        theme.id === 'princess' ? princessBiteIcon : undefined
                      }
                    />
                  ) : null}

                  {isMathTodo(todo) &&
                  (activeMathTodoId === todo.id ||
                    Boolean(todo.completedAt)) ? (
                    <ArithmeticTester
                      theme={theme}
                      totalProblems={getMathTotalProblems(todo)}
                      starReward={todo.starValue}
                      isRunning={activeMathTodoId === todo.id}
                      isCompleted={Boolean(todo.completedAt)}
                      isFailed={todo.mathLastOutcome === 'failure'}
                      onAdjustProblems={() => undefined}
                      onStarsChange={() => undefined}
                      onComplete={() => handleMathComplete(todo)}
                      onFail={() => handleMathFail(todo)}
                      checkTrigger={mathCheckTriggerByTodo[todo.id] ?? 0}
                      completionImage={
                        theme.id === 'princess'
                          ? princessMathsCorrectImage
                          : undefined
                      }
                      failureImage={
                        theme.id === 'princess'
                          ? princessMathsIncorrectImage
                          : undefined
                      }
                    />
                  ) : null}

                  {isPositionalNotationTodo(todo) &&
                  (activePVTodoId === todo.id || Boolean(todo.completedAt)) ? (
                    <PositionalNotationTester
                      theme={theme}
                      totalProblems={getPVTotalProblems(todo)}
                      starReward={todo.starValue}
                      isRunning={activePVTodoId === todo.id}
                      isCompleted={Boolean(todo.completedAt)}
                      isFailed={todo.pvLastOutcome === 'failure'}
                      onAdjustProblems={() => undefined}
                      onStarsChange={() => undefined}
                      onComplete={() => handlePVComplete(todo)}
                      onFail={() => handlePVFail(todo)}
                      checkTrigger={pvCheckTriggerByTodo[todo.id] ?? 0}
                      completionImage={
                        theme.id === 'princess'
                          ? princessMathsCorrectImage
                          : undefined
                      }
                      failureImage={
                        theme.id === 'princess'
                          ? princessMathsIncorrectImage
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              )}
              primaryAction={{
                label: () => 'Open chore',
                icon: (todo) => {
                  if (theme.id !== 'princess') {
                    if (todo.completedAt) return <span>✅</span>
                    if (isEatingTodo(todo)) return <span>🍽️</span>
                    if (isMathTodo(todo) || isPositionalNotationTodo(todo)) {
                      return <span>🔢</span>
                    }
                    return <span>⭐</span>
                  }

                  const iconSrc = todo.completedAt
                    ? princessActiveIcon
                    : isEatingTodo(todo)
                      ? princessBiteIcon
                      : isMathTodo(todo) || isPositionalNotationTodo(todo)
                        ? princessMathsIcon
                        : princessGiveStarIcon

                  return (
                    <img
                      src={iconSrc}
                      alt={todo.completedAt ? 'Completed' : 'Open chore'}
                      className="h-6 w-6 object-contain"
                    />
                  )
                },
                onClick: (todo) => {
                  if (isEatingTodo(todo)) {
                    if (todo.completedAt) return
                    setActiveMathTodoId(null)
                    setActivePVTodoId(null)
                    if (activeDinnerTodoId === todo.id) {
                      handleDinnerBite(todo)
                    } else {
                      setActiveDinnerTodoId(todo.id)
                    }
                    return
                  }

                  if (isMathTodo(todo)) {
                    if (todo.completedAt) return
                    setActiveDinnerTodoId(null)
                    setActivePVTodoId(null)
                    if (activeMathTodoId === todo.id) {
                      setMathCheckTriggerByTodo((prev) => ({
                        ...prev,
                        [todo.id]: (prev[todo.id] ?? 0) + 1,
                      }))
                    } else {
                      setActiveMathTodoId(todo.id)
                    }
                    return
                  }

                  if (isPositionalNotationTodo(todo)) {
                    if (todo.completedAt) return
                    setActiveDinnerTodoId(null)
                    setActiveMathTodoId(null)
                    if (activePVTodoId === todo.id) {
                      setPVCheckTriggerByTodo((prev) => ({
                        ...prev,
                        [todo.id]: (prev[todo.id] ?? 0) + 1,
                      }))
                    } else {
                      setActivePVTodoId(todo.id)
                    }
                    return
                  }

                  handleCompleteTodo(todo)
                },
                disabled: (todo) => {
                  if (todo.completedAt) return true
                  if (isEatingTodo(todo)) {
                    return (
                      pendingTodoId === todo.id ||
                      (activeDinnerTodoId === todo.id &&
                        biteCooldownSeconds > 0)
                    )
                  }
                  if (isMathTodo(todo) || isPositionalNotationTodo(todo)) {
                    return false
                  }
                  return pendingTodoId === todo.id
                },
                variant: 'primary',
                showLabel: () => false,
              }}
              hideEdit
              onDelete={(todo) => handleDeleteTodo(todo)}
              addLabel="Add Todo"
              onAdd={() => setShowAddChooser(true)}
              inlineNewRow={
                showAddChooser ? (
                  <div
                    className="grid grid-cols-1"
                    style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                  >
                    {availableChores.length === 0 ? (
                      <div
                        className="rounded-3xl text-center"
                        style={{
                          border: `2px dashed ${theme.colors.primary}`,
                          padding: '20px',
                          fontWeight: 700,
                        }}
                      >
                        No more chores are available to add today.
                      </div>
                    ) : (
                      availableChores.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          className="whimsical-btn text-left"
                          onClick={() => handleAddTodo(task)}
                          style={{
                            minHeight: `${uiTokens.actionButtonHeight}px`,
                            borderRadius: '20px',
                            border: `3px solid ${theme.colors.accent}`,
                            background: theme.colors.surface,
                            color: theme.colors.text,
                            fontFamily: theme.fonts.heading,
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            padding: '18px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <span>{task.title}</span>
                          <span className="text-sm opacity-75">
                            {getScheduleLabel(getScheduleForItem(task))} •{' '}
                            {task.starValue}{' '}
                            {task.starValue === 1 ? 'star' : 'stars'}
                          </span>
                        </button>
                      ))
                    )}

                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={() => setShowAddChooser(false)}
                      style={{
                        minHeight: '60px',
                        borderRadius: '16px',
                        border: `2px solid ${theme.colors.primary}`,
                        background: 'transparent',
                        color: theme.colors.primary,
                        fontFamily: theme.fonts.body,
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : undefined
              }
              emptyState={
                <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                  No todos for today yet.
                </div>
              }
            />
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default TodayPage
