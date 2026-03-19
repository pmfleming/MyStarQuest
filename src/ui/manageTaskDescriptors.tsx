import type { Dispatch, ReactNode, SetStateAction } from 'react'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import StarDisplay from '../components/StarDisplay'
import {
  princessActiveIcon,
  princessBiteIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessQuizCorrectImage,
  princessMathsIcon,
  princessQuizIncorrectImage,
  princessPlateImage,
} from '../assets/themes/princess/assets'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_ALPHABET_PROBLEMS,
  getManageDinnerBitesLeft,
  getManageDinnerLiveRemaining,
  isManageTaskCompleted,
  type EatingTaskWithEphemeral,
  type MathTaskWithEphemeral,
  type PVTaskWithEphemeral,
  type AlphabetTaskWithEphemeral,
  type StandardTaskWithEphemeral,
  type TaskWithEphemeral,
} from '../data/types'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from './tokens'
import type { ListRowDescriptor } from './listDescriptorTypes'
import {
  shouldHidePresetChoreTitle,
  type ChoreStage,
} from './choreModeDefinitions'
import {
  createDeleteUtilityAction,
  createPresetDinnerPrimaryAction,
  createPresetTestPrimaryAction,
  createPresetUtilityAction,
} from './presetChoreActions'
import {
  renderAlphabetChore,
  renderArithmeticChore,
  renderDinnerChore,
  renderPositionalNotationChore,
} from './presetChoreRenderers'

