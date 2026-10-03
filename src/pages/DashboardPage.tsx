import { useDataScope } from '../sharing/ChildAccessContext'
import { getThemeAsset } from '../ui/themeAssets'
import { useContext, useEffect, useMemo, useState } from 'react'
import { ResetChoresContext } from '../contexts/ActivityTabContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import StarInfoBox from '../components/ui/StarInfoBox'
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
import ChoreCreationFlow from './ChoreCreationFlow'
import InlineNotice from '../components/ui/InlineNotice'
import { useTaskCelebration } from '../hooks/useTaskCelebration'

type ChorePanelMode = 'create' | null

const getMealIconForHour = (hour: number, themeId: string) => {
  if (hour < 10) return getThemeAsset(themeId, 'eatingBreakfastIcon')
  if (hour < 16) return getThemeAsset(themeId, 'eatingLunchIcon')
  return getThemeAsset(themeId, 'eatingDinnerIcon')
}

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
  const resetChoresRef = useContext(ResetChoresContext)
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const { canAdmin } = useDataScope()
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

  const selectedChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  const celebration = useTaskCelebration({
    items: todayChores,
    activeChildId,
    dateKey: todayInfo.dateKey,
    totalStars: selectedChild?.totalStars ?? 0,
  })

  const [chorePanelMode, setChorePanelMode] = useState<ChorePanelMode>(null)
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null)
  const [savingEditedChoreId, setSavingEditedChoreId] = useState<string | null>(
    null
  )
  const [isCreatingChore, setIsCreatingChore] = useState(false)
  const [createChoreError, setCreateChoreError] = useState<string | null>(null)
  const activityScope = `${activeChildId}:${todayInfo.dateKey}`
  const activity = useTaskActivityState(activityScope)
  const [biteCooldowns, setBiteCooldowns] = useState<Record<string, number>>({})

  const { clearCheckTriggers, ...testCheckTriggers } = useTestCheckTriggers()

  const activeMealIcon = getMealIconForHour(new Date().getHours(), theme.id)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setBiteCooldowns({})
      clearCheckTriggers()
    })
    return () => cancelAnimationFrame(frame)
  }, [activeChildId, clearCheckTriggers, todayInfo.dateKey])

  useEffect(() => {
    const deadlines = Object.values(biteCooldowns)
    if (!deadlines.length) return
    const remaining = Math.min(...deadlines) - Date.now()
    const timer = setTimeout(
      () =>
        setBiteCooldowns((previous) =>
          Object.fromEntries(
            Object.entries(previous).filter(
              ([, deadline]) => deadline > Date.now()
            )
          )
        ),
      Math.max(0, remaining)
    )
    return () => clearTimeout(timer)
  }, [biteCooldowns])

  const biteCooldownSeconds = BITE_COOLDOWN_SECONDS

  const clearActiveActivities = () => {
    activity.clearActiveActivities()
    setBiteCooldowns({})
  }

  const exitActivity = (id: string) => {
    activity.exitActivity(id)
    setBiteCooldowns((previous) => {
      const next = { ...previous }
      delete next[id]
      return next
    })
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

  const resetTodayChore = (chore: ChoreWithEphemeral) =>
    isEatingTask(chore) ? resetDinner(chore) : resetChore(chore)

  const handleResetToday = async () => {
    if (!activeChildId) return
    clearActiveActivities()
    celebration.clear()
    const results = await Promise.allSettled(todayChores.map(resetTodayChore))
    const failure = results.find((result) => result.status === 'rejected')
    if (failure) throw failure.reason
  }

  useEffect(() => {
    if (!resetChoresRef) return
    resetChoresRef.current = handleResetToday
    return () => {
      resetChoresRef.current = null
    }
  })

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
    exitActivity(choreId)
  }

  const unifiedChoreDeps: UnifiedChoreDeps = {
    canReset: canAdmin,
    theme,
    onUpdateEphemeral: updateEphemeral,
    onDeleteTask: handleDeleteChore,
    onEnterChore: (item) =>
      withTaskItem(item, (task) =>
        activity.enterActivity(task.taskType, task.id)
      ),
    onExitActivity: (item) => exitActivity(item.id),
    onComplete: (item) =>
      withTaskItem(item, (task) =>
        celebration.run(task, todayChores, (onAward) =>
          completeChore(task, onAward)
        )
      ),
    onFail: (item) => withTaskItem(item, failChore),
    onReset: (item) =>
      withTaskItem(item, async (task) => {
        exitActivity(task.id)
        await resetTodayChore(task)
      }),
    onStartDinner: (item) =>
      withTaskItem(item, (task) => {
        if (!isEatingTask(task)) return
        activity.enterActivity('eating', task.id)
        return startDinnerTimer(task)
      }),
    onApplyBite: (item) =>
      withTaskItem(item, async (task) => {
        if (Date.now() < (biteCooldowns[task.id] ?? 0)) return
        setBiteCooldowns((previous) => ({
          ...previous,
          [task.id]: Date.now() + biteCooldownSeconds * 1000,
        }))
        await celebration.run(task, todayChores, (onAward) =>
          applyBite(task, onAward)
        )
      }),
    onExpireDinner: (item) => withTaskItem(item, expireDinnerTimer),
    activeIds: activity.activeIds,
    ...testCheckTriggers,
    biteCooldownSeconds,
    biteCooldowns,
    activeMealIcon,
  }

  const choreState = createUnifiedChoreState(unifiedChoreDeps)
  const descriptor = celebration.decorate(
    createUnifiedChoreDescriptor(unifiedChoreDeps),
    theme
  )

  const shouldHideEditChore = (chore: (typeof todayChores)[number]) =>
    celebration.isBusy(chore) || choreState.getStage(chore) === 'activity'

  const renderTodayChoreEdit = (chore: (typeof todayChores)[number]) => {
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

  return (
    <TabContent
      theme={theme}
      title={selectedChild?.displayName || 'Explorer'}
      onResetToday={handleResetToday}
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
          <StandardActionList<ChoreWithEphemeral>
            key={activityScope}
            theme={theme}
            items={celebration.retainItems(todayChores)}
            getKey={(chore) => chore.id}
            getItemLabel={(chore) => chore.title}
            {...descriptor}
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
