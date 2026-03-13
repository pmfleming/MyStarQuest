import type { Dispatch, ReactNode, SetStateAction } from 'react'
import ActionTextInput from '../components/ActionTextInput'
import ArithmeticTester from '../components/ArithmeticTester'
import DayNightExplorer from '../components/DayNightExplorer'
import DinnerCountdown from '../components/DinnerCountdown'
import PositionalNotation from '../components/PositionalNotation'
import RepeatControl from '../components/RepeatControl'
import StarDisplay from '../components/StarDisplay'
import {
  princessActiveIcon,
  princessBiteIcon,
  princessChoresIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessMathsCorrectImage,
  princessMathsIcon,
  princessMathsIncorrectImage,
  princessPlateImage,
  princessResetIcon,
} from '../assets/themes/princess/assets'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  getManageDinnerBitesLeft,
  getManageDinnerLiveRemaining,
  isManageTaskCompleted,
  type DayNightTaskWithEphemeral,
  type EatingTaskWithEphemeral,
  type MathTaskWithEphemeral,
  type PVTaskWithEphemeral,
  type StandardTaskWithEphemeral,
  type TaskWithEphemeral,
} from '../data/types'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from './tokens'
import type { ListRowDescriptor } from './listDescriptorTypes'

type ChoreUiKind = 'configOnly' | 'complexChore' | 'simpleChore'
type ChoreStage = 'setup' | 'activity' | 'completed'

type ManageTaskTypeUiDescriptor = {
  kind: ChoreUiKind
  getStage: (task: TaskWithEphemeral) => ChoreStage
  renderItem: (task: TaskWithEphemeral) => ReactNode
  getStarCount?: (task: TaskWithEphemeral) => number | undefined
  getPrimaryAction: (task: TaskWithEphemeral) => {
    label: string
    ariaLabel?: string
    icon: ReactNode
    disabled?: boolean
    variant?: 'primary' | 'neutral' | 'danger'
    showLabel?: boolean
    onClick: (item: TaskWithEphemeral) => void | Promise<void>
  }
  getUtilityAction?: (task: TaskWithEphemeral) => {
    label: string
    ariaLabel: string
    icon?: ReactNode
    exits?: boolean
    variant: 'neutral' | 'danger'
    onClick: (item: TaskWithEphemeral) => void | Promise<void>
  }
}

type ManageTaskDescriptorDeps = {
  theme: Theme
  titleDrafts: Record<string, string>
  setTitleDraft: (taskId: string, value: string) => void
  commitTitle: (taskId: string, value: string) => void | Promise<void>
  updateTaskField: (
    taskId: string,
    value: Record<string, unknown>
  ) => void | Promise<void>
  updateEphemeral: (
    taskId: string,
    value: Record<string, unknown>
  ) => void | Promise<void>
  renderDayTypeControl: (task: TaskWithEphemeral) => ReactNode
  activeMathTaskId: string | null
  activePVTaskId: string | null
  mathCheckTriggerByTask: Record<string, number>
  pvCheckTriggerByTask: Record<string, number>
  isDinnerTaskRunning: (task: EatingTaskWithEphemeral) => boolean
  biteCooldownSeconds: number
  activePrincessCooldownIcon?: string
  handleCycleCooldownTestIcon?: () => void
  handleDinnerBite: (task: EatingTaskWithEphemeral) => void
  dinnerStartTimer: (task: EatingTaskWithEphemeral) => void
  startDinnerActivity: (taskId: string) => void
  handleDinnerReset: (task: EatingTaskWithEphemeral) => void | Promise<void>
  handleMathComplete: (task: MathTaskWithEphemeral) => void | Promise<void>
  handleMathFail: (task: MathTaskWithEphemeral) => void | Promise<void>
  handleMathReset: (task: MathTaskWithEphemeral) => void | Promise<void>
  setActiveMathTaskId: (taskId: string | null) => void
  setMathCheckTriggerByTask: Dispatch<SetStateAction<Record<string, number>>>
  handlePVComplete: (task: PVTaskWithEphemeral) => void | Promise<void>
  handlePVFail: (task: PVTaskWithEphemeral) => void | Promise<void>
  handlePVReset: (task: PVTaskWithEphemeral) => void | Promise<void>
  setActivePVTaskId: (taskId: string | null) => void
  setPVCheckTriggerByTask: Dispatch<SetStateAction<Record<string, number>>>
  handleAwardDayNight: (task: DayNightTaskWithEphemeral) => void | Promise<void>
  handleAwardTask: (task: StandardTaskWithEphemeral) => void | Promise<void>
  handleDelete: (taskId: string) => void | Promise<void>
  isAwarding: boolean
  activeChildId: string | null
}

