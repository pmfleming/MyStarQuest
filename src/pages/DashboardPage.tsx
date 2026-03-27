import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import StarInfoBox from '../components/StarInfoBox'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { getScheduleLabel } from '../lib/today'
import { uiTokens } from '../ui/tokens'
import { useChildren } from '../data/useChildren'
import { useChores } from '../data/useChores'
import type { TodoRecord, EatingTodo } from '../data/types'

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

  const {
    todos,
    availableChores,
    todayInfo,
    addTodo,
    deleteTodo,
    updateTodoField,
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
    completeChore,
    failChore,
    resetChore,
    resetTodayTodos,
  } = useChores()

  const [showAddChooser, setShowAddChooser] = useState(false)
  const [activeMathId, setActiveMathId] = useState<string | null>(null)
  const [activePVId, setActivePVId] = useState<string | null>(null)
  const [activeAlphabetId, setActiveAlphabetId] = useState<string | null>(null)
  const [activeDinnerId, setActiveDinnerId] = useState<string | null>(null)
  const [biteCooldownEndsAt, setBiteCooldownEndsAt] = useState<number | null>(
    null
  )

  const [mathCheckTriggers, setMathCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggers, setPVCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [alphabetCheckTriggers, setAlphabetCheckTriggers] = useState<
    Record<string, number>
  >({})

  const activePrincessMealIcon = getPrincessMealIconForHour(
    new Date().getHours()
  )

  useEffect(() => {
    setActiveMathId(null)
    setActivePVId(null)
    setActiveAlphabetId(null)
    setActiveDinnerId(null)
    setBiteCooldownEndsAt(null)
    setMathCheckTriggers({})
    setPVCheckTriggers({})
    setAlphabetCheckTriggers({})
  }, [activeChildId, todayInfo.dateKey])

  useEffect(() => {
    if (biteCooldownEndsAt) {
      const remaining = biteCooldownEndsAt - Date.now()
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setBiteCooldownEndsAt(null)
        }, remaining)
        return () => clearTimeout(timer)
      } else {
        setBiteCooldownEndsAt(null)
      }
    }
  }, [biteCooldownEndsAt])

  const biteCooldownSeconds = 15 // Fixed constant

  const clearActiveActivities = () => {
    setActiveMathId(null)
    setActivePVId(null)
    setActiveAlphabetId(null)
    setActiveDinnerId(null)
    setBiteCooldownEndsAt(null)
  }

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'today',
    onUpdateTodoField: updateTodoField,
    onDeleteTodo: deleteTodo,
    onEnterChore: (item) => {
      const todo = item as TodoRecord
      if (todo.sourceTaskType === 'math') {
        clearActiveActivities()
        setActiveMathId(todo.id)
      } else if (todo.sourceTaskType === 'positional-notation') {
        clearActiveActivities()
        setActivePVId(todo.id)
      } else if (todo.sourceTaskType === 'alphabet') {
        clearActiveActivities()
        setActiveAlphabetId(todo.id)
      }
    },
    onComplete: completeChore,
    onFail: failChore,
    onReset: (item) => {
      const todo = item as TodoRecord
      if (todo.sourceTaskType === 'eating') resetDinner(todo as EatingTodo)
      else resetChore(todo)
      clearActiveActivities()
    },
    onStartDinner: (item) => {
      if (!item) {
        setActiveDinnerId(null)
        setBiteCooldownEndsAt(null)
        return
      }
      const todo = item as EatingTodo
      clearActiveActivities()
      startDinnerTimer(todo)
      setActiveDinnerId(todo.id)
    },
    onApplyBite: async (item) => {
      if (biteCooldownEndsAt && Date.now() < biteCooldownEndsAt) return
      setBiteCooldownEndsAt(Date.now() + biteCooldownSeconds * 1000)
      await applyBite(item)
    },
    onExpireDinner: expireDinnerTimer,
    activeMathId,
    activePVId,
    activeAlphabetId,
    activeDinnerId,
    mathCheckTriggers,
    pvCheckTriggers,
    alphabetCheckTriggers,
    setMathCheckTriggers,
    setPVCheckTriggers,
    setAlphabetCheckTriggers,
    biteCooldownSeconds,
    biteCooldownEndsAt,
    activePrincessMealIcon,
  })

  const selectedChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  const themeAssets = getThemeAssets(theme.id)

  return (
    <TabContent
      theme={theme}
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
            {...toStandardActionListDescriptor(descriptor)}
            hideEdit
            onDelete={(todo) => deleteTodo(todo.id)}
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
                        onClick={() => {
                          addTodo(task)
                          setShowAddChooser(false)
                        }}
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
                        <span className="text-sm opacity-75">{`${getScheduleLabel(task)} • ${task.starValue} ${task.starValue === 1 ? 'star' : 'stars'}`}</span>
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
    </TabContent>
  )
}

export default DashboardPage
