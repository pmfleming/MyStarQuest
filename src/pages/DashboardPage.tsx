import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import StarInfoBox from '../components/ui/StarInfoBox'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import {
  createUnifiedChoreDescriptor,
  type UnifiedChoreDeps,
} from '../ui/unifiedChoreDescriptors'
import { createUnifiedChoreState } from '../ui/unifiedChoreState'
import type { UnifiedChoreItem } from '../ui/unifiedChoreDescriptorTypes'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { useChildren } from '../data/useChildren'
import { useChores } from '../data/useChores'
import {
  BITE_COOLDOWN_SECONDS,
  type ChoreType,
  type ChoreWithEphemeral,
  isChoreWithEphemeral,
  isEatingTask,
} from '../data/types'
import type { ChoreDocumentSettings } from '../data/taskDocuments'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../hooks/useTestCheckTriggers'
import {
  princessEatingBreakfastIcon,
  princessEatingDinnerIcon,
  princessEatingLunchIcon,
} from '../assets/themes/princess/assets'
import { DashboardHeaderActions } from './dashboardChoreUi'
import ChoreCreationFlow from './ChoreCreationFlow'
import InlineNotice from '../components/ui/InlineNotice'

type ChorePanelMode = 'create' | null

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

const withTaskItem = <Result,>(
  item: UnifiedChoreItem,
  action: (task: ChoreWithEphemeral) => Result
) => (isChoreWithEphemeral(item) ? action(item) : undefined)

const runDashboardAction = async (
  action: () => Promise<void>,
  errorLabel: string,
  onError: () => void
) => {
  try {
    await action()
  } catch (error) {
    console.error(errorLabel, error)
    onError()
  }
}

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

  const { clearCheckTriggers, ...testCheckTriggers } = useTestCheckTriggers()

  const activePrincessMealIcon = getPrincessMealIconForHour(
    new Date().getHours()
  )

  useEffect(() => {
    clearActivityIds()
    setBiteCooldownEndsAt(null)
    clearCheckTriggers()
  }, [activeChildId, clearActivityIds, clearCheckTriggers, todayInfo.dateKey])

  useEffect(() => {
    if (!biteCooldownEndsAt) return
    const remaining = biteCooldownEndsAt - Date.now()
    if (remaining <= 0) {
      setBiteCooldownEndsAt(null)
      return
    }

    const timer = setTimeout(() => setBiteCooldownEndsAt(null), remaining)
    return () => clearTimeout(timer)
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
    await runDashboardAction(
      async () => {
        await createChoreForToday(choreType, settings)
        setChorePanelMode(null)
      },
      'Failed to create chore',
      () => setCreateChoreError('Could not save chore.')
    )
    setIsCreatingChore(false)
  }

  const handleResetToday = async () => {
    if (!activeChildId || isResettingToday) return

    setIsResettingToday(true)
    setResetTodayError(null)
    await runDashboardAction(
      async () => {
        await Promise.all(
          todayChores.map((chore) =>
            isEatingTask(chore) ? resetDinner(chore) : resetChore(chore)
          )
        )
        clearActiveActivities()
      },
      'Failed to reset today chores',
      () => setResetTodayError('Reset failed.')
    )
    setIsResettingToday(false)
  }

  const handleUpdateChore = async (
    choreId: string,
    settings: ChoreDocumentSettings
  ) => {
    if (savingEditedChoreId) return

    setSavingEditedChoreId(choreId)
    setCreateChoreError(null)
    await runDashboardAction(
      async () => {
        await updateChoreAndTodayTodoField(choreId, settings)
        setEditingChoreId(null)
      },
      'Failed to update chore',
      () => setCreateChoreError('Could not save chore.')
    )
    setSavingEditedChoreId(null)
  }

  const handleEditChore = (chore: (typeof todayChores)[number]) => {
    if (!isEditableChore(chore)) {
      console.error('Cannot edit unsupported chore type.')
      setCreateChoreError('Could not edit chore.')
      return
    }

    if (shouldHideEditChore(chore)) {
      setCreateChoreError('Finish the activity before editing this chore.')
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

  const unifiedChoreDeps: UnifiedChoreDeps = {
    theme,
    mode: 'today',
    onUpdateEphemeral: updateEphemeral,
    onDeleteTask: handleDeleteChore,
    onEnterChore: (item) =>
      withTaskItem(item, (task) =>
        activity.enterActivity(task.taskType, task.id)
      ),
    onExitActivity: activity.clearActiveActivities,
    onComplete: (item) => withTaskItem(item, completeChore),
    onFail: (item) => withTaskItem(item, failChore),
    onReset: (item) =>
      withTaskItem(item, async (task) => {
        if (isEatingTask(task)) await resetDinner(task)
        else await resetChore(task)
        clearActiveActivities()
      }),
    onStartDinner: (item) => {
      if (!item) {
        activity.setActiveDinnerId(null)
        setBiteCooldownEndsAt(null)
        return
      }
      return withTaskItem(item, (task) => {
        if (!isEatingTask(task)) return
        clearActiveActivities()
        activity.enterActivity('eating', task.id)
        return startDinnerTimer(task)
      })
    },
    onApplyBite: (item) =>
      withTaskItem(item, async (task) => {
        if (biteCooldownEndsAt && Date.now() < biteCooldownEndsAt) return
        setBiteCooldownEndsAt(Date.now() + biteCooldownSeconds * 1000)
        await applyBite(task)
      }),
    onExpireDinner: (item) => withTaskItem(item, expireDinnerTimer),
    activeMathId: activity.activeMathId,
    activeLargeNumbersId: activity.activeLargeNumbersId,
    activePVId: activity.activePVId,
    activeAlphabetId: activity.activeAlphabetId,
    activeSpellingId: activity.activeSpellingId,
    activeAnimalsId: activity.activeAnimalsId,
    activeDinnerId: activity.activeDinnerId,
    activeWaterToiletId: activity.activeWaterToiletId,
    ...testCheckTriggers,
    biteCooldownSeconds,
    biteCooldownEndsAt,
    activePrincessMealIcon,
  }

  const choreState = createUnifiedChoreState(unifiedChoreDeps)
  const descriptor = createUnifiedChoreDescriptor(unifiedChoreDeps)

  const shouldHideEditChore = (chore: (typeof todayChores)[number]) =>
    !isEditableChore(chore) || choreState.getStage(chore) === 'activity'

  const renderTodayChoreEdit = (chore: (typeof todayChores)[number]) => {
    if (!isEditableChore(chore)) {
      return (
        <InlineNotice theme={theme}>Could not open chore editor.</InlineNotice>
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
          <InlineNotice theme={theme}>{resetTodayError}</InlineNotice>
        )}
        {createChoreError && (
          <InlineNotice theme={theme}>{createChoreError}</InlineNotice>
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
            getItemLabel={(chore) => chore.title}
            {...toStandardActionListDescriptor(descriptor)}
            editingId={editingChoreId ?? undefined}
            renderInlineEdit={renderTodayChoreEdit}
            onEdit={handleEditChore}
            hideEdit={shouldHideEditChore}
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
