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
  type AlphabetTaskWithEphemeral,
  type AlphabetTodo,
  type EatingTaskWithEphemeral,
  type EatingTodo,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  getManageTaskCompletedAt,
  isManageTaskCompleted,
  type MathTaskWithEphemeral,
  type MathTodo,
  type PositionalNotationTodo,
  type PVTaskWithEphemeral,
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
): ListRowDescriptor<TaskWithEphemeral | TodoRecord> {
  const isManage = deps.mode === 'manage'

  const getStage = (item: TaskWithEphemeral | TodoRecord): ChoreStage => {
    const isCompleted = isManage
      ? Boolean(getManageTaskCompletedAt(item as TaskWithEphemeral))
      : Boolean((item as TodoRecord).completedAt)
    if (isCompleted) return 'completed'

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

  const renderItem = (item: TaskWithEphemeral | TodoRecord): ReactNode => {
    const stage = getStage(item)
    const hideTitle = shouldHidePresetChoreTitle(stage)
    const type = isManage
      ? (item as TaskWithEphemeral).taskType
      : (item as TodoRecord).sourceTaskType

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
          ) : isManage ? (
            <>
              <StarDisplay
                theme={deps.theme}
                count={(item as TaskWithEphemeral).starValue}
                editable
                onChange={(v) =>
                  deps.onUpdateTaskField?.(item.id, { starValue: v || 1 })
                }
                min={1}
                max={3}
              />
              <RepeatControl
                theme={deps.theme}
                value={(item as TaskWithEphemeral).isRepeating}
                onChange={(v) =>
                  deps.onUpdateTaskField?.(item.id, { isRepeating: v })
                }
                showLabel={false}
                showFeedback={false}
              />
            </>
          ) : null
        )

      case 'eating': {
        const eatingItem = item as EatingTaskWithEphemeral | EatingTodo
        const isActive = deps.activeDinnerId === item.id
        const isCompleted = isManage
          ? Boolean(eatingItem.manageDinnerCompletedAt)
          : Boolean(eatingItem.completedAt)

        return commonContainer(
          isActive || isCompleted
            ? renderDinnerChore({
                theme: deps.theme,
                duration:
                  eatingItem.dinnerDurationSeconds ??
                  DEFAULT_DINNER_DURATION_SECONDS,
                remaining: isManage
                  ? getManageDinnerRemaining(eatingItem)
                  : eatingItem.dinnerRemainingSeconds,
                totalBites: eatingItem.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
                bitesLeft: isManage
                  ? getManageDinnerBitesLeft(eatingItem)
                  : eatingItem.dinnerBitesLeft,
                starReward: eatingItem.starValue,
                isTimerRunning: isActive,
                timerStartedAt: isManage
                  ? eatingItem.manageDinnerTimerStartedAt
                  : eatingItem.dinnerTimerStartedAt,
                plateImage:
                  deps.theme.id === 'princess' ? princessPlateImage : undefined,
                onAdjustTime: (delta) => {
                  if (!isManage) return
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
                  if (!isManage) return
                  const next = Math.max(
                    1,
                    Math.min(16, (eatingItem.dinnerTotalBites ?? 2) + delta)
                  )
                  deps.onUpdateTaskField?.(item.id, { dinnerTotalBites: next })
                  deps.onUpdateEphemeral?.(item.id, {
                    manageDinnerBitesLeft: next,
                  })
                },
                onStarsChange: (v) =>
                  isManage &&
                  deps.onUpdateTaskField?.(item.id, { starValue: v }),
                isCompleted,
                completionImage:
                  deps.theme.id === 'princess'
                    ? isManage
                      ? princessQuizCorrectImage
                      : princessEatingFullImage
                    : undefined,
                failureImage:
                  deps.theme.id === 'princess'
                    ? isManage
                      ? princessQuizIncorrectImage
                      : princessEatingFailImage
                    : undefined,
                biteCooldownSeconds: deps.biteCooldownSeconds,
                biteCooldownEndsAt: deps.biteCooldownEndsAt,
                biteIcon:
                  deps.theme.id === 'princess'
                    ? isManage
                      ? deps.activePrincessMealIcon
                      : deps.activePrincessMealIcon
                    : undefined,
                showSetupControls: isManage && !isActive && !isCompleted,
                showStarReward: isManage && !isActive && !isCompleted,
              })
            : null
        )
      }

      case 'math': {
        const mathItem = item as MathTaskWithEphemeral | MathTodo
        const isActive = deps.activeMathId === item.id
        const isCompleted = isManage
          ? Boolean(mathItem.manageMathCompletedAt)
          : Boolean(mathItem.completedAt)

        return commonContainer(
          isActive || isCompleted || (isManage && stage === 'setup')
            ? renderArithmeticChore({
                theme: deps.theme,
                totalProblems:
                  mathItem.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
                starReward: mathItem.starValue,
                difficulty: mathItem.mathDifficulty ?? 'easy',
                isRunning: isActive,
                isCompleted,
                isFailed: isManage
                  ? mathItem.manageMathLastOutcome === 'failure'
                  : mathItem.mathLastOutcome === 'failure',
                onAdjustProblems: (delta) => {
                  if (!isManage) return
                  const next = Math.max(
                    1,
                    Math.min(10, (mathItem.mathTotalProblems ?? 5) + delta)
                  )
                  deps.onUpdateTaskField?.(item.id, { mathTotalProblems: next })
                },
                onStarsChange: (v) =>
                  isManage &&
                  deps.onUpdateTaskField?.(item.id, { starValue: v }),
                onDifficultyChange: (d) =>
                  isManage &&
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

      case 'positional-notation': {
        const pvItem = item as PVTaskWithEphemeral | PositionalNotationTodo
        const isActive = deps.activePVId === item.id
        const isCompleted = isManage
          ? Boolean(pvItem.managePVCompletedAt)
          : Boolean(pvItem.completedAt)

        return commonContainer(
          isActive || isCompleted || (isManage && stage === 'setup')
            ? renderPositionalNotationChore({
                theme: deps.theme,
                totalProblems: pvItem.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
                starReward: pvItem.starValue,
                isRunning: isActive,
                isCompleted,
                isFailed: isManage
                  ? pvItem.managePVLastOutcome === 'failure'
                  : pvItem.pvLastOutcome === 'failure',
                onAdjustProblems: (delta) => {
                  if (!isManage) return
                  const next = Math.max(
                    1,
                    Math.min(10, (pvItem.pvTotalProblems ?? 5) + delta)
                  )
                  deps.onUpdateTaskField?.(item.id, { pvTotalProblems: next })
                },
                onStarsChange: (v) =>
                  isManage &&
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

      case 'alphabet': {
        const alphaItem = item as AlphabetTaskWithEphemeral | AlphabetTodo
        const isActive = deps.activeAlphabetId === item.id
        const isCompleted = isManage
          ? Boolean(alphaItem.manageAlphabetCompletedAt)
          : Boolean(alphaItem.completedAt)

        return commonContainer(
          isActive || isCompleted || (isManage && stage === 'setup')
            ? renderAlphabetChore({
                theme: deps.theme,
                totalProblems:
                  alphaItem.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
                starReward: alphaItem.starValue,
                isRunning: isActive,
                isCompleted,
                isFailed: isManage
                  ? alphaItem.manageAlphabetLastOutcome === 'failure'
                  : alphaItem.alphabetLastOutcome === 'failure',
                onAdjustProblems: (delta) => {
                  if (!isManage) return
                  const next = Math.max(
                    1,
                    Math.min(10, (alphaItem.alphabetTotalProblems ?? 5) + delta)
                  )
                  deps.onUpdateTaskField?.(item.id, {
                    alphabetTotalProblems: next,
                  })
                },
                onStarsChange: (v) =>
                  isManage &&
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

      default:
        return null
    }
  }

  return {
    renderItem,
    getStarCount: (item) => {
      const stage = getStage(item)
      if (isInChoreStage(stage)) return undefined
      return item.starValue
    },
    isHighlighted: (item) => {
      return isManage
        ? isManageTaskCompleted(item as TaskWithEphemeral)
        : Boolean((item as TodoRecord).completedAt)
    },
    getPrimaryAction: (item) => {
      const stage = getStage(item)
      const type = isManage
        ? (item as TaskWithEphemeral).taskType
        : (item as TodoRecord).sourceTaskType

      if (type === 'standard') {
        const isCompleted = isManage
          ? Boolean(getManageTaskCompletedAt(item as TaskWithEphemeral))
          : Boolean((item as TodoRecord).completedAt)
        return {
          label: isCompleted ? 'Done' : isManage ? 'Give' : 'Open chore',
          icon: (
            <img
              src={isCompleted ? princessActiveIcon : princessGiveStarIcon}
              alt="icon"
              className="h-6 w-6 object-contain"
            />
          ),
          disabled: isCompleted,
          hideButton: isCompleted,
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
        onStart: (i) => deps.onComplete?.(i),
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
