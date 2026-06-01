import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import StarInfoBox from '../components/ui/StarInfoBox'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { useChildren } from '../data/useChildren'
import { useChores } from '../data/useChores'
import {
  BITE_COOLDOWN_SECONDS,
  type ChoreType,
  isEatingTodo,
  isTodoRecord,
} from '../data/types'
import type { ChoreDocumentSettings } from '../data/taskDocuments'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import {
  princessEatingBreakfastIcon,
  princessEatingDinnerIcon,
  princessEatingLunchIcon,
} from '../assets/themes/princess/assets'
import { DashboardHeaderActions } from './dashboardChoreUi'
import ChoreCreationFlow from './ChoreCreationFlow'

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
    todayInfo,
    deleteTodo,
    updateTodoField,
    createChoreForToday,
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
    completeChore,
    failChore,
    resetChore,
    resetTodayChores,
  } = useChores()

  const [showAddChooser, setShowAddChooser] = useState(false)
  const [isCreatingChore, setIsCreatingChore] = useState(false)
  const [createChoreError, setCreateChoreError] = useState<string | null>(null)
  const [isResettingToday, setIsResettingToday] = useState(false)
  const [resetTodayError, setResetTodayError] = useState<string | null>(null)
  const activity = useTaskActivityState()
  const clearActivityIds = activity.clearActiveActivities
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
    clearActivityIds()
    setBiteCooldownEndsAt(null)
    setMathCheckTriggers({})
    setPVCheckTriggers({})
    setAlphabetCheckTriggers({})
  }, [activeChildId, clearActivityIds, todayInfo.dateKey])

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

  const biteCooldownSeconds = BITE_COOLDOWN_SECONDS

  const clearActiveActivities = () => {
    activity.clearActiveActivities()
    setBiteCooldownEndsAt(null)
  }

  const handleCreateChore = async (
    choreType: ChoreType,
    settings: ChoreDocumentSettings
  ) => {
    if (isCreatingChore) return

    setIsCreatingChore(true)
    setCreateChoreError(null)
    try {
      await createChoreForToday(choreType, settings)
      setShowAddChooser(false)
    } catch (error) {
      console.error('Failed to create chore', error)
      setCreateChoreError('Could not save chore.')
    } finally {
      setIsCreatingChore(false)
    }
  }

  const handleResetToday = async () => {
    if (!activeChildId || isResettingToday) return

    setIsResettingToday(true)
    setResetTodayError(null)
    try {
      await resetTodayChores()
    } catch (error) {
      console.error('Failed to reset today chores', error)
      setResetTodayError('Reset failed.')
    } finally {
      setIsResettingToday(false)
    }
  }

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'today',
    onUpdateTodoField: updateTodoField,
    onDeleteTodo: deleteTodo,
    onEnterChore: (item) => {
      if (isTodoRecord(item)) {
        activity.enterActivity(item.sourceTaskType, item.id)
      }
    },
    onComplete: completeChore,
    onFail: failChore,
    onReset: (item) => {
      if (!isTodoRecord(item)) return
      if (isEatingTodo(item)) resetDinner(item)
      else resetChore(item)
      clearActiveActivities()
    },
    onStartDinner: (item) => {
      if (!item) {
        activity.setActiveDinnerId(null)
        setBiteCooldownEndsAt(null)
        return
      }
      if (!isTodoRecord(item) || !isEatingTodo(item)) return
      clearActiveActivities()
      startDinnerTimer(item)
      activity.enterActivity('eating', item.id)
    },
    onApplyBite: async (item) => {
      if (biteCooldownEndsAt && Date.now() < biteCooldownEndsAt) return
      setBiteCooldownEndsAt(Date.now() + biteCooldownSeconds * 1000)
      await applyBite(item)
    },
    onExpireDinner: expireDinnerTimer,
    activeMathId: activity.activeMathId,
    activePVId: activity.activePVId,
    activeAlphabetId: activity.activeAlphabetId,
    activeDinnerId: activity.activeDinnerId,
    activeWaterToiletId: activity.activeWaterToiletId,
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

  return (
    <TabContent
      theme={theme}
      title={selectedChild?.displayName || 'Explorer'}
      headerRight={
        <DashboardHeaderActions
          theme={theme}
          activeChildId={activeChildId}
          isResettingToday={isResettingToday}
          onResetToday={handleResetToday}
          onLogout={logout}
        />
      }
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        {selectedChild && (
          <StarInfoBox theme={theme} totalStars={selectedChild.totalStars} />
        )}
        {resetTodayError && (
          <div
            className="rounded-2xl px-4 py-3 text-center text-sm font-bold"
            style={{
              background: `${theme.colors.secondary}20`,
              color: theme.colors.text,
              border: `2px solid ${theme.colors.secondary}`,
            }}
          >
            {resetTodayError}
          </div>
        )}
        {createChoreError && (
          <div
            className="rounded-2xl px-4 py-3 text-center text-sm font-bold"
            style={{
              background: `${theme.colors.secondary}20`,
              color: theme.colors.text,
              border: `2px solid ${theme.colors.secondary}`,
            }}
          >
            {createChoreError}
          </div>
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
            addLabel="Add Chore"
            onAdd={() => setShowAddChooser(true)}
            addDisabled={isCreatingChore}
            inlineNewRow={
              showAddChooser ? (
                <ChoreCreationFlow
                  theme={theme}
                  isSaving={isCreatingChore}
                  onSave={handleCreateChore}
                  onCancel={() => setShowAddChooser(false)}
                />
              ) : undefined
            }
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                No chores for today yet.
              </div>
            }
          />
        )}
      </div>
    </TabContent>
  )
}

export default DashboardPage
