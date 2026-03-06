import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
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
  princessChoresIcon,
  princessGiveStarIcon,
  princessHomeIcon,
} from '../assets/themes/princess/assets'

type TaskTemplate = {
  id: string
  title: string
  childId: string
  starValue: number
  taskType: 'standard' | 'eating' | 'math' | 'positional-notation'
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  createdAt?: Date
}

type TodoRecord = {
  id: string
  title: string
  childId: string
  sourceTaskId: string
  starValue: number
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  completedAt: number | null
  createdAt?: Date
}

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

const TodayPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [todos, setTodos] = useState<TodoRecord[]>([])
  const [showAddChooser, setShowAddChooser] = useState(false)
  const [pendingTodoId, setPendingTodoId] = useState<string | null>(null)
  const todayInfo = useMemo(() => getTodayDescriptor(), [])

  useEffect(() => {
    if (!user) {
      setTasks([])
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
              createdAt: data.createdAt?.toDate?.(),
            }
          })
          .sort(sortByCreatedAtThenTitle)

        setTasks(nextTasks)
      }
    )

    return unsubscribe
  }, [user])

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

    const unsubscribe = onSnapshot(todoQuery, (snapshot) => {
      const nextTodos = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            title: data.title ?? '',
            childId: data.childId ?? '',
            sourceTaskId: data.sourceTaskId ?? '',
            starValue: Number(data.starValue ?? 1),
            ...normalizeChoreSchedule(data),
            completedAt: data.completedAt ?? null,
            createdAt: data.createdAt?.toDate?.(),
          }
        })
        .sort(sortByCreatedAtThenTitle)

      setTodos(nextTodos)
    })

    return unsubscribe
  }, [activeChildId, todayInfo.dateKey, user])

  const choresForToday = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.childId === activeChildId &&
          task.title.trim().length > 0 &&
          isScheduledForDay(getScheduleForItem(task), todayInfo.dayType)
      ),
    [activeChildId, tasks, todayInfo.dayType]
  )

  const todoSourceIds = useMemo(
    () => new Set(todos.map((todo) => todo.sourceTaskId)),
    [todos]
  )

  const availableChores = useMemo(
    () => choresForToday.filter((task) => !todoSourceIds.has(task.id)),
    [choresForToday, todoSourceIds]
  )

  const completedCount = todos.filter((todo) =>
    Boolean(todo.completedAt)
  ).length

  const handleAddTodo = async (task: TaskTemplate) => {
    if (!user || !activeChildId || todoSourceIds.has(task.id)) return

    try {
      await addDoc(collection(db, 'users', user.uid, 'todos'), {
        title: task.title,
        childId: activeChildId,
        sourceTaskId: task.id,
        sourceTaskType: task.taskType,
        starValue: task.starValue,
        schoolDayEnabled: task.schoolDayEnabled,
        nonSchoolDayEnabled: task.nonSchoolDayEnabled,
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

  const handleDeleteTodo = async (todoId: string) => {
    if (!user) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'todos', todoId))
    } catch (error) {
      console.error('Failed to delete todo', error)
      alert('Failed to remove that todo. Please try again.')
    }
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
                    <span
                      style={{
                        borderRadius: '999px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        backgroundColor: todo.completedAt
                          ? 'rgba(255, 255, 255, 0.26)'
                          : `${theme.colors.accent}55`,
                      }}
                    >
                      {todo.completedAt ? 'Done' : 'Ready'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold opacity-80">
                    {getScheduleLabel(getScheduleForItem(todo))} chore •{' '}
                    {todo.starValue} {todo.starValue === 1 ? 'star' : 'stars'}
                  </div>
                </div>
              )}
              primaryAction={{
                label: (todo) => (todo.completedAt ? 'Completed' : 'Complete'),
                icon: (todo) =>
                  theme.id === 'princess' ? (
                    <img
                      src={
                        todo.completedAt
                          ? princessActiveIcon
                          : princessGiveStarIcon
                      }
                      alt={todo.completedAt ? 'Completed' : 'Complete'}
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    <span>{todo.completedAt ? '✅' : '⭐'}</span>
                  ),
                onClick: (todo) => handleCompleteTodo(todo),
                disabled: (todo) =>
                  Boolean(todo.completedAt) || pendingTodoId === todo.id,
                variant: 'primary',
              }}
              hideEdit
              onDelete={(todo) => handleDeleteTodo(todo.id)}
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