type ChoreUiKind = 'configOnly' | 'complexChore' | 'simpleChore'

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
    hideButton?: boolean
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
  activeAlphabetTaskId: string | null
  alphabetCheckTriggerByTask: Record<string, number>
  handleAlphabetComplete: (
    task: AlphabetTaskWithEphemeral
  ) => void | Promise<void>
  handleAlphabetFail: (task: AlphabetTaskWithEphemeral) => void | Promise<void>
  handleAlphabetReset: (task: AlphabetTaskWithEphemeral) => void | Promise<void>
  setActiveAlphabetTaskId: (taskId: string | null) => void
  setAlphabetCheckTriggerByTask: Dispatch<
    SetStateAction<Record<string, number>>
  >
  handleAwardTask: (task: StandardTaskWithEphemeral) => void | Promise<void>
  handleDelete: (taskId: string) => void | Promise<void>
  isAwarding: boolean
  activeChildId: string | null
}

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
        createDeleteUtilityAction('Delete chore', (item) =>
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
        const stage = descriptorByType.eating.getStage(task)
        const hideTitle = shouldHidePresetChoreTitle(stage)

        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            {!hideTitle && (
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
            )}

            {renderDinnerChore({
              theme: deps.theme,
              duration:
                eatingTask.dinnerDurationSeconds ??
                DEFAULT_DINNER_DURATION_SECONDS,
              remaining: getManageDinnerLiveRemaining(eatingTask),
              totalBites: eatingTask.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
              bitesLeft: getManageDinnerBitesLeft(eatingTask),
              starReward: eatingTask.starValue,
              isTimerRunning: deps.isDinnerTaskRunning(eatingTask),
              plateImage:
                deps.theme.id === 'princess' ? princessPlateImage : undefined,
              onAdjustTime: (delta) => {
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
              },
              onAdjustBites: (delta) => {
                const cur = eatingTask.dinnerTotalBites ?? DEFAULT_DINNER_BITES
                const next = Math.max(1, Math.min(16, cur + delta))
                deps.updateTaskField(eatingTask.id, { dinnerTotalBites: next })
                deps.updateEphemeral(eatingTask.id, {
                  manageDinnerBitesLeft: next,
                })
              },
              onStarsChange: (value) =>
                deps.updateTaskField(eatingTask.id, { starValue: value }),
              isCompleted: Boolean(eatingTask.manageDinnerCompletedAt),
              completionImage:
                deps.theme.id === 'princess'
                  ? princessEatingFullImage
                  : undefined,
              failureImage:
                deps.theme.id === 'princess'
                  ? princessEatingFailImage
                  : undefined,
              biteCooldownSeconds: deps.biteCooldownSeconds,
              biteIcon:
                deps.theme.id === 'princess'
                  ? deps.activePrincessCooldownIcon
                  : undefined,
              onBiteIconClick:
                deps.theme.id === 'princess'
                  ? deps.handleCycleCooldownTestIcon
                  : undefined,
              showSetupControls:
                !deps.isDinnerTaskRunning(eatingTask) &&
                !eatingTask.manageDinnerCompletedAt,
              showStarReward:
                !deps.isDinnerTaskRunning(eatingTask) &&
                !eatingTask.manageDinnerCompletedAt,
            })}

            {!deps.isDinnerTaskRunning(eatingTask) &&
            !eatingTask.manageDinnerCompletedAt
              ? deps.renderDayTypeControl(eatingTask)
              : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const eatingTask = task as EatingTaskWithEphemeral
        const stage = descriptorByType.eating.getStage(task)
        const isFinished = stage === 'completed'
        return createPresetDinnerPrimaryAction({
          stage,
          isTimerRunning: deps.isDinnerTaskRunning(eatingTask),
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
          onReset: (item) =>
            deps.handleDinnerReset(item as EatingTaskWithEphemeral),
          onBite: (item) => {
            deps.handleDinnerBite(item as EatingTaskWithEphemeral)
          },
          onStart: (item) => {
            const currentTask = item as EatingTaskWithEphemeral
            deps.dinnerStartTimer(currentTask)
            deps.startDinnerActivity(currentTask.id)
          },
        })
      },
      getUtilityAction: (task) => {
        const stage = descriptorByType.eating.getStage(task)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset dinner chore',
          deleteAriaLabel: 'Delete chore',
          onReset: (item) =>
            deps.handleDinnerReset(item as EatingTaskWithEphemeral),
          onDelete: (item) => deps.handleDelete(item.id),
          theme: deps.theme,
        })
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
        const stage = descriptorByType.math.getStage(task)
        const hideInput = stage !== 'setup'

        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            {!hideInput && (
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
            )}

            {renderArithmeticChore({
              theme: deps.theme,
              totalProblems:
                mathTask.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
              starReward: mathTask.starValue,
              difficulty: mathTask.mathDifficulty ?? 'easy',
              isRunning: deps.activeMathTaskId === mathTask.id,
              isCompleted: Boolean(mathTask.manageMathCompletedAt),
              isFailed: mathTask.manageMathLastOutcome === 'failure',
              onAdjustProblems: (delta) => {
                const cur = mathTask.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
                const next = Math.max(1, Math.min(10, cur + delta))
                deps.updateTaskField(mathTask.id, { mathTotalProblems: next })
              },
              onStarsChange: (value) =>
                deps.updateTaskField(mathTask.id, { starValue: value }),
              onDifficultyChange: (difficulty) =>
                deps.updateTaskField(mathTask.id, {
                  mathDifficulty: difficulty,
                }),
              onComplete: () => deps.handleMathComplete(mathTask),
              onFail: () => deps.handleMathFail(mathTask),
              checkTrigger: deps.mathCheckTriggerByTask[mathTask.id] ?? 0,
              completionImage:
                deps.theme.id === 'princess'
                  ? princessQuizCorrectImage
                  : undefined,
              failureImage:
                deps.theme.id === 'princess'
                  ? princessQuizIncorrectImage
                  : undefined,
            })}

            {!mathTask.manageMathCompletedAt &&
            deps.activeMathTaskId !== mathTask.id
              ? deps.renderDayTypeControl(mathTask)
              : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const stage = descriptorByType.math.getStage(task)
        return createPresetTestPrimaryAction({
          choreType: 'math',
          stage,
          icon: (
            <img
              src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
              alt={
                stage === 'completed'
                  ? 'Play again'
                  : stage === 'activity'
                    ? 'Check answer'
                    : 'Start'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          onReset: (item) =>
            deps.handleMathReset(item as MathTaskWithEphemeral),
          onCheck: (item) => {
            const currentTask = item as MathTaskWithEphemeral
            if (deps.activeMathTaskId === currentTask.id) {
              deps.setMathCheckTriggerByTask((prev) => ({
                ...prev,
                [currentTask.id]: (prev[currentTask.id] ?? 0) + 1,
              }))
            }
          },
          onStart: (item) => {
            deps.setActiveMathTaskId((item as MathTaskWithEphemeral).id)
          },
        })
      },
      getUtilityAction: (task) => {
        const stage = descriptorByType.math.getStage(task)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset arithmetic chore',
          deleteAriaLabel: 'Delete chore',
          onReset: (item) =>
            deps.handleMathReset(item as MathTaskWithEphemeral),
          onDelete: (item) => deps.handleDelete(item.id),
          theme: deps.theme,
        })
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
        const stage = descriptorByType['positional-notation'].getStage(task)
        const hideInput = stage !== 'setup'

        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            {!hideInput && (
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
            )}

            {renderPositionalNotationChore({
              theme: deps.theme,
              totalProblems: pvTask.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
              starReward: pvTask.starValue,
              isRunning: deps.activePVTaskId === pvTask.id,
              isCompleted: Boolean(pvTask.managePVCompletedAt),
              isFailed: pvTask.managePVLastOutcome === 'failure',
              onAdjustProblems: (delta) => {
                const cur = pvTask.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
                const next = Math.max(1, Math.min(10, cur + delta))
                deps.updateTaskField(pvTask.id, { pvTotalProblems: next })
              },
              onStarsChange: (value) =>
                deps.updateTaskField(pvTask.id, { starValue: value }),
              onComplete: () => deps.handlePVComplete(pvTask),
              onFail: () => deps.handlePVFail(pvTask),
              checkTrigger: deps.pvCheckTriggerByTask[pvTask.id] ?? 0,
              completionImage:
                deps.theme.id === 'princess'
                  ? princessQuizCorrectImage
                  : undefined,
              failureImage:
                deps.theme.id === 'princess'
                  ? princessQuizIncorrectImage
                  : undefined,
            })}

            {!pvTask.managePVCompletedAt && deps.activePVTaskId !== pvTask.id
              ? deps.renderDayTypeControl(pvTask)
              : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const stage = descriptorByType['positional-notation'].getStage(task)
        return createPresetTestPrimaryAction({
          choreType: 'positional-notation',
          stage,
          icon: (
            <img
              src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
              alt={
                stage === 'completed'
                  ? 'Play again'
                  : stage === 'activity'
                    ? 'Check answer'
                    : 'Start'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          onReset: (item) => deps.handlePVReset(item as PVTaskWithEphemeral),
          onCheck: (item) => {
            const currentTask = item as PVTaskWithEphemeral
            if (deps.activePVTaskId === currentTask.id) {
              deps.setPVCheckTriggerByTask((prev) => ({
                ...prev,
                [currentTask.id]: (prev[currentTask.id] ?? 0) + 1,
              }))
            }
          },
          onStart: (item) => {
            deps.setActivePVTaskId((item as PVTaskWithEphemeral).id)
          },
        })
      },
      getUtilityAction: (task) => {
        const stage = descriptorByType['positional-notation'].getStage(task)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset positional notation chore',
          deleteAriaLabel: 'Delete chore',
          onReset: (item) => deps.handlePVReset(item as PVTaskWithEphemeral),
          onDelete: (item) => deps.handleDelete(item.id),
          theme: deps.theme,
        })
      },
    },
    alphabet: {
      kind: 'complexChore',
      getStage: (task) => {
        const alphabetTask = task as AlphabetTaskWithEphemeral
        if (alphabetTask.manageAlphabetCompletedAt) return 'completed'
        return deps.activeAlphabetTaskId === alphabetTask.id
          ? 'activity'
          : 'setup'
      },
      renderItem: (task) => {
        const alphabetTask = task as AlphabetTaskWithEphemeral
        const stage = descriptorByType.alphabet.getStage(task)
        const hideInput = stage !== 'setup'

        return (
          <div
            className="flex flex-col"
            style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
          >
            {!hideInput && (
              <ActionTextInput
                theme={deps.theme}
                label="Chore Name"
                value={deps.titleDrafts[alphabetTask.id] ?? alphabetTask.title}
                onChange={(value) => deps.setTitleDraft(alphabetTask.id, value)}
                onCommit={(value) => deps.commitTitle(alphabetTask.id, value)}
                maxLength={80}
                baseColor={deps.theme.colors.primary}
                inputAriaLabel="Chore name"
                transparent
              />
            )}

            {renderAlphabetChore({
              theme: deps.theme,
              totalProblems:
                alphabetTask.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
              starReward: alphabetTask.starValue,
              isRunning: deps.activeAlphabetTaskId === alphabetTask.id,
              isCompleted: Boolean(alphabetTask.manageAlphabetCompletedAt),
              isFailed: alphabetTask.manageAlphabetLastOutcome === 'failure',
              onAdjustProblems: (delta) => {
                const cur =
                  alphabetTask.alphabetTotalProblems ??
                  DEFAULT_ALPHABET_PROBLEMS
                const next = Math.max(1, Math.min(10, cur + delta))
                deps.updateTaskField(alphabetTask.id, {
                  alphabetTotalProblems: next,
                })
              },
              onStarsChange: (value) =>
                deps.updateTaskField(alphabetTask.id, { starValue: value }),
              onComplete: () => deps.handleAlphabetComplete(alphabetTask),
              onFail: () => deps.handleAlphabetFail(alphabetTask),
              completionImage:
                deps.theme.id === 'princess'
                  ? princessQuizCorrectImage
                  : undefined,
              failureImage:
                deps.theme.id === 'princess'
                  ? princessQuizIncorrectImage
                  : undefined,
            })}

            {!hideInput ? deps.renderDayTypeControl(alphabetTask) : null}
          </div>
        )
      },
      getPrimaryAction: (task) => {
        const stage = descriptorByType.alphabet.getStage(task)
        return createPresetTestPrimaryAction({
          choreType: 'alphabet',
          stage,
          icon: (
            <img
              src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
              alt={
                stage === 'completed'
                  ? 'Play again'
                  : stage === 'activity'
                    ? 'Check answer'
                    : 'Start'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          onReset: (item) =>
            deps.handleAlphabetReset(item as AlphabetTaskWithEphemeral),
          onCheck: (item) => {
            const currentTask = item as AlphabetTaskWithEphemeral
            if (deps.activeAlphabetTaskId === currentTask.id) {
              deps.setAlphabetCheckTriggerByTask((prev) => ({
                ...prev,
                [currentTask.id]: (prev[currentTask.id] ?? 0) + 1,
              }))
            }
          },
          onStart: (item) => {
            deps.setActiveAlphabetTaskId((item as AlphabetTaskWithEphemeral).id)
          },
        })
      },
      getUtilityAction: (task) => {
        const stage = descriptorByType.alphabet.getStage(task)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset alphabet chore',
          deleteAriaLabel: 'Delete chore',
          onReset: (item) =>
            deps.handleAlphabetReset(item as AlphabetTaskWithEphemeral),
          onDelete: (item) => deps.handleDelete(item.id),
          theme: deps.theme,
        })
      },
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
