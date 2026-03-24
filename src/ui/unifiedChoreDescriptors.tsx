import type { Dispatch, ReactNode, SetStateAction } from 'react'
import ActionTextInput from '../components/ActionTextInput'
import ChoreOutcomeView from '../components/ChoreOutcomeView'
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
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  getManageTaskCompletedAt,
  isAlphabetTask,
  isAlphabetTodo,
  isEatingTask,
  isEatingTodo,
  isMathTask,
  isMathTodo,
  isPositionalNotationTask,
  isPositionalNotationTodo,
  type TaskEphemeralState,
  type TaskUpdatableFields,
  type TaskWithEphemeral,
  type TodoRecord,
  type TodoUpdatableFields,
  type TaskRecord,
} from '../data/types'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from './tokens'
import type { ListRowDescriptor } from './listDescriptorTypes'
import {
  shouldHidePresetChoreTitle,
  isInChoreStage,
  type ChoreStage,
} from './choreModeDefinitions'
import {
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

type UnifiedChoreItem = TaskWithEphemeral | TodoRecord

export type UnifiedChoreDeps = {
  theme: Theme
  mode: 'manage' | 'today'
  // Actions
  onUpdateTaskField?: (id: string, field: TaskUpdatableFields) => void
  onUpdateTodoField?: (id: string, field: TodoUpdatableFields) => void
  onUpdateEphemeral?: (id: string, patch: Partial<TaskEphemeralState>) => void
  onSetTitleDraft?: (id: string, value: string) => void
  onCommitTitle?: (id: string, value: string) => void
  onDeleteTask?: (id: string) => void
  onDeleteTodo?: (id: string) => void
  onEnterChore?: (item: TaskWithEphemeral | TodoRecord) => void
  onComplete?: (item: TaskWithEphemeral | TodoRecord) => void
  onFail?: (item: TaskWithEphemeral | TodoRecord) => void
  onReset?: (item: TaskWithEphemeral | TodoRecord) => void
  onStartDinner?: (item: TaskWithEphemeral | TodoRecord | null) => void
  onApplyBite?: (item: TaskWithEphemeral | TodoRecord) => void
  onExpireDinner?: (item: TaskWithEphemeral | TodoRecord) => void
  // State
  titleDrafts?: Record<string, string>
  activeMathId: string | null
  activePVId: string | null
  activeAlphabetId: string | null
  activeDinnerId: string | null
  mathCheckTriggers: Record<string, number>
  pvCheckTriggers: Record<string, number>
  alphabetCheckTriggers: Record<string, number>
  setMathCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setPVCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  setAlphabetCheckTriggers?: Dispatch<SetStateAction<Record<string, number>>>
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  activePrincessMealIcon?: string
  renderDayTypeControl?: (task: TaskRecord) => ReactNode
}

export function createUnifiedChoreDescriptor(
  deps: UnifiedChoreDeps
): ListRowDescriptor<UnifiedChoreItem> {
  const isManage = deps.mode === 'manage'
  const noop = () => undefined

  const isTaskItem = (item: UnifiedChoreItem): item is TaskWithEphemeral =>
    'taskType' in item

  const getChoreType = (item: UnifiedChoreItem) =>
    isTaskItem(item) ? item.taskType : item.sourceTaskType

  const isCompleted = (item: UnifiedChoreItem) =>
    isTaskItem(item)
      ? Boolean(getManageTaskCompletedAt(item))
      : Boolean(item.completedAt)

  const hasActiveDinnerCooldown = (item: UnifiedChoreItem) =>
    deps.activeDinnerId === item.id &&
    typeof deps.biteCooldownEndsAt === 'number' &&
    deps.biteCooldownEndsAt > Date.now()

  const isDinnerAwaitingFinalCooldown = (item: UnifiedChoreItem) => {
    if (getChoreType(item) !== 'eating' || !isCompleted(item)) return false

    if (isTaskItem(item)) {
      return isEatingTask(item) && getManageDinnerBitesLeft(item) <= 0
        ? hasActiveDinnerCooldown(item)
        : false
    }

    return isEatingTodo(item) && item.dinnerBitesLeft <= 0
      ? hasActiveDinnerCooldown(item)
      : false
  }

  const isDinnerTimedOut = (item: UnifiedChoreItem) => {
    if (getChoreType(item) !== 'eating') return false

    if (isTaskItem(item)) {
      if (!isEatingTask(item)) return false
      const remaining = getManageDinnerRemaining(item)
      const startedAt = item.manageDinnerTimerStartedAt
      if (!startedAt)
        return remaining <= 0 && getManageDinnerBitesLeft(item) > 0
      const elapsed = (Date.now() - startedAt) / 1000
      return remaining - elapsed <= 0 && getManageDinnerBitesLeft(item) > 0
    }

    if (!isEatingTodo(item)) return false
    const remaining = item.dinnerRemainingSeconds
    const startedAt = item.dinnerTimerStartedAt
    if (!startedAt) return remaining <= 0 && item.dinnerBitesLeft > 0
    const elapsed = (Date.now() - startedAt) / 1000
    return remaining - elapsed <= 0 && item.dinnerBitesLeft > 0
  }

  const getStage = (item: UnifiedChoreItem): ChoreStage => {
    if (isCompleted(item) || isDinnerTimedOut(item)) {
      if (isDinnerAwaitingFinalCooldown(item)) return 'activity'
      return 'completed'
    }

    const id = item.id
    if (
      deps.activeMathId === id ||
      deps.activePVId === id ||
      deps.activeAlphabetId === id ||
      deps.activeDinnerId === id
    ) {
      return 'activity'
    }
    return 'setup'
  }

  const renderItem = (item: UnifiedChoreItem): ReactNode => {
    const stage = getStage(item)
    const hideTitle = shouldHidePresetChoreTitle(stage)
    const type = getChoreType(item)

    const commonContainer = (content: ReactNode) => (
      <div
        className="flex flex-col"
        style={{
          gap: `${isManage ? uiTokens.singleVerticalSpace : Math.max(12, uiTokens.singleVerticalSpace / 2)}px`,
        }}
      >
        {!hideTitle &&
          (isManage ? (
            <ActionTextInput
              theme={deps.theme}
              label="Chore Name"
              value={deps.titleDrafts?.[item.id] ?? item.title}
              onChange={(v) => deps.onSetTitleDraft?.(item.id, v)}
              onCommit={(v) => deps.onCommitTitle?.(item.id, v)}
              maxLength={80}
              baseColor={deps.theme.colors.primary}
              inputAriaLabel="Chore name"
              transparent
            />
          ) : (
            <div
              style={{
                fontFamily: deps.theme.fonts.heading,
                fontSize: '1.25rem',
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </div>
          ))}
        {content}
        {isManage &&
          stage === 'setup' &&
          isTaskItem(item) &&
          deps.renderDayTypeControl?.(item as TaskRecord)}
      </div>
    )

    switch (type) {
      case 'standard':
        return commonContainer(
          stage === 'completed' ? (
            <ChoreOutcomeView
              imageSrc={
                deps.theme.id === 'princess'
                  ? princessQuizCorrectImage
                  : undefined
              }
              outcome="success"
            />
          ) : isTaskItem(item) ? (
            <>
              <div
                className="flex flex-col items-center"
                style={{ gap: '0px' }}
              >
                <RepeatControl
                  theme={deps.theme}
                  value={item.isRepeating}
                  onChange={(v) =>
                    deps.onUpdateTaskField?.(item.id, { isRepeating: v })
                  }
                  showLabel={false}
                  showFeedback={false}
                />
              </div>
              <div
                className="flex flex-col items-center"
                style={{ gap: '0px' }}
              >
                <StarDisplay
                  theme={deps.theme}
                  count={item.starValue}
                  editable
                  onChange={(v) =>
                    deps.onUpdateTaskField?.(item.id, { starValue: v || 1 })
                  }
                  min={1}
                  max={3}
                />
              </div>
            </>
          ) : null
        )

      case 'eating': {
        const isActive = deps.activeDinnerId === item.id
        if (isTaskItem(item)) {
          if (!isEatingTask(item)) return null

          const eatingItem = item
          const isEatingCompleted = Boolean(eatingItem.manageDinnerCompletedAt)

          return commonContainer(
            isActive || isEatingCompleted || stage === 'setup'
              ? renderDinnerChore({
                  theme: deps.theme,
                  duration:
                    eatingItem.dinnerDurationSeconds ??
                    DEFAULT_DINNER_DURATION_SECONDS,
                  remaining: getManageDinnerRemaining(eatingItem),
                  totalBites:
                    eatingItem.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
                  bitesLeft: getManageDinnerBitesLeft(eatingItem),
                  starReward: eatingItem.starValue,
                  isTimerRunning: isActive,
                  timerStartedAt: eatingItem.manageDinnerTimerStartedAt,
                  plateImage:
                    deps.theme.id === 'princess'
                      ? princessPlateImage
                      : undefined,
                  onAdjustTime: (delta) => {
                    const next = Math.max(
                      5 * 60,
                      Math.min(
                        30 * 60,
                        (eatingItem.dinnerDurationSeconds ?? 600) + delta
                      )
                    )
                    deps.onUpdateTaskField?.(item.id, {
                      dinnerDurationSeconds: next,
                    })
                    deps.onUpdateEphemeral?.(item.id, {
                      manageDinnerRemainingSeconds: next,
                    })
                  },
                  onAdjustBites: (delta) => {
                    const next = Math.max(
                      1,
                      Math.min(16, (eatingItem.dinnerTotalBites ?? 2) + delta)
                    )
                    deps.onUpdateTaskField?.(item.id, {
                      dinnerTotalBites: next,
                    })
                    deps.onUpdateEphemeral?.(item.id, {
                      manageDinnerBitesLeft: next,
                    })
                  },
                  onStarsChange: (v) =>
                    deps.onUpdateTaskField?.(item.id, { starValue: v }),
                  onExpire: () => deps.onExpireDinner?.(item),
                  isCompleted: isEatingCompleted,
                  completionImage:
                    deps.theme.id === 'princess'
                      ? princessQuizCorrectImage
                      : undefined,
                  failureImage:
                    deps.theme.id === 'princess'
                      ? princessQuizIncorrectImage
                      : undefined,
                  biteCooldownSeconds: deps.biteCooldownSeconds,
                  biteCooldownEndsAt: deps.biteCooldownEndsAt,
                  biteIcon:
                    deps.theme.id === 'princess'
                      ? deps.activePrincessMealIcon
                      : undefined,
                  showSetupControls: !isActive && !isEatingCompleted,
                  showStarReward: !isActive && !isEatingCompleted,
                })
              : null
          )
        }

        if (!isEatingTodo(item)) return null

        const eatingItem = item
        const isEatingCompleted = Boolean(eatingItem.completedAt)

        return commonContainer(
          isActive || isEatingCompleted
            ? renderDinnerChore({
                theme: deps.theme,
                duration:
                  eatingItem.dinnerDurationSeconds ??
                  DEFAULT_DINNER_DURATION_SECONDS,
                remaining: eatingItem.dinnerRemainingSeconds,
                totalBites: eatingItem.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
                bitesLeft: eatingItem.dinnerBitesLeft,
                starReward: eatingItem.starValue,
                isTimerRunning: isActive,
                timerStartedAt: eatingItem.dinnerTimerStartedAt,
                plateImage:
                  deps.theme.id === 'princess' ? princessPlateImage : undefined,
                isCompleted: isEatingCompleted,
                completionImage:
                  deps.theme.id === 'princess'
                    ? princessEatingFullImage
                    : undefined,
                failureImage:
                  deps.theme.id === 'princess'
                    ? princessEatingFailImage
                    : undefined,
                biteCooldownSeconds: deps.biteCooldownSeconds,
                biteCooldownEndsAt: deps.biteCooldownEndsAt,
                biteIcon:
                  deps.theme.id === 'princess'
                    ? deps.activePrincessMealIcon
                    : undefined,
                onAdjustTime: noop,
                onAdjustBites: noop,
                onStarsChange: noop,
                onExpire: () => deps.onExpireDinner?.(item),
                showSetupControls: false,
                showStarReward: false,
              })
            : null
        )
      }

      case 'math': {
        const isActive = deps.activeMathId === item.id
        if (isTaskItem(item)) {
          if (!isMathTask(item)) return null

          const mathItem = item
          const isMathCompleted = Boolean(mathItem.manageMathCompletedAt)

          return commonContainer(
            isActive || isMathCompleted || stage === 'setup'
              ? renderArithmeticChore({
                  theme: deps.theme,
                  totalProblems:
                    mathItem.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
                  starReward: mathItem.starValue,
                  difficulty: mathItem.mathDifficulty ?? 'easy',
                  isRunning: isActive,
                  isCompleted: isMathCompleted,
                  isFailed: mathItem.manageMathLastOutcome === 'failure',
                  onAdjustProblems: (delta) => {
                    const next = Math.max(
                      1,
                      Math.min(10, (mathItem.mathTotalProblems ?? 5) + delta)
                    )
                    deps.onUpdateTaskField?.(item.id, {
                      mathTotalProblems: next,
                    })
                  },
                  onStarsChange: (v) =>
                    deps.onUpdateTaskField?.(item.id, { starValue: v }),
                  onDifficultyChange: (d) =>
                    deps.onUpdateTaskField?.(item.id, { mathDifficulty: d }),
                  onComplete: () => deps.onComplete?.(item),
                  onFail: () => deps.onFail?.(item),
                  checkTrigger: deps.mathCheckTriggers[item.id] ?? 0,
                  completionImage:
                    deps.theme.id === 'princess'
                      ? princessQuizCorrectImage
                      : undefined,
                  failureImage:
                    deps.theme.id === 'princess'
                      ? princessQuizIncorrectImage
                      : undefined,
                })
              : null
          )
        }

        if (!isMathTodo(item)) return null

        const mathItem = item
        const isMathCompleted = Boolean(mathItem.completedAt)

        return commonContainer(
          isActive || isMathCompleted
            ? renderArithmeticChore({
                theme: deps.theme,
                totalProblems:
                  mathItem.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
                starReward: mathItem.starValue,
                difficulty: mathItem.mathDifficulty ?? 'easy',
                isRunning: isActive,
                isCompleted: isMathCompleted,
                isFailed: mathItem.mathLastOutcome === 'failure',
                onAdjustProblems: noop,
                onStarsChange: noop,
                onComplete: () => deps.onComplete?.(item),
                onFail: () => deps.onFail?.(item),
                checkTrigger: deps.mathCheckTriggers[item.id] ?? 0,
                completionImage:
                  deps.theme.id === 'princess'
                    ? princessQuizCorrectImage
                    : undefined,
                failureImage:
                  deps.theme.id === 'princess'
                    ? princessQuizIncorrectImage
                    : undefined,
              })
            : null
        )
      }

      case 'positional-notation': {
        const isActive = deps.activePVId === item.id
        if (isTaskItem(item)) {
          if (!isPositionalNotationTask(item)) return null

          const pvItem = item
          const isPVCompleted = Boolean(pvItem.managePVCompletedAt)

          return commonContainer(
            isActive || isPVCompleted || stage === 'setup'
              ? renderPositionalNotationChore({
                  theme: deps.theme,
                  totalProblems: pvItem.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
                  starReward: pvItem.starValue,
                  isRunning: isActive,
                  isCompleted: isPVCompleted,
                  isFailed: pvItem.managePVLastOutcome === 'failure',
                  onAdjustProblems: (delta) => {
                    const next = Math.max(
                      1,
                      Math.min(10, (pvItem.pvTotalProblems ?? 5) + delta)
                    )
                    deps.onUpdateTaskField?.(item.id, { pvTotalProblems: next })
                  },
                  onStarsChange: (v) =>
                    deps.onUpdateTaskField?.(item.id, { starValue: v }),
                  onComplete: () => deps.onComplete?.(item),
                  onFail: () => deps.onFail?.(item),
                  checkTrigger: deps.pvCheckTriggers[item.id] ?? 0,
                  completionImage:
                    deps.theme.id === 'princess'
                      ? princessQuizCorrectImage
                      : undefined,
                  failureImage:
                    deps.theme.id === 'princess'
                      ? princessQuizIncorrectImage
                      : undefined,
                })
              : null
          )
        }

        if (!isPositionalNotationTodo(item)) return null

        const pvItem = item
        const isPVCompleted = Boolean(pvItem.completedAt)

        return commonContainer(
          isActive || isPVCompleted
            ? renderPositionalNotationChore({
                theme: deps.theme,
                totalProblems: pvItem.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
                starReward: pvItem.starValue,
                isRunning: isActive,
                isCompleted: isPVCompleted,
                isFailed: pvItem.pvLastOutcome === 'failure',
                onAdjustProblems: noop,
                onStarsChange: noop,
                onComplete: () => deps.onComplete?.(item),
                onFail: () => deps.onFail?.(item),
                checkTrigger: deps.pvCheckTriggers[item.id] ?? 0,
                completionImage:
                  deps.theme.id === 'princess'
                    ? princessQuizCorrectImage
                    : undefined,
                failureImage:
                  deps.theme.id === 'princess'
                    ? princessQuizIncorrectImage
                    : undefined,
              })
            : null
        )
      }

      case 'alphabet': {
        const isActive = deps.activeAlphabetId === item.id
        if (isTaskItem(item)) {
          if (!isAlphabetTask(item)) return null

          const alphaItem = item
          const isAlphabetCompleted = Boolean(
            alphaItem.manageAlphabetCompletedAt
          )

          return commonContainer(
            isActive || isAlphabetCompleted || stage === 'setup'
              ? renderAlphabetChore({
                  theme: deps.theme,
                  totalProblems:
                    alphaItem.alphabetTotalProblems ??
                    DEFAULT_ALPHABET_PROBLEMS,
                  starReward: alphaItem.starValue,
                  isRunning: isActive,
                  isCompleted: isAlphabetCompleted,
                  isFailed: alphaItem.manageAlphabetLastOutcome === 'failure',
                  onAdjustProblems: (delta) => {
                    const next = Math.max(
                      1,
                      Math.min(
                        10,
                        (alphaItem.alphabetTotalProblems ?? 5) + delta
                      )
                    )
                    deps.onUpdateTaskField?.(item.id, {
                      alphabetTotalProblems: next,
                    })
                  },
                  onStarsChange: (v) =>
                    deps.onUpdateTaskField?.(item.id, { starValue: v }),
                  onComplete: () => deps.onComplete?.(item),
                  onFail: () => deps.onFail?.(item),
                  checkTrigger: deps.alphabetCheckTriggers[item.id] ?? 0,
                  completionImage:
                    deps.theme.id === 'princess'
                      ? princessQuizCorrectImage
                      : undefined,
                  failureImage:
                    deps.theme.id === 'princess'
                      ? princessQuizIncorrectImage
                      : undefined,
                })
              : null
          )
        }

        if (!isAlphabetTodo(item)) return null

        const alphaItem = item
        const isAlphabetCompleted = Boolean(alphaItem.completedAt)

        return commonContainer(
          isActive || isAlphabetCompleted
            ? renderAlphabetChore({
                theme: deps.theme,
                totalProblems:
                  alphaItem.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
                starReward: alphaItem.starValue,
                isRunning: isActive,
                isCompleted: isAlphabetCompleted,
                isFailed: alphaItem.alphabetLastOutcome === 'failure',
                onAdjustProblems: noop,
                onStarsChange: noop,
                onComplete: () => deps.onComplete?.(item),
                onFail: () => deps.onFail?.(item),
                checkTrigger: deps.alphabetCheckTriggers[item.id] ?? 0,
                completionImage:
                  deps.theme.id === 'princess'
                    ? princessQuizCorrectImage
                    : undefined,
                failureImage:
                  deps.theme.id === 'princess'
                    ? princessQuizIncorrectImage
                    : undefined,
              })
            : null
        )
      }

      default:
        return null
    }
  }

  return {
    renderItem,
    getStarCount: (item) => {
      if (isManage) return undefined
      const stage = getStage(item)
      if (isInChoreStage(stage)) return undefined
      return item.starValue
    },
    isHighlighted: (item) => getStage(item) === 'completed',
    getPrimaryAction: (item) => {
      const stage = getStage(item)
      const type = getChoreType(item)

      if (type === 'standard') {
        const isItemCompleted = isCompleted(item)
        return {
          label: isItemCompleted ? 'Done' : isManage ? 'Give' : 'Open chore',
          icon: (
            <img
              src={isItemCompleted ? princessActiveIcon : princessGiveStarIcon}
              alt="icon"
              className="h-6 w-6 object-contain"
            />
          ),
          disabled: isItemCompleted,
          hideButton: isItemCompleted,
          variant: 'primary',
          showLabel: false,
          onClick: (i) => deps.onComplete?.(i),
        }
      }

      if (type === 'eating') {
        const isActive = deps.activeDinnerId === item.id
        const isFinished = stage === 'completed'
        const isCoolingDown =
          typeof deps.biteCooldownEndsAt === 'number' &&
          deps.biteCooldownEndsAt > Date.now()
        return createPresetDinnerPrimaryAction({
          stage,
          isTimerRunning: isActive,
          icon: !isFinished ? (
            <img
              src={
                deps.theme.id === 'princess'
                  ? isActive
                    ? deps.activePrincessMealIcon
                    : princessBiteIcon
                  : princessBiteIcon
              }
              alt="icon"
              className="h-6 w-6 object-contain"
            />
          ) : (
            <img
              src={princessPlateImage}
              alt="Reset"
              className="h-6 w-6 object-contain"
            />
          ),
          disabled: isActive && isCoolingDown,
          onReset: (i) => deps.onReset?.(i),
          onBite: (i) => deps.onApplyBite?.(i),
          onStart: (i) => {
            deps.onStartDinner?.(i)
          },
        })
      }

      // Tests (Math, PV, Alphabet)
      return createPresetTestPrimaryAction({
        choreType: type,
        stage,
        icon: (
          <img
            src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
            alt="icon"
            className="h-6 w-6 object-contain"
          />
        ),
        onReset: (i) => deps.onReset?.(i),
        onCheck: (i) => {
          const triggerSetter =
            type === 'math'
              ? deps.setMathCheckTriggers
              : type === 'positional-notation'
                ? deps.setPVCheckTriggers
                : deps.setAlphabetCheckTriggers
          triggerSetter?.((prev) => ({
            ...prev,
            [i.id]: (prev[i.id] ?? 0) + 1,
          }))
        },
        onStart: (i) => {
          if (deps.onEnterChore) return deps.onEnterChore(i)
          return deps.onComplete?.(i)
        },
      })
    },
    getUtilityAction: (item) => {
      const stage = getStage(item)
      return createPresetUtilityAction({
        stage,
        resetAriaLabel: 'Reset',
        deleteAriaLabel: 'Delete',
        onReset: (i) => deps.onReset?.(i),
        onDelete: (i) =>
          isManage ? deps.onDeleteTask?.(i.id) : deps.onDeleteTodo?.(i.id),
        theme: deps.theme,
      })
    },
  }
}
