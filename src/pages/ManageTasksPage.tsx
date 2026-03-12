import { useEffect, useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import ActionButton from '../components/ActionButton'
import StandardActionList from '../components/StandardActionList'
import StarDisplay from '../components/StarDisplay'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import DinnerCountdown from '../components/DinnerCountdown'
import ArithmeticTester from '../components/ArithmeticTester'
import PositionalNotation from '../components/PositionalNotation'
import DayNightExplorer from '../components/DayNightExplorer'
import { uiTokens } from '../ui/tokens'
import {
  resolveSetupStatusAction,
  runSetupStatusAction,
  type SetupStatusActionRule,
} from '../utils/setupStatusActions'
import { getSeasonForDate } from '../utils/today'
import { useDinnerActivity } from '../hooks/useDinnerActivity'
import { useTasks } from '../data/useTasks'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  getManageDinnerBitesLeft,
  getManageDinnerLiveRemaining,
  isEatingTask,
  isManageTaskCompleted,
  isMathTask,
  isDayNightTask,
  isPositionalNotationTask,
  type DayNightTaskWithEphemeral,
  type EatingTaskWithEphemeral,
  type MathTaskWithEphemeral,
  type PVTaskWithEphemeral,
  type StandardTaskWithEphemeral,
  type TaskWithEphemeral,
} from '../data/types'
import {
  princessActiveIcon,
  princessBiteIcon,
  princessEatingBreakfastIcon,
  princessEatingDinnerIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessEatingLunchIcon,
  princessGiveStarIcon,
  princessMathsIcon,
  princessMathsCorrectImage,
  princessMathsIncorrectImage,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayWinterImage,
  princessPlateImage,
  princessResetIcon,
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

const ManageTasksPage = () => {
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
    createDayNight,
    awardDayNight,
    mathComplete,
    mathFail,
    mathReset,
    pvComplete,
    pvFail,
    pvReset,
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
  const [mathCheckTriggerByTask, setMathCheckTriggerByTask] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggerByTask, setPVCheckTriggerByTask] = useState<
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
    biteCooldownSeconds,
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
    resetKeys: [activeChildId],
  })

  // Clear the princess cooldown test icon when the dinner game ends
  useEffect(() => {
    if (!activeDinnerTaskId && !pendingDinnerBiteTaskId) {
      setBiteCooldownTestIconIndex(null)
    }
  }, [activeDinnerTaskId, pendingDinnerBiteTaskId])

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

  const handleCreateDayNight = async () => {
    await createDayNight()
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

  const handleDelete = async (id: string) => {
    await deleteTask(id)
    clearDinnerTaskState(id)
    if (activeMathTaskId === id) setActiveMathTaskId(null)
    if (activePVTaskId === id) setActivePVTaskId(null)
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
  }

  const handleDinnerBite = (task: EatingTaskWithEphemeral) => {
    setBiteCooldownTestIconIndex(null)
    queueDinnerBite(task)
  }

  const handleDinnerReset = async (task: EatingTaskWithEphemeral) => {
    setBiteCooldownTestIconIndex(null)
    await resetDinnerActivity(task, dinnerReset)
  }

  const setupStatusRules: SetupStatusActionRule<TaskWithEphemeral>[] = [
    {
      matches: isEatingTask,
      isInTask: (task) => {
        const eatingTask = task as EatingTaskWithEphemeral
        return (
          isDinnerTaskRunning(eatingTask) ||
          Boolean(eatingTask.manageDinnerCompletedAt)
        )
      },
      resetAriaLabel: 'Reset dinner chore',
      onReset: (task) => handleDinnerReset(task as EatingTaskWithEphemeral),
    },
    {
      matches: isMathTask,
      isInTask: (task) => {
        const mathTask = task as MathTaskWithEphemeral
        return (
          activeMathTaskId === mathTask.id ||
          Boolean(mathTask.manageMathCompletedAt)
        )
      },
      resetAriaLabel: 'Reset arithmetic chore',
      onReset: (task) => handleMathReset(task as MathTaskWithEphemeral),
    },
    {
      matches: isPositionalNotationTask,
      isInTask: (task) => {
        const pvTask = task as PVTaskWithEphemeral
        return (
          activePVTaskId === pvTask.id || Boolean(pvTask.managePVCompletedAt)
        )
      },
      resetAriaLabel: 'Reset positional notation chore',
      onReset: (task) => handlePVReset(task as PVTaskWithEphemeral),
    },
  ]

  const getSetupStatusAction = (task: TaskWithEphemeral) =>
    resolveSetupStatusAction(task, setupStatusRules, 'Delete chore')

  const handleAwardDayNight = async (task: DayNightTaskWithEphemeral) => {
    setIsAwarding(true)
    try {
      await awardDayNight(task)
    } catch (error) {
      console.error('Failed to award stars', error)
      alert('Failed to award stars. Please try again.')
    } finally {
      setIsAwarding(false)
    }
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

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Chores"
        fontFamily={theme.fonts.heading}
        right={
          <TopIconButton
            theme={theme}
            to="/today"
            ariaLabel="Today"
            icon={
              <img
                src={princessActiveIcon}
                alt="Today"
                className="h-10 w-10 object-contain"
              />
            }
          />
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
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
                isHighlighted={(task) => isManageTaskCompleted(task)}
                renderItem={(task) =>
                  isEatingTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <div
                        style={{
                          fontFamily: theme.fonts.heading,
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          lineHeight: 1.2,
                        }}
                      >
                        {task.title}
                      </div>

                      <DinnerCountdown
                        theme={theme}
                        duration={
                          task.dinnerDurationSeconds ??
                          DEFAULT_DINNER_DURATION_SECONDS
                        }
                        remaining={getManageDinnerLiveRemaining(task)}
                        totalBites={
                          task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                        }
                        bitesLeft={getManageDinnerBitesLeft(task)}
                        starReward={task.starValue}
                        isTimerRunning={isDinnerTaskRunning(task)}
                        plateImage={
                          theme.id === 'princess'
                            ? princessPlateImage
                            : undefined
                        }
                        onAdjustTime={(delta) => {
                          const cur =
                            task.dinnerDurationSeconds ??
                            DEFAULT_DINNER_DURATION_SECONDS
                          const next = Math.max(
                            5 * 60,
                            Math.min(30 * 60, cur + delta)
                          )
                          updateTaskField(task.id, {
                            dinnerDurationSeconds: next,
                          })
                          updateEphemeral(task.id, {
                            manageDinnerRemainingSeconds: next,
                          })
                        }}
                        onAdjustBites={(delta) => {
                          const cur =
                            task.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                          const next = Math.max(1, Math.min(16, cur + delta))
                          updateTaskField(task.id, {
                            dinnerTotalBites: next,
                          })
                          updateEphemeral(task.id, {
                            manageDinnerBitesLeft: next,
                          })
                        }}
                        onStarsChange={(value) =>
                          updateTaskField(task.id, {
                            starValue: value,
                          })
                        }
                        isCompleted={Boolean(task.manageDinnerCompletedAt)}
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
                          theme.id === 'princess'
                            ? activePrincessCooldownIcon
                            : undefined
                        }
                        onBiteIconClick={
                          theme.id === 'princess'
                            ? handleCycleCooldownTestIcon
                            : undefined
                        }
                        showSetupControls={
                          !isDinnerTaskRunning(task) &&
                          !task.manageDinnerCompletedAt
                        }
                        showStarReward={
                          !isDinnerTaskRunning(task) &&
                          !task.manageDinnerCompletedAt
                        }
                      />

                      {!isDinnerTaskRunning(task) &&
                      !task.manageDinnerCompletedAt
                        ? renderDayTypeControl(task)
                        : null}
                    </div>
                  ) : isMathTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <ActionTextInput
                        theme={theme}
                        label="Chore Name"
                        value={titleDrafts[task.id] ?? task.title}
                        onChange={(value) => setTitleDraft(task.id, value)}
                        onCommit={(value) => commitTitle(task.id, value)}
                        maxLength={80}
                        baseColor={theme.colors.primary}
                        inputAriaLabel="Chore name"
                        transparent
                      />

                      <ArithmeticTester
                        theme={theme}
                        totalProblems={
                          task.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
                        }
                        starReward={task.starValue}
                        isRunning={activeMathTaskId === task.id}
                        isCompleted={Boolean(task.manageMathCompletedAt)}
                        isFailed={task.manageMathLastOutcome === 'failure'}
                        onAdjustProblems={(delta) => {
                          const cur =
                            task.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
                          const next = Math.max(1, Math.min(10, cur + delta))
                          updateTaskField(task.id, { mathTotalProblems: next })
                        }}
                        onStarsChange={(value) =>
                          updateTaskField(task.id, { starValue: value })
                        }
                        onComplete={() => handleMathComplete(task)}
                        onFail={() => handleMathFail(task)}
                        checkTrigger={mathCheckTriggerByTask[task.id] ?? 0}
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
                      {!task.manageMathCompletedAt &&
                      activeMathTaskId !== task.id
                        ? renderDayTypeControl(task)
                        : null}
                    </div>
                  ) : isPositionalNotationTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <ActionTextInput
                        theme={theme}
                        label="Chore Name"
                        value={titleDrafts[task.id] ?? task.title}
                        onChange={(value) => setTitleDraft(task.id, value)}
                        onCommit={(value) => commitTitle(task.id, value)}
                        maxLength={80}
                        baseColor={theme.colors.primary}
                        inputAriaLabel="Chore name"
                        transparent
                      />

                      <PositionalNotation
                        theme={theme}
                        totalProblems={
                          task.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
                        }
                        starReward={task.starValue}
                        isRunning={activePVTaskId === task.id}
                        isCompleted={Boolean(task.managePVCompletedAt)}
                        isFailed={task.managePVLastOutcome === 'failure'}
                        onAdjustProblems={(delta: number) => {
                          const cur =
                            task.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
                          const next = Math.max(1, Math.min(10, cur + delta))
                          updateTaskField(task.id, { pvTotalProblems: next })
                        }}
                        onStarsChange={(value: number) =>
                          updateTaskField(task.id, { starValue: value })
                        }
                        onComplete={() => handlePVComplete(task)}
                        onFail={() => handlePVFail(task)}
                        checkTrigger={pvCheckTriggerByTask[task.id] ?? 0}
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
                      {!task.managePVCompletedAt && activePVTaskId !== task.id
                        ? renderDayTypeControl(task)
                        : null}
                    </div>
                  ) : isDayNightTask(task) ? (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <DayNightExplorer theme={theme} />
                    </div>
                  ) : (
                    <div
                      className="flex flex-col"
                      style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                    >
                      <ActionTextInput
                        theme={theme}
                        label="Chore Name"
                        value={titleDrafts[task.id] ?? task.title}
                        onChange={(value) => setTitleDraft(task.id, value)}
                        onCommit={(value) => commitTitle(task.id, value)}
                        maxLength={80}
                        baseColor={theme.colors.primary}
                        inputAriaLabel="Chore name"
                        transparent
                      />

                      <StarDisplay
                        theme={theme}
                        count={task.starValue}
                        editable
                        onChange={(nextValue) =>
                          updateTaskField(task.id, {
                            starValue: nextValue || 1,
                          })
                        }
                        min={1}
                        max={3}
                      />

                      <RepeatControl
                        theme={theme}
                        value={task.isRepeating}
                        onChange={(nextValue) =>
                          updateTaskField(task.id, { isRepeating: nextValue })
                        }
                        showLabel={false}
                        showFeedback={false}
                      />

                      {renderDayTypeControl(task)}
                    </div>
                  )
                }
                primaryAction={{
                  label: (task) => {
                    if (isEatingTask(task)) {
                      const isFinished = Boolean(task.manageDinnerCompletedAt)
                      if (isFinished) return 'Again 🔁'
                      return isDinnerTaskRunning(task) ? 'Bite' : 'Start'
                    }
                    if (isMathTask(task)) {
                      if (task.manageMathCompletedAt) return 'Again 🔁'
                      return activeMathTaskId === task.id
                        ? 'Check Answer'
                        : 'Start'
                    }
                    if (isPositionalNotationTask(task)) {
                      if (task.managePVCompletedAt) return 'Again 🔁'
                      return activePVTaskId === task.id
                        ? 'Check Answer'
                        : 'Start'
                    }
                    if (isDayNightTask(task)) {
                      return task.manageCompletedAt ? 'Done' : 'Give'
                    }
                    return task.manageCompletedAt ? 'Done' : 'Give'
                  },
                  icon: (task) => {
                    if (isEatingTask(task)) {
                      const isFinished = Boolean(task.manageDinnerCompletedAt)
                      if (!isFinished) {
                        return (
                          <img
                            src={
                              theme.id === 'princess'
                                ? activePrincessCooldownIcon
                                : princessBiteIcon
                            }
                            alt={isDinnerTaskRunning(task) ? 'Bite' : 'Start'}
                            className="h-6 w-6 object-contain"
                          />
                        )
                      }
                      // Finished — show plate icon for "play again"
                      return (
                        <img
                          src={princessPlateImage}
                          alt="Play again"
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    if (isMathTask(task)) {
                      const isFinished = Boolean(task.manageMathCompletedAt)
                      const isRunning =
                        activeMathTaskId === task.id && !isFinished
                      return (
                        <img
                          src={
                            isRunning
                              ? princessMathsIcon
                              : isFinished
                                ? princessMathsIcon
                                : princessGiveStarIcon
                          }
                          alt={
                            isFinished
                              ? 'Play again'
                              : isRunning
                                ? 'Check answer'
                                : 'Start'
                          }
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    if (isPositionalNotationTask(task)) {
                      const isFinished = Boolean(task.managePVCompletedAt)
                      const isRunning =
                        activePVTaskId === task.id && !isFinished
                      return (
                        <img
                          src={
                            isRunning
                              ? princessMathsIcon
                              : isFinished
                                ? princessMathsIcon
                                : princessGiveStarIcon
                          }
                          alt={
                            isFinished
                              ? 'Play again'
                              : isRunning
                                ? 'Check answer'
                                : 'Start'
                          }
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    if (isDayNightTask(task)) {
                      return (
                        <img
                          src={
                            task.manageCompletedAt
                              ? princessActiveIcon
                              : princessGiveStarIcon
                          }
                          alt={
                            task.manageCompletedAt ? 'Completed' : 'Give star'
                          }
                          className="h-6 w-6 object-contain"
                        />
                      )
                    }
                    return (
                      <img
                        src={
                          task.manageCompletedAt
                            ? princessActiveIcon
                            : princessGiveStarIcon
                        }
                        alt={task.manageCompletedAt ? 'Completed' : 'Give star'}
                        className="h-6 w-6 object-contain"
                      />
                    )
                  },
                  onClick: (task) => {
                    if (isEatingTask(task)) {
                      const isFinished = Boolean(task.manageDinnerCompletedAt)
                      if (isFinished) {
                        handleDinnerReset(task)
                        return
                      }
                      if (isDinnerTaskRunning(task)) {
                        handleDinnerBite(task)
                      } else {
                        dinnerStartTimer(task)
                        startDinnerActivity(task.id)
                      }
                    } else if (isMathTask(task)) {
                      if (task.manageMathCompletedAt) {
                        handleMathReset(task)
                        return
                      }
                      if (activeMathTaskId === task.id) {
                        setMathCheckTriggerByTask((prev) => ({
                          ...prev,
                          [task.id]: (prev[task.id] ?? 0) + 1,
                        }))
                      } else {
                        setActiveMathTaskId(task.id)
                      }
                    } else if (isPositionalNotationTask(task)) {
                      if (task.managePVCompletedAt) {
                        handlePVReset(task)
                        return
                      }
                      if (activePVTaskId === task.id) {
                        setPVCheckTriggerByTask((prev) => ({
                          ...prev,
                          [task.id]: (prev[task.id] ?? 0) + 1,
                        }))
                      } else {
                        setActivePVTaskId(task.id)
                      }
                    } else if (isDayNightTask(task)) {
                      if (task.manageCompletedAt) {
                        return
                      }
                      handleAwardDayNight(task)
                    } else if (task.manageCompletedAt) {
                      return
                    } else {
                      handleAwardTask(task)
                    }
                  },
                  disabled: (task) => {
                    if (isEatingTask(task)) {
                      // Disable bite button during chewing cooldown
                      if (isDinnerTaskRunning(task) && biteCooldownSeconds > 0)
                        return true
                      return false
                    }
                    if (isMathTask(task)) {
                      return false
                    }
                    if (isPositionalNotationTask(task)) {
                      return false
                    }
                    if (isDayNightTask(task)) {
                      return (
                        isAwarding ||
                        !activeChildId ||
                        Boolean(task.manageCompletedAt)
                      )
                    }
                    return (
                      isAwarding ||
                      !activeChildId ||
                      Boolean(task.manageCompletedAt)
                    )
                  },
                  variant: 'primary',
                  showLabel: () => false,
                }}
                hideEdit
                utilityAction={{
                  label: (task) => getSetupStatusAction(task).label,
                  ariaLabel: (task) => getSetupStatusAction(task).ariaLabel,
                  icon: (task) =>
                    getSetupStatusAction(task).isReset &&
                    theme.id === 'princess' ? (
                      <img
                        src={princessResetIcon}
                        alt="Reset"
                        className="h-6 w-6 object-contain"
                      />
                    ) : undefined,
                  onClick: (task) =>
                    runSetupStatusAction(task, setupStatusRules, (item) =>
                      handleDelete(item.id)
                    ),
                  exits: (task) => getSetupStatusAction(task).exits,
                  variant: (task) => getSetupStatusAction(task).variant,
                }}
                onDelete={(task) => handleDelete(task.id)}
                addLabel="Chore"
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
                        Chore
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
                        Eating
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
                        Place Notation
                      </button>

                      <button
                        type="button"
                        className="whimsical-btn"
                        onClick={handleCreateDayNight}
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
                        Day &amp; Night
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
      </div>
    </PageShell>
  )
}

export default ManageTasksPage