const getResetUtilityAction = (
  ariaLabel: string,
  onClick: (task: TaskWithEphemeral) => void | Promise<void>,
  theme: Theme
) => ({
  label: 'Reset',
  ariaLabel,
  icon:
    theme.id === 'princess' ? (
      <img
        src={princessResetIcon}
        alt="Reset"
        className="h-6 w-6 object-contain"
      />
    ) : undefined,
  exits: false,
  variant: 'neutral' as const,
  onClick,
})

const getDeleteUtilityAction = (
  ariaLabel: string,
  onClick: (task: TaskWithEphemeral) => void | Promise<void>
) => ({
  label: 'Delete',
  ariaLabel,
  exits: true,
  variant: 'danger' as const,
  onClick,
})

export const createManageTaskListRowDescriptor = (
  deps: ManageTaskDescriptorDeps
): ListRowDescriptor<TaskWithEphemeral> => {
  const descriptorByType: Record<
    TaskWithEphemeral['taskType'],
    ManageTaskTypeUiDescriptor
  > = {
    standard: {
      kind: 'configOnly',
      getStage: (task) => {
        const standardTask = task as StandardTaskWithEphemeral
        return standardTask.manageCompletedAt ? 'completed' : 'setup'
      },
      renderItem: (task) => {
        const standardTask = task as StandardTaskWithEphemeral
        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            <ActionTextInput
              theme={deps.theme}
              label="Chore Name"
              value={deps.titleDrafts[standardTask.id] ?? standardTask.title}
              onChange={(value) => deps.setTitleDraft(standardTask.id, value)}
              onCommit={(value) => deps.commitTitle(standardTask.id, value)}
              maxLength={80}
              baseColor={deps.theme.colors.primary}
              inputAriaLabel="Chore name"
              transparent
            />

            <StarDisplay
              theme={deps.theme}
              count={standardTask.starValue}
              editable
              onChange={(nextValue) =>
                deps.updateTaskField(standardTask.id, {
                  starValue: nextValue || 1,
                })
              }
              min={1}
              max={3}
            />

            <RepeatControl
              theme={deps.theme}
              value={standardTask.isRepeating}
              onChange={(nextValue) =>
                deps.updateTaskField(standardTask.id, {
                  isRepeating: nextValue,
                })
              }
              showLabel={false}
              showFeedback={false}
            />

            {deps.renderDayTypeControl(standardTask)}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const standardTask = task as StandardTaskWithEphemeral
        return {
          label: standardTask.manageCompletedAt ? 'Done' : 'Give',
          icon: (
            <img
              src={
                standardTask.manageCompletedAt
                  ? princessActiveIcon
                  : princessGiveStarIcon
              }
              alt={standardTask.manageCompletedAt ? 'Completed' : 'Give star'}
              className="h-6 w-6 object-contain"
            />
          ),
          disabled:
            deps.isAwarding ||
            !deps.activeChildId ||
            Boolean(standardTask.manageCompletedAt),
          variant: 'primary',
          showLabel: false,
          onClick: (item) =>
            deps.handleAwardTask(item as StandardTaskWithEphemeral),
        }
      },
      getUtilityAction: () =>
        getDeleteUtilityAction('Delete chore', (item) =>
          deps.handleDelete(item.id)
        ),
    },
    eating: {
      kind: 'complexChore',
      getStage: (task) => {
        const eatingTask = task as EatingTaskWithEphemeral
        if (eatingTask.manageDinnerCompletedAt) return 'completed'
        return deps.isDinnerTaskRunning(eatingTask) ? 'activity' : 'setup'
      },
      renderItem: (task) => {
        const eatingTask = task as EatingTaskWithEphemeral
        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            <div
              style={{
                fontFamily: deps.theme.fonts.heading,
                fontSize: '1.25rem',
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {eatingTask.title}
            </div>

            <DinnerCountdown
              theme={deps.theme}
              duration={
                eatingTask.dinnerDurationSeconds ??
                DEFAULT_DINNER_DURATION_SECONDS
              }
              remaining={getManageDinnerLiveRemaining(eatingTask)}
              totalBites={eatingTask.dinnerTotalBites ?? DEFAULT_DINNER_BITES}
              bitesLeft={getManageDinnerBitesLeft(eatingTask)}
              starReward={eatingTask.starValue}
              isTimerRunning={deps.isDinnerTaskRunning(eatingTask)}
              plateImage={
                deps.theme.id === 'princess' ? princessPlateImage : undefined
              }
              onAdjustTime={(delta) => {
                const cur =
                  eatingTask.dinnerDurationSeconds ??
                  DEFAULT_DINNER_DURATION_SECONDS
                const next = Math.max(5 * 60, Math.min(30 * 60, cur + delta))
                deps.updateTaskField(eatingTask.id, {
                  dinnerDurationSeconds: next,
                })
                deps.updateEphemeral(eatingTask.id, {
                  manageDinnerRemainingSeconds: next,
                })
              }}
              onAdjustBites={(delta) => {
                const cur = eatingTask.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                const next = Math.max(1, Math.min(16, cur + delta))
                deps.updateTaskField(eatingTask.id, { dinnerTotalBites: next })
                deps.updateEphemeral(eatingTask.id, {
                  manageDinnerBitesLeft: next,
                })
              }}
              onStarsChange={(value) =>
                deps.updateTaskField(eatingTask.id, { starValue: value })
              }
              isCompleted={Boolean(eatingTask.manageDinnerCompletedAt)}
              completionImage={
                deps.theme.id === 'princess'
                  ? princessEatingFullImage
                  : undefined
              }
              failureImage={
                deps.theme.id === 'princess'
                  ? princessEatingFailImage
                  : undefined
              }
              biteCooldownSeconds={deps.biteCooldownSeconds}
              biteIcon={
                deps.theme.id === 'princess'
                  ? deps.activePrincessCooldownIcon
                  : undefined
              }
              onBiteIconClick={
                deps.theme.id === 'princess'
                  ? deps.handleCycleCooldownTestIcon
                  : undefined
              }
              showSetupControls={
                !deps.isDinnerTaskRunning(eatingTask) &&
                !eatingTask.manageDinnerCompletedAt
              }
              showStarReward={
                !deps.isDinnerTaskRunning(eatingTask) &&
                !eatingTask.manageDinnerCompletedAt
              }
            />

            {!deps.isDinnerTaskRunning(eatingTask) &&
            !eatingTask.manageDinnerCompletedAt
              ? deps.renderDayTypeControl(eatingTask)
              : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const eatingTask = task as EatingTaskWithEphemeral
        const isFinished = Boolean(eatingTask.manageDinnerCompletedAt)
        return {
          label: isFinished
            ? 'Again 🔁'
            : deps.isDinnerTaskRunning(eatingTask)
              ? 'Bite'
              : 'Start',
          icon: !isFinished ? (
            <img
              src={
                deps.theme.id === 'princess'
                  ? deps.activePrincessCooldownIcon
                  : princessBiteIcon
              }
              alt={deps.isDinnerTaskRunning(eatingTask) ? 'Bite' : 'Start'}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <img
              src={princessPlateImage}
              alt="Play again"
              className="h-6 w-6 object-contain"
            />
          ),
          disabled:
            deps.isDinnerTaskRunning(eatingTask) &&
            deps.biteCooldownSeconds > 0,
          variant: 'primary',
          showLabel: false,
          onClick: (item) => {
            const currentTask = item as EatingTaskWithEphemeral
            if (currentTask.manageDinnerCompletedAt) {
              return deps.handleDinnerReset(currentTask)
            }
            if (deps.isDinnerTaskRunning(currentTask)) {
              deps.handleDinnerBite(currentTask)
              return
            }
            deps.dinnerStartTimer(currentTask)
            deps.startDinnerActivity(currentTask.id)
          },
        }
      },
      getUtilityAction: (task) => {
        const eatingTask = task as EatingTaskWithEphemeral
        const inActivity =
          deps.isDinnerTaskRunning(eatingTask) ||
          Boolean(eatingTask.manageDinnerCompletedAt)
        return inActivity
          ? getResetUtilityAction(
              'Reset dinner chore',
              (item) => deps.handleDinnerReset(item as EatingTaskWithEphemeral),
              deps.theme
            )
          : getDeleteUtilityAction('Delete chore', (item) =>
              deps.handleDelete(item.id)
            )
      },
    },
    math: {
      kind: 'complexChore',
      getStage: (task) => {
        const mathTask = task as MathTaskWithEphemeral
        if (mathTask.manageMathCompletedAt) return 'completed'
        return deps.activeMathTaskId === mathTask.id ? 'activity' : 'setup'
      },
      renderItem: (task) => {
        const mathTask = task as MathTaskWithEphemeral
        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            <ActionTextInput
              theme={deps.theme}
              label="Chore Name"
              value={deps.titleDrafts[mathTask.id] ?? mathTask.title}
              onChange={(value) => deps.setTitleDraft(mathTask.id, value)}
              onCommit={(value) => deps.commitTitle(mathTask.id, value)}
              maxLength={80}
              baseColor={deps.theme.colors.primary}
              inputAriaLabel="Chore name"
              transparent
            />

            <ArithmeticTester
              theme={deps.theme}
              totalProblems={
                mathTask.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
              }
              starReward={mathTask.starValue}
              isRunning={deps.activeMathTaskId === mathTask.id}
              isCompleted={Boolean(mathTask.manageMathCompletedAt)}
              isFailed={mathTask.manageMathLastOutcome === 'failure'}
              onAdjustProblems={(delta) => {
                const cur = mathTask.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
                const next = Math.max(1, Math.min(10, cur + delta))
                deps.updateTaskField(mathTask.id, { mathTotalProblems: next })
              }}
              onStarsChange={(value) =>
                deps.updateTaskField(mathTask.id, { starValue: value })
              }
              onComplete={() => deps.handleMathComplete(mathTask)}
              onFail={() => deps.handleMathFail(mathTask)}
              checkTrigger={deps.mathCheckTriggerByTask[mathTask.id] ?? 0}
              completionImage={
                deps.theme.id === 'princess'
                  ? princessMathsCorrectImage
                  : undefined
              }
              failureImage={
                deps.theme.id === 'princess'
                  ? princessMathsIncorrectImage
                  : undefined
              }
            />

            {!mathTask.manageMathCompletedAt &&
            deps.activeMathTaskId !== mathTask.id
              ? deps.renderDayTypeControl(mathTask)
              : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const mathTask = task as MathTaskWithEphemeral
        const isFinished = Boolean(mathTask.manageMathCompletedAt)
        const isRunning = deps.activeMathTaskId === mathTask.id && !isFinished
        return {
          label: isFinished ? 'Again 🔁' : isRunning ? 'Check Answer' : 'Start',
          icon: (
            <img
              src={
                isRunning
                  ? princessMathsIcon
                  : isFinished
                    ? princessMathsIcon
                    : princessGiveStarIcon
              }
              alt={
                isFinished ? 'Play again' : isRunning ? 'Check answer' : 'Start'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          variant: 'primary',
          showLabel: false,
          onClick: (item) => {
            const currentTask = item as MathTaskWithEphemeral
            if (currentTask.manageMathCompletedAt) {
              return deps.handleMathReset(currentTask)
            }
            if (deps.activeMathTaskId === currentTask.id) {
              deps.setMathCheckTriggerByTask((prev) => ({
                ...prev,
                [currentTask.id]: (prev[currentTask.id] ?? 0) + 1,
              }))
              return
            }
            deps.setActiveMathTaskId(currentTask.id)
          },
        }
      },
      getUtilityAction: (task) => {
        const mathTask = task as MathTaskWithEphemeral
        const inActivity =
          deps.activeMathTaskId === mathTask.id ||
          Boolean(mathTask.manageMathCompletedAt)
        return inActivity
          ? getResetUtilityAction(
              'Reset arithmetic chore',
              (item) => deps.handleMathReset(item as MathTaskWithEphemeral),
              deps.theme
            )
          : getDeleteUtilityAction('Delete chore', (item) =>
              deps.handleDelete(item.id)
            )
      },
    },
    'positional-notation': {
      kind: 'complexChore',
      getStage: (task) => {
        const pvTask = task as PVTaskWithEphemeral
        if (pvTask.managePVCompletedAt) return 'completed'
        return deps.activePVTaskId === pvTask.id ? 'activity' : 'setup'
      },
      renderItem: (task) => {
        const pvTask = task as PVTaskWithEphemeral
        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            <ActionTextInput
              theme={deps.theme}
              label="Chore Name"
              value={deps.titleDrafts[pvTask.id] ?? pvTask.title}
              onChange={(value) => deps.setTitleDraft(pvTask.id, value)}
              onCommit={(value) => deps.commitTitle(pvTask.id, value)}
              maxLength={80}
              baseColor={deps.theme.colors.primary}
              inputAriaLabel="Chore name"
              transparent
            />

            <PositionalNotation
              theme={deps.theme}
              totalProblems={pvTask.pvTotalProblems ?? DEFAULT_PV_PROBLEMS}
              starReward={pvTask.starValue}
              isRunning={deps.activePVTaskId === pvTask.id}
              isCompleted={Boolean(pvTask.managePVCompletedAt)}
              isFailed={pvTask.managePVLastOutcome === 'failure'}
              onAdjustProblems={(delta: number) => {
                const cur = pvTask.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
                const next = Math.max(1, Math.min(10, cur + delta))
                deps.updateTaskField(pvTask.id, { pvTotalProblems: next })
              }}
              onStarsChange={(value: number) =>
                deps.updateTaskField(pvTask.id, { starValue: value })
              }
              onComplete={() => deps.handlePVComplete(pvTask)}
              onFail={() => deps.handlePVFail(pvTask)}
              checkTrigger={deps.pvCheckTriggerByTask[pvTask.id] ?? 0}
              completionImage={
                deps.theme.id === 'princess'
                  ? princessMathsCorrectImage
                  : undefined
              }
              failureImage={
                deps.theme.id === 'princess'
                  ? princessMathsIncorrectImage
                  : undefined
              }
            />

            {!pvTask.managePVCompletedAt && deps.activePVTaskId !== pvTask.id
              ? deps.renderDayTypeControl(pvTask)
              : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const pvTask = task as PVTaskWithEphemeral
        const isFinished = Boolean(pvTask.managePVCompletedAt)
        const isRunning = deps.activePVTaskId === pvTask.id && !isFinished
        return {
          label: isFinished ? 'Again 🔁' : isRunning ? 'Check Answer' : 'Start',
          icon: (
            <img
              src={
                isRunning
                  ? princessMathsIcon
                  : isFinished
                    ? princessMathsIcon
                    : princessGiveStarIcon
              }
              alt={
                isFinished ? 'Play again' : isRunning ? 'Check answer' : 'Start'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          variant: 'primary',
          showLabel: false,
          onClick: (item) => {
            const currentTask = item as PVTaskWithEphemeral
            if (currentTask.managePVCompletedAt) {
              return deps.handlePVReset(currentTask)
            }
            if (deps.activePVTaskId === currentTask.id) {
              deps.setPVCheckTriggerByTask((prev) => ({
                ...prev,
                [currentTask.id]: (prev[currentTask.id] ?? 0) + 1,
              }))
              return
            }
            deps.setActivePVTaskId(currentTask.id)
          },
        }
      },
      getUtilityAction: (task) => {
        const pvTask = task as PVTaskWithEphemeral
        const inActivity =
          deps.activePVTaskId === pvTask.id ||
          Boolean(pvTask.managePVCompletedAt)
        return inActivity
          ? getResetUtilityAction(
              'Reset positional notation chore',
              (item) => deps.handlePVReset(item as PVTaskWithEphemeral),
              deps.theme
            )
          : getDeleteUtilityAction('Delete chore', (item) =>
              deps.handleDelete(item.id)
            )
      },
    },
    daynight: {
      kind: 'simpleChore',
      getStage: (task) => {
        const dayNightTask = task as DayNightTaskWithEphemeral
        return dayNightTask.manageCompletedAt ? 'completed' : 'activity'
      },
      renderItem: () => (
        <div
          className="flex flex-col"
          style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
        >
          <DayNightExplorer theme={deps.theme} />
        </div>
      ),
      getPrimaryAction: (task) => {
        const dayNightTask = task as DayNightTaskWithEphemeral
        return {
          label: dayNightTask.manageCompletedAt ? 'Done' : 'Give',
          icon: (
            <img
              src={
                dayNightTask.manageCompletedAt
                  ? princessActiveIcon
                  : princessChoresIcon
              }
              alt={
                dayNightTask.manageCompletedAt
                  ? 'Completed'
                  : 'Day and night explorer'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          disabled:
            deps.isAwarding ||
            !deps.activeChildId ||
            Boolean(dayNightTask.manageCompletedAt),
          variant: 'primary',
          showLabel: false,
          onClick: (item) =>
            deps.handleAwardDayNight(item as DayNightTaskWithEphemeral),
        }
      },
      getUtilityAction: () =>
        getDeleteUtilityAction('Delete chore', (item) =>
          deps.handleDelete(item.id)
        ),
    },
  }

  const getDescriptor = (task: TaskWithEphemeral) =>
    descriptorByType[task.taskType]

  return {
    renderItem: (task) => getDescriptor(task).renderItem(task),
    getStarCount: (task) => getDescriptor(task).getStarCount?.(task),
    isHighlighted: isManageTaskCompleted,
    getPrimaryAction: (task) => getDescriptor(task).getPrimaryAction(task),
    getUtilityAction: (task) => getDescriptor(task).getUtilityAction!(task),
  }
}
