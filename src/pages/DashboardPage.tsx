import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
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
  type ChoreWithEphemeral,
  getManageTaskCompletedAt,
  isEatingTask,
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

type ChorePanelMode = 'create' | null
type TriggerMap = Record<string, number>
type TriggerKey =
  | 'math'
  | 'largeNumbers'
  | 'positionalNotation'
  | 'alphabet'
  | 'spelling'
type ActivityCheckTriggers = Record<TriggerKey, TriggerMap>

const createEmptyActivityCheckTriggers = (): ActivityCheckTriggers => ({
  math: {},
  largeNumbers: {},
  positionalNotation: {},
  alphabet: {},
  spelling: {},
})

const createTriggerSetter =
  (
    setTriggers: Dispatch<SetStateAction<ActivityCheckTriggers>>,
    key: TriggerKey
  ): Dispatch<SetStateAction<TriggerMap>> =>
  (update) =>
    setTriggers((prev) => ({
      ...prev,
      [key]: typeof update === 'function' ? update(prev[key]) : update,
    }))

const getPrincessMealIconForHour = (hour: number) => {
  if (hour < 10) return princessEatingBreakfastIcon
  if (hour < 16) return princessEatingLunchIcon
  return princessEatingDinnerIcon
}

const isEditableChore = (
  chore: ReturnType<typeof useChores>['chores'][number]
): chore is ChoreWithEphemeral =>
  chore.taskType === 'standard' ||
  chore.taskType === 'eating' ||
  chore.taskType === 'watertoiletcheck'

