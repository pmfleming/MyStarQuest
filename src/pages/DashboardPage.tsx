import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import StarInfoBox from '../components/StarInfoBox'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createTodayTodoListRowDescriptor } from '../ui/todayTodoDescriptors'
import { getScheduleLabel, getTodayDescriptor } from '../lib/today'
import { useDinnerActivity } from '../lib/useDinnerActivity'
import { uiTokens } from '../ui/tokens'
import { useChildren } from '../data/useChildren'
import { useTodos } from '../data/useTodos'
import {
  isEatingTodo,
  type EatingTodo,
  type MathTodo,
  type PositionalNotationTodo,
  type TodoRecord,
} from '../data/types'

import {
  princessChildrenIcon,
  princessChoresIcon,
  princessEatingBreakfastIcon,
  princessEatingDinnerIcon,
  princessEatingLunchIcon,
  princessExitIcon,
  princessResetIcon,
} from '../assets/themes/princess/assets'

const getThemeAssets = (themeId: string) => {
  switch (themeId) {
    case 'princess':
      return {
        switchProfileIcon: princessChildrenIcon,
        exitIcon: princessExitIcon,
      }
    case 'space':
    default:
      return {
        switchProfileIcon: null,
        exitIcon: null,
      }
  }
}

const getPrincessMealIconForHour = (hour: number) => {
  if (hour < 10) return princessEatingBreakfastIcon
  if (hour < 16) return princessEatingLunchIcon
  return princessEatingDinnerIcon
}

