import { useEffect, useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import ActionButton from '../components/ActionButton'
import StandardActionList from '../components/StandardActionList'
import { uiTokens } from '../ui/tokens'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createManageTaskListRowDescriptor } from '../ui/manageTaskDescriptors'
import { getSeasonForDate } from '../lib/today'
import { useDinnerActivity } from '../lib/useDinnerActivity'
import { useTasks } from '../data/useTasks'
import {
  getManageDinnerBitesLeft,
  getManageDinnerLiveRemaining,
  isEatingTask,
  type EatingTaskWithEphemeral,
  type MathTaskWithEphemeral,
  type PVTaskWithEphemeral,
  type AlphabetTaskWithEphemeral,
  type StandardTaskWithEphemeral,
  type TaskWithEphemeral,
} from '../data/types'
import {
  princessBiteIcon,
  princessEatingBreakfastIcon,
  princessEatingDinnerIcon,
  princessEatingLunchIcon,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayWinterImage,
  princessSchoolDayImage,
} from '../assets/themes/princess/assets'

const princessBiteIconCycle = [
  princessBiteIcon,
  princessEatingBreakfastIcon,
  princessEatingLunchIcon,
  princessEatingDinnerIcon,
]

const getPrincessCooldownIconForHour = (hour: number) => {
  if (hour < 10) return princessEatingBreakfastIcon
  if (hour < 16) return princessEatingLunchIcon
  return princessEatingDinnerIcon
}

