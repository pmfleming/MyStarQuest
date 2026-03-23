import { useEffect, useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import ActionButton from '../components/ActionButton'
import StandardActionList from '../components/StandardActionList'
import { uiTokens } from '../ui/tokens'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { getSeasonForDate } from '../lib/today'
import { useChores } from '../data/useChores'
import type { TaskRecord, TaskWithEphemeral } from '../data/types'
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
    taskTitleDrafts,
    setTaskTitleDraft,
    commitTaskTitle,
    updateTaskField,
    updateEphemeral,
    createStandardTask,
    createEatingTask,
    createMathTask,
    createPVTask,
    createAlphabetTask,
    completeChore,
    failChore,
    resetChore,
    deleteTask,
    applyBite,
    startDinnerTimer,
    expireDinnerTimer,
    resetDinner,
  } = useChores()

  const [activeMathId, setActiveMathId] = useState<string | null>(null)
  const [activePVId, setActivePVId] = useState<string | null>(null)
  const [activeAlphabetId, setActiveAlphabetId] = useState<string | null>(null)
  const [activeDinnerId, setActiveDinnerId] = useState<string | null>(null)

  const [mathCheckTriggers, setMathCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggers, setPVCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [alphabetCheckTriggers, setAlphabetCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [showAddChooser, setShowAddChooser] = useState(false)

  const [biteCooldownTestIconIndex, setBiteCooldownTestIconIndex] = useState<
    number | null
  >(null)

  const currentSeason = getSeasonForDate(new Date())
  const princessNonSchoolDayImage = getPrincessNonSchoolDayImage(currentSeason)

  // Clear sub-activity states when the main activity ends
  useEffect(() => {
    if (!activeDinnerId) {
      setBiteCooldownTestIconIndex(null)
    }
  }, [activeDinnerId])

  const biteCooldownSeconds = 15 // Fixed constant from types.ts

  const activePrincessMealIcon = (() => {
    const defaultIcon = getPrincessCooldownIconForHour(new Date().getHours())
    if (biteCooldownTestIconIndex === null) return defaultIcon
    return princessBiteIconCycle[biteCooldownTestIconIndex] ?? defaultIcon
  })()

  const clearActiveActivities = () => {
    setActiveMathId(null)
    setActivePVId(null)
    setActiveAlphabetId(null)
    setActiveDinnerId(null)
  }

  const renderDayTypeControl = (task: TaskRecord) => {
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

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'manage',
    onUpdateTaskField: updateTaskField,
    onUpdateEphemeral: updateEphemeral,
    onSetTitleDraft: setTaskTitleDraft,
    onCommitTitle: commitTaskTitle,
    onDeleteTask: deleteTask,
    onComplete: (item) => {
      const task = item as TaskWithEphemeral
      if (task.taskType === 'standard') completeChore(task)
      else if (task.taskType === 'math') {
        clearActiveActivities()
        setActiveMathId(task.id)
      } else if (task.taskType === 'positional-notation') {
        clearActiveActivities()
        setActivePVId(task.id)
      } else if (task.taskType === 'alphabet') {
        clearActiveActivities()
        setActiveAlphabetId(task.id)
      }
    },
    onFail: failChore,
    onReset: (item) => {
      const task = item as TaskWithEphemeral
      if (task.taskType === 'eating') resetDinner(task)
      else resetChore(task)
      clearActiveActivities()
    },
    onStartDinner: (item) => {
      if (!item) {
        setActiveDinnerId(null)
        return
      }
      const task = item as TaskWithEphemeral
      clearActiveActivities()
      startDinnerTimer(task)
      setActiveDinnerId(task.id)
    },
    onApplyBite: applyBite,
    onExpireDinner: expireDinnerTimer,
    titleDrafts: taskTitleDrafts,
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
    activePrincessMealIcon,
    renderDayTypeControl,
  })

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
              {...toStandardActionListDescriptor(descriptor)}
              hideEdit
              onDelete={(task) => deleteTask(task.id)}
              addLabel="New Chore"
              onAdd={() => setShowAddChooser(true)}
              inlineNewRow={
                showAddChooser ? (
                  <div
                    className="grid grid-cols-1"
                    style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                  >
                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={() => {
                        createStandardTask()
                        setShowAddChooser(false)
                      }}
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
                      onClick={() => {
                        createEatingTask()
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
                        fontSize: '1.15rem',
                      }}
                    >
                      Dinner
                    </button>
                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={() => {
                        createMathTask()
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
                        fontSize: '1.15rem',
                      }}
                    >
                      Arithmetic
                    </button>
                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={() => {
                        createPVTask()
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
                        fontSize: '1.15rem',
                      }}
                    >
                      Positional Notation
                    </button>
                    <button
                      type="button"
                      className="whimsical-btn"
                      onClick={() => {
                        createAlphabetTask()
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