const DashboardPage = () => {
  const { logout } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const { children } = useChildren()
  const todayInfo = getTodayDescriptor()

  const {
    todos,
    availableChores,
    todoSourceIds,
    getDinnerDuration,
    getDinnerLiveRemaining,
    getDinnerTotalBites,
    getDinnerBitesLeft,
    getMathTotalProblems,
    getPVTotalProblems,
    addTodo,
    completeTodo,
    deleteTodo,
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
  } = useTodos()

  const [showAddChooser, setShowAddChooser] = useState(false)
  const [pendingTodoId, setPendingTodoId] = useState<string | null>(null)
  const [activeMathTodoId, setActiveMathTodoId] = useState<string | null>(null)
  const [activePVTodoId, setActivePVTodoId] = useState<string | null>(null)
  const [mathCheckTriggerByTodo, setMathCheckTriggerByTodo] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggerByTodo, setPVCheckTriggerByTodo] = useState<
    Record<string, number>
  >({})

  const activePrincessMealIcon = getPrincessMealIconForHour(
    new Date().getHours()
  )

  const {
    activeItemId: activeDinnerTodoId,
    biteCooldownSeconds,
    startActivity: startDinnerActivity,
    clearItemState: clearDinnerTodoState,
    isRunning: isDinnerTodoRunning,
    isInActivity: isDinnerTodoInActivity,
    queueBite: queueDinnerBite,
    resetActivity: resetDinnerActivity,
  } = useDinnerActivity<EatingTodo>({
    items: todos.filter(isEatingTodo),
    getId: (todo) => todo.id,
    isCompleted: (todo) => Boolean(todo.completedAt),
    getRemaining: getDinnerLiveRemaining,
    getBitesLeft: getDinnerBitesLeft,
    applyBite: dinnerApplyBite,
    expireTimer: dinnerTimerExpired,
    isPersistedRunning: (todo) => Boolean(todo.dinnerTimerStartedAt),
    resetKeys: [activeChildId, todayInfo.dateKey],
  })

  const selectedChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  useEffect(() => {
    setActiveMathTodoId(null)
    setActivePVTodoId(null)
    setMathCheckTriggerByTodo({})
    setPVCheckTriggerByTodo({})
  }, [activeChildId, todayInfo.dateKey])

  const handleAddTodo = async (task: { id: string }) => {
    if (todoSourceIds.has(task.id)) return
    await addTodo(task as Parameters<typeof addTodo>[0])
    setShowAddChooser(false)
  }

  const handleCompleteTodo = async (todo: TodoRecord) => {
    if (todo.completedAt || pendingTodoId) return

    setPendingTodoId(todo.id)
    try {
      await completeTodo(todo)
    } catch (error) {
      console.error('Failed to complete todo', error)
      alert('Failed to complete that todo. Please try again.')
    } finally {
      setPendingTodoId(null)
    }
  }

  const handleDeleteTodo = async (todo: TodoRecord) => {
    clearDinnerTodoState(todo.id)
    if (activeMathTodoId === todo.id) setActiveMathTodoId(null)
    if (activePVTodoId === todo.id) setActivePVTodoId(null)
    await deleteTodo(todo)
  }

  const handleDinnerReset = async (todo: EatingTodo) => {
    await resetDinnerActivity(todo, dinnerReset)
  }

  const handleDinnerBite = (todo: EatingTodo) => {
    queueDinnerBite(todo)
  }

  const handleMathComplete = async (todo: MathTodo) => {
    setActiveMathTodoId(null)
    await mathComplete(todo)
  }

  const handleMathFail = async (todo: MathTodo) => {
    setActiveMathTodoId(null)
    await mathFail(todo)
  }

  const handleMathReset = async (todo: MathTodo) => {
    setActiveMathTodoId(null)
    await mathReset(todo)
  }

  const handlePVComplete = async (todo: PositionalNotationTodo) => {
    setActivePVTodoId(null)
    await pvComplete(todo)
  }

  const handlePVFail = async (todo: PositionalNotationTodo) => {
    setActivePVTodoId(null)
    await pvFail(todo)
  }

  const handlePVReset = async (todo: PositionalNotationTodo) => {
    setActivePVTodoId(null)
    await pvReset(todo)
  }

  const todoListDescriptor = toStandardActionListDescriptor(
    createTodayTodoListRowDescriptor({
      theme,
      biteCooldownSeconds,
      pendingTodoId,
      activeMathTodoId,
      activePVTodoId,
      mathCheckTriggerByTodo,
      pvCheckTriggerByTodo,
      activePrincessMealIcon,
      isDinnerTodoRunning,
      isDinnerTodoInActivity,
      getDinnerDuration,
      getDinnerLiveRemaining,
      getDinnerTotalBites,
      getDinnerBitesLeft,
      getMathTotalProblems,
      getPVTotalProblems,
      handleDinnerBite,
      dinnerStartTimer,
      handleDinnerReset,
      handleMathComplete,
      handleMathFail,
      handleMathReset,
      handlePVComplete,
      handlePVFail,
      handlePVReset,
      setActiveMathTodoId,
      setActivePVTodoId,
      setMathCheckTriggerByTodo,
      setPVCheckTriggerByTodo,
      activeDinnerTodoId,
      startDinnerActivity,
      clearDinnerTodoState,
      handleCompleteTodo,
      handleDeleteTodo,
    })
  )

  const themeAssets = getThemeAssets(theme.id)

  return (
    <PageShell
      theme={theme}
      activeTabId="dashboard"
      title={selectedChild?.displayName || 'Explorer'}
      headerRight={
        <>
          <TopIconButton
            theme={theme}
            onClick={() => {
              if (activeChildId) resetTodayTodos()
            }}
            ariaLabel="Reset today"
            icon={
              theme.id === 'princess' ? (
                <img
                  src={princessResetIcon}
                  alt="Reset today"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span className="text-2xl" role="img" aria-hidden="true">
                  🔄
                </span>
              )
            }
          />
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
                <span className="text-2xl" role="img" aria-hidden="true">
                  🧹
                </span>
              )
            }
          />
          <TopIconButton
            theme={theme}
            to="/settings/manage-children"
            ariaLabel="Children"
            icon={
              themeAssets.switchProfileIcon ? (
                <img
                  src={themeAssets.switchProfileIcon}
                  alt="Children"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span className="text-2xl">👥</span>
              )
            }
          />
          <TopIconButton
            theme={theme}
            onClick={logout}
            ariaLabel="Exit"
            icon={
              themeAssets.exitIcon ? (
                <img
                  src={themeAssets.exitIcon}
                  alt="Exit"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span className="text-2xl">🚪</span>
              )
            }
          />
        </>
      }
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          maxWidth: `${uiTokens.contentMaxWidth}px`,
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        {selectedChild && (
          <StarInfoBox theme={theme} totalStars={selectedChild.totalStars} />
        )}

        {!activeChildId ? (
          <div className="mt-10 flex flex-col items-center text-center opacity-70">
            <span className="mb-4 text-6xl" role="img" aria-label="Child">
              👶
            </span>
            <p className="text-2xl font-bold">
              Pick a child before planning today.
            </p>
          </div>
        ) : (
          <StandardActionList
            theme={theme}
            items={todos}
            getKey={(todo) => todo.id}
            {...todoListDescriptor}
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
                          {`${getScheduleLabel(task)} • ${task.starValue} ${task.starValue === 1 ? 'star' : 'stars'}`}
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
    </PageShell>
  )
}

export default DashboardPage