const getPrincessNonSchoolDayImage = (
  season: ReturnType<typeof getSeasonForDate>
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

const ChoresPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()

  const {
    tasks,
    titleDrafts,
    setTitleDraft,
    commitTitle,
    updateTaskField,
    updateEphemeral,
    createChore,
    createEating,
    createMath,
    createPositionalNotation,
    createAlphabet,
    mathComplete,
    mathFail,
    mathReset,
    pvComplete,
    pvFail,
    pvReset,
    alphabetComplete,
    alphabetFail,
    alphabetReset,
    dinnerApplyBite,
    dinnerStartTimer,
    dinnerTimerExpired,
    dinnerReset,
    awardTask,
    deleteTask,
  } = useTasks()

  const [isAwarding, setIsAwarding] = useState(false)
  const [activeMathTaskId, setActiveMathTaskId] = useState<string | null>(null)
  const [activePVTaskId, setActivePVTaskId] = useState<string | null>(null)
  const [activeAlphabetTaskId, setActiveAlphabetTaskId] = useState<
    string | null
  >(null)
  const [mathCheckTriggerByTask, setMathCheckTriggerByTask] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggerByTask, setPVCheckTriggerByTask] = useState<
    Record<string, number>
  >({})
  const [alphabetCheckTriggerByTask, setAlphabetCheckTriggerByTask] = useState<
    Record<string, number>
  >({})
  const [showAddChooser, setShowAddChooser] = useState(false)

  const [biteCooldownTestIconIndex, setBiteCooldownTestIconIndex] = useState<
    number | null
  >(null)

  const currentSeason = getSeasonForDate(new Date())
  const princessNonSchoolDayImage = getPrincessNonSchoolDayImage(currentSeason)

  const {
    activeItemId: activeDinnerTaskId,
    biteCooldownEndsAt,
    pendingBiteItemId: pendingDinnerBiteTaskId,
    startActivity: startDinnerActivity,
    clearItemState: clearDinnerTaskState,
    isRunning: isDinnerTaskRunning,
    queueBite: queueDinnerBite,
    resetActivity: resetDinnerActivity,
  } = useDinnerActivity<EatingTaskWithEphemeral>({
    items: tasks.filter(isEatingTask),
    getId: (task) => task.id,
    isCompleted: (task) => Boolean(task.manageDinnerCompletedAt),
    getRemaining: getManageDinnerLiveRemaining,
    getBitesLeft: getManageDinnerBitesLeft,
    applyBite: async (task) => Boolean(await dinnerApplyBite(task)),
    expireTimer: dinnerTimerExpired,
    isPersistedRunning: (task) => Boolean(task.manageDinnerTimerStartedAt),
    resetKeys: [activeChildId],
  })

  // Clear the princess cooldown test icon when the dinner game ends
  useEffect(() => {
    if (!activeDinnerTaskId && !pendingDinnerBiteTaskId) {
      setBiteCooldownTestIconIndex(null)
    }
  }, [activeDinnerTaskId, pendingDinnerBiteTaskId])

  const biteCooldownSeconds = biteCooldownEndsAt
    ? Math.max(0, (biteCooldownEndsAt - Date.now()) / 1000)
    : 0

  const activePrincessCooldownIcon = (() => {
    const defaultIcon = getPrincessCooldownIconForHour(new Date().getHours())
    if (biteCooldownTestIconIndex === null) return defaultIcon
    return princessBiteIconCycle[biteCooldownTestIconIndex] ?? defaultIcon
  })()

  const handleCycleCooldownTestIcon = () => {
    if (biteCooldownSeconds <= 0) return
    setBiteCooldownTestIconIndex((prev) => {
      const currentIcon =
        prev === null
          ? activePrincessCooldownIcon
          : (princessBiteIconCycle[prev] ?? activePrincessCooldownIcon)
      const currentIndex = princessBiteIconCycle.indexOf(currentIcon)
      const nextIndex =
        currentIndex >= 0
          ? (currentIndex + 1) % princessBiteIconCycle.length
          : 0
      return nextIndex
    })
  }

  const renderDayTypeControl = (task: TaskWithEphemeral) => {
    const getScheduleButtonStyle = (isActive: boolean) => ({
      background: theme.colors.surface,
      border:
        theme.id === 'space'
          ? `3px solid ${isActive ? theme.colors.secondary : `${theme.colors.secondary}66`}`
          : `4px solid ${isActive ? theme.colors.primary : theme.colors.accent}`,
      boxShadow: isActive
        ? theme.id === 'space'
          ? `0 0 20px ${theme.colors.secondary}55, inset 0 0 20px ${theme.colors.secondary}12`
          : `0 8px 0 ${theme.colors.primary}, 0 0 15px ${theme.colors.primary}22`
        : theme.id === 'space'
          ? `0 0 10px ${theme.colors.secondary}22, inset 0 0 12px ${theme.colors.secondary}10`
          : `0 8px 0 ${theme.colors.accent}, 0 0 8px ${theme.colors.accent}22`,
    })

    return (
      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          label="Schoolday"
          icon={null}
          theme={theme}
          color={theme.colors.surface}
          onClick={() =>
            updateTaskField(task.id, {
              schoolDayEnabled: !task.schoolDayEnabled,
            })
          }
          ariaPressed={task.schoolDayEnabled}
          styleOverride={getScheduleButtonStyle(task.schoolDayEnabled)}
          hideArrow
          content={
            <span className="flex h-full w-full items-center justify-center transition-transform group-hover:-translate-y-1">
              {theme.id === 'princess' ? (
                <img
                  src={princessSchoolDayImage}
                  alt="Schoolday"
                  className="h-12 w-full object-contain"
                  style={{ opacity: task.schoolDayEnabled ? 1 : 0.7 }}
                />
              ) : (
                <span
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.heading,
                    fontWeight: 800,
                    opacity: task.schoolDayEnabled ? 1 : 0.7,
                  }}
                >
                  Schoolday
                </span>
              )}
            </span>
          }
        />

        <ActionButton
          label="Non-school day"
          icon={null}
          theme={theme}
          color={theme.colors.surface}
          onClick={() =>
            updateTaskField(task.id, {
              nonSchoolDayEnabled: !task.nonSchoolDayEnabled,
            })
          }
          ariaPressed={task.nonSchoolDayEnabled}
          styleOverride={getScheduleButtonStyle(task.nonSchoolDayEnabled)}
          hideArrow
          content={
            <span className="flex h-full w-full items-center justify-center transition-transform group-hover:-translate-y-1">
              {theme.id === 'princess' ? (
                <img
                  src={princessNonSchoolDayImage}
                  alt="Non-school day"
                  className="h-12 w-full object-contain"
                  style={{ opacity: task.nonSchoolDayEnabled ? 1 : 0.7 }}
                />
              ) : (
                <span
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.heading,
                    fontWeight: 800,
                    opacity: task.nonSchoolDayEnabled ? 1 : 0.7,
                  }}
                >
                  Non-school day
                </span>
              )}
            </span>
          }
        />
      </div>
    )
  }

  // --- Slim handler wrappers (UI state + data layer) ---
  const handleCreateChore = async () => {
    await createChore()
    setShowAddChooser(false)
  }

  const handleCreateEating = async () => {
    await createEating()
    setShowAddChooser(false)
  }

  const handleCreateMath = async () => {
    await createMath()
    setShowAddChooser(false)
  }

  const handleCreatePositionalNotation = async () => {
    await createPositionalNotation()
    setShowAddChooser(false)
  }

  const handleCreateAlphabet = async () => {
    await createAlphabet()
    setShowAddChooser(false)
  }

  const handleMathComplete = async (task: MathTaskWithEphemeral) => {
    setActiveMathTaskId(null)
    await mathComplete(task)
  }

  const handleMathFail = async (task: MathTaskWithEphemeral) => {
    setActiveMathTaskId(null)
    await mathFail(task)
  }

  const handleMathReset = async (task: MathTaskWithEphemeral) => {
    setActiveMathTaskId(null)
    await mathReset(task)
  }

  const handlePVComplete = async (task: PVTaskWithEphemeral) => {
    setActivePVTaskId(null)
    await pvComplete(task)
  }

  const handlePVFail = async (task: PVTaskWithEphemeral) => {
    setActivePVTaskId(null)
    await pvFail(task)
  }

  const handlePVReset = async (task: PVTaskWithEphemeral) => {
    setActivePVTaskId(null)
    await pvReset(task)
  }

  const handleAlphabetComplete = async (task: AlphabetTaskWithEphemeral) => {
    setActiveAlphabetTaskId(null)
    await alphabetComplete(task)
  }

  const handleAlphabetFail = async (task: AlphabetTaskWithEphemeral) => {
    setActiveAlphabetTaskId(null)
    await alphabetFail(task)
  }

  const handleAlphabetReset = async (task: AlphabetTaskWithEphemeral) => {
    setActiveAlphabetTaskId(null)
    await alphabetReset(task)
  }

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    clearDinnerTaskState(id)
    if (activeMathTaskId === id) setActiveMathTaskId(null)
    if (activePVTaskId === id) setActivePVTaskId(null)
    if (activeAlphabetTaskId === id) setActiveAlphabetTaskId(null)
    setMathCheckTriggerByTask((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setPVCheckTriggerByTask((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setAlphabetCheckTriggerByTask((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleDinnerBite = (task: EatingTaskWithEphemeral) => {
    setBiteCooldownTestIconIndex(null)
    queueDinnerBite(task)
  }

  const handleDinnerReset = async (task: EatingTaskWithEphemeral) => {
    setBiteCooldownTestIconIndex(null)
    await resetDinnerActivity(task, dinnerReset)
  }

  const handleAwardTask = async (task: StandardTaskWithEphemeral) => {
    setIsAwarding(true)
    try {
      await awardTask(task)
    } catch (error) {
      console.error('Failed to award stars', error)
      alert('Failed to award stars. Please try again.')
    } finally {
      setIsAwarding(false)
    }
  }

  const handleStandardReset = async (task: StandardTaskWithEphemeral) => {
    await updateEphemeral(task.id, { manageCompletedAt: null })
  }

  const taskListDescriptor = toStandardActionListDescriptor(
    createManageTaskListRowDescriptor({
      theme,
      titleDrafts,
      setTitleDraft,
      commitTitle,
      updateTaskField,
      updateEphemeral,
      renderDayTypeControl,
      activeMathTaskId,
      activePVTaskId,
      mathCheckTriggerByTask,
      pvCheckTriggerByTask,
      isDinnerTaskRunning,
      biteCooldownSeconds,
      biteCooldownEndsAt,
      activePrincessCooldownIcon,
      handleCycleCooldownTestIcon,
      handleDinnerBite,
      dinnerStartTimer,
      startDinnerActivity,
      handleDinnerReset,
      handleMathComplete,
      handleMathFail,
      handleMathReset,
      setActiveMathTaskId,
      setMathCheckTriggerByTask,
      handlePVComplete,
      handlePVFail,
      handlePVReset,
      setActivePVTaskId,
      setPVCheckTriggerByTask,
      activeAlphabetTaskId,
      alphabetCheckTriggerByTask,
      handleAlphabetComplete,
      handleAlphabetFail,
      handleAlphabetReset,
      setActiveAlphabetTaskId,
      setAlphabetCheckTriggerByTask,
      handleAwardTask,
      handleStandardReset,
      handleDelete,
      isAwarding,
      activeChildId,
    })
  )

  return (
    <PageShell theme={theme} activeTabId="dashboard" title="Chores">
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: `${uiTokens.contentMaxWidth}px`,
          paddingBottom: '128px',
        }}
      >
        {!activeChildId ? (
          <div className="mt-10 flex flex-col items-center text-center opacity-70">
            <span className="mb-4 text-6xl">👶</span>
            <p className="text-2xl font-bold">No explorers yet!</p>
          </div>
        ) : (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            <StandardActionList
              theme={theme}
              items={tasks}
              getKey={(task) => task.id}
              {...taskListDescriptor}
              hideEdit
              onDelete={(task) => handleDelete(task.id)}
              addLabel="New Chore"
              onAdd={() => setShowAddChooser(true)}
              addDisabled={false}
              inlineNewRow={
                showAddChooser ? (
                  <div
                    className="grid grid-cols-1"
                    style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                  >
                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={handleCreateChore}
                      style={{
                        minHeight: `${uiTokens.actionButtonHeight}px`,
                        borderRadius: '20px',
                        border: `3px solid ${theme.colors.accent}`,
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                        color: theme.id === 'space' ? '#000' : '#fff',
                        fontFamily: theme.fonts.heading,
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      Standard Chore
                    </button>

                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={handleCreateEating}
                      style={{
                        minHeight: `${uiTokens.actionButtonHeight}px`,
                        borderRadius: '20px',
                        border: `3px solid ${theme.colors.accent}`,
                        background: theme.colors.surface,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.heading,
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      Dinner
                    </button>

                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={handleCreateMath}
                      style={{
                        minHeight: `${uiTokens.actionButtonHeight}px`,
                        borderRadius: '20px',
                        border: `3px solid ${theme.colors.accent}`,
                        background: theme.colors.surface,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.heading,
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      Arithmetic
                    </button>

                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={handleCreatePositionalNotation}
                      style={{
                        minHeight: `${uiTokens.actionButtonHeight}px`,
                        borderRadius: '20px',
                        border: `3px solid ${theme.colors.accent}`,
                        background: theme.colors.surface,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.heading,
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      Positional Notation
                    </button>
                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={handleCreateAlphabet}
                      style={{
                        minHeight: `${uiTokens.actionButtonHeight}px`,
                        borderRadius: '20px',
                        border: `3px solid ${theme.colors.accent}`,
                        background: theme.colors.surface,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.heading,
                        fontWeight: 800,
                        fontSize: '1.15rem',
                      }}
                    >
                      Alphabet Match
                    </button>
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
                  No chores yet.
                </div>
              }
            />
          </div>
        )}
      </div>
    </PageShell>
  )
}

export default ChoresPage