const DashboardPage = () => {
  const { logout } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const { children } = useChildren()

  const {
    todos: todayChores,
    todayInfo,
    updateChoreAndTodayTodoField,
    updateEphemeral,
    createChoreForToday,
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
    completeChore,
    failChore,
    resetChore,
    deleteTask,
  } = useChores()

  const [chorePanelMode, setChorePanelMode] = useState<ChorePanelMode>(null)
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null)
  const [savingEditedChoreId, setSavingEditedChoreId] = useState<string | null>(
    null
  )
  const [isCreatingChore, setIsCreatingChore] = useState(false)
  const [createChoreError, setCreateChoreError] = useState<string | null>(null)
  const [isResettingToday, setIsResettingToday] = useState(false)
  const [resetTodayError, setResetTodayError] = useState<string | null>(null)
  const activity = useTaskActivityState()
  const clearActivityIds = activity.clearActiveActivities
  const [biteCooldownEndsAt, setBiteCooldownEndsAt] = useState<number | null>(
    null
  )

  const [activityCheckTriggers, setActivityCheckTriggers] = useState(
    createEmptyActivityCheckTriggers
  )

  const activePrincessMealIcon = getPrincessMealIconForHour(
    new Date().getHours()
  )

  useEffect(() => {
    clearActivityIds()
    setBiteCooldownEndsAt(null)
    setActivityCheckTriggers(createEmptyActivityCheckTriggers())
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
      setChorePanelMode(null)
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
      await Promise.all(
        todayChores
          .filter((chore) => !getManageTaskCompletedAt(chore))
          .map((chore) =>
            isEatingTask(chore) ? resetDinner(chore) : resetChore(chore)
          )
      )
      clearActiveActivities()
    } catch (error) {
      console.error('Failed to reset today chores', error)
      setResetTodayError('Reset failed.')
    } finally {
      setIsResettingToday(false)
    }
  }

  const handleUpdateChore = async (
    choreId: string,
    settings: ChoreDocumentSettings
  ) => {
    if (savingEditedChoreId) return

    setSavingEditedChoreId(choreId)
    setCreateChoreError(null)
    try {
      await updateChoreAndTodayTodoField(choreId, settings)
      setEditingChoreId(null)
    } catch (error) {
      console.error('Failed to update chore', error)
      setCreateChoreError('Could not save chore.')
    } finally {
      setSavingEditedChoreId(null)
    }
  }

  const handleEditChore = (chore: (typeof todayChores)[number]) => {
    if (!isEditableChore(chore)) {
      console.error('Cannot edit unsupported chore type.')
      setCreateChoreError('Could not edit chore.')
      return
    }

    setCreateChoreError(null)
    setEditingChoreId(chore.id)
  }

  const handleDeleteChore = async (choreId: string) => {
    setCreateChoreError(null)
    if (editingChoreId === choreId) {
      setEditingChoreId(null)
    }
    await deleteTask(choreId)
  }

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'today',
    onUpdateEphemeral: updateEphemeral,
    onDeleteTask: handleDeleteChore,
    onEnterChore: (item) => {
      if (!('taskType' in item)) return
      activity.enterActivity(item.taskType, item.id)
    },
    onComplete: (item) => {
      if (!('taskType' in item)) return
      completeChore(item)
    },
    onFail: (item) => {
      if (!('taskType' in item)) return
      failChore(item)
    },
    onReset: (item) => {
      if (!('taskType' in item)) return
      if (isEatingTask(item)) resetDinner(item)
      else resetChore(item)
      clearActiveActivities()
    },
    onStartDinner: (item) => {
      if (!item) {
        activity.setActiveDinnerId(null)
        setBiteCooldownEndsAt(null)
        return
      }
      if (!('taskType' in item)) return
      if (!isEatingTask(item)) return
      clearActiveActivities()
      startDinnerTimer(item)
      activity.enterActivity('eating', item.id)
    },
    onApplyBite: async (item) => {
      if (!('taskType' in item)) return
      if (biteCooldownEndsAt && Date.now() < biteCooldownEndsAt) return
      setBiteCooldownEndsAt(Date.now() + biteCooldownSeconds * 1000)
      await applyBite(item)
    },
    onExpireDinner: (item) => {
      if (!('taskType' in item)) return
      expireDinnerTimer(item)
    },
    activeMathId: activity.activeMathId,
    activeLargeNumbersId: activity.activeLargeNumbersId,
    activePVId: activity.activePVId,
    activeAlphabetId: activity.activeAlphabetId,
    activeSpellingId: activity.activeSpellingId,
    activeDinnerId: activity.activeDinnerId,
    activeWaterToiletId: activity.activeWaterToiletId,
    mathCheckTriggers: activityCheckTriggers.math,
    largeNumbersCheckTriggers: activityCheckTriggers.largeNumbers,
    pvCheckTriggers: activityCheckTriggers.positionalNotation,
    alphabetCheckTriggers: activityCheckTriggers.alphabet,
    spellingCheckTriggers: activityCheckTriggers.spelling,
    setMathCheckTriggers: createTriggerSetter(setActivityCheckTriggers, 'math'),
    setLargeNumbersCheckTriggers: createTriggerSetter(
      setActivityCheckTriggers,
      'largeNumbers'
    ),
    setPVCheckTriggers: createTriggerSetter(
      setActivityCheckTriggers,
      'positionalNotation'
    ),
    setAlphabetCheckTriggers: createTriggerSetter(
      setActivityCheckTriggers,
      'alphabet'
    ),
    setSpellingCheckTriggers: createTriggerSetter(
      setActivityCheckTriggers,
      'spelling'
    ),
    biteCooldownSeconds,
    biteCooldownEndsAt,
    activePrincessMealIcon,
  })

  const renderTodayChoreEdit = (chore: (typeof todayChores)[number]) => {
    if (!isEditableChore(chore)) {
      return (
        <div
          className="rounded-2xl px-4 py-3 text-center text-sm font-bold"
          style={{
            background: `${theme.colors.secondary}20`,
            color: theme.colors.text,
            border: `2px solid ${theme.colors.secondary}`,
          }}
        >
          Could not open chore editor.
        </div>
      )
    }

    return (
      <ChoreCreationFlow
        theme={theme}
        isSaving={savingEditedChoreId === chore.id}
        initialChore={chore}
        onSave={(_, settings) => handleUpdateChore(chore.id, settings)}
        onCancel={() => setEditingChoreId(null)}
      />
    )
  }

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
            items={todayChores}
            getKey={(chore) => chore.id}
            {...toStandardActionListDescriptor(descriptor)}
            editingId={editingChoreId ?? undefined}
            renderInlineEdit={renderTodayChoreEdit}
            onEdit={handleEditChore}
            onDelete={(chore) => handleDeleteChore(chore.id)}
            addLabel="Chores"
            onAdd={() => setChorePanelMode('create')}
            addDisabled={isCreatingChore}
            frameInlineNewRow
            inlineNewRow={
              chorePanelMode === 'create' ? (
                <div
                  className="flex flex-col"
                  style={{ gap: `${uiTokens.panelStackGap}px` }}
                >
                  <ChoreCreationFlow
                    theme={theme}
                    isSaving={isCreatingChore}
                    onSave={handleCreateChore}
                    onCancel={() => setChorePanelMode(null)}
                  />
                </div>
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
