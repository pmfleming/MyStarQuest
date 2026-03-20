import type { Dispatch, ReactNode, SetStateAction } from 'react'
import ChoreOutcomeView from '../components/ChoreOutcomeView'
import {
  princessActiveIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessQuizCorrectImage,
  princessMathsIcon,
  princessQuizIncorrectImage,
  princessPlateImage,
} from '../assets/themes/princess/assets'
import type { Theme } from '../contexts/ThemeContext'
import {
  type EatingTodo,
  type MathDifficulty,
  type MathTodo,
  type PositionalNotationTodo,
  type AlphabetTodo,
  type TodoRecord,
  DEFAULT_ALPHABET_PROBLEMS,
} from '../data/types'
import { uiTokens } from './tokens'
import type { ListRowDescriptor } from './listDescriptorTypes'
import { isInChoreStage, type ChoreStage } from './choreModeDefinitions'
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
import type {
  ResolvedListAction,
  ResolvedListUtilityAction,
} from './listDescriptorTypes'

type ChoreUiKind = 'complexChore' | 'simpleChore' | 'configOnly'

type TodayTodoTypeUiDescriptor = {
  kind: ChoreUiKind
  getStage: (todo: TodoRecord) => ChoreStage
  renderItem: (todo: TodoRecord) => ReactNode
  getStarCount?: (todo: TodoRecord) => number | undefined
  getPrimaryAction: (todo: TodoRecord) => ResolvedListAction<TodoRecord>
  getUtilityAction?: (todo: TodoRecord) => ResolvedListUtilityAction<TodoRecord>
}

type TodayTodoDescriptorDeps = {
  theme: Theme
  biteCooldownSeconds: number
  biteCooldownEndsAt?: number | null
  pendingTodoId: string | null
  activeMathTodoId: string | null
  activePVTodoId: string | null
  activeAlphabetTodoId: string | null
  mathCheckTriggerByTodo: Record<string, number>
  pvCheckTriggerByTodo: Record<string, number>
  alphabetCheckTriggerByTodo: Record<string, number>
  activePrincessMealIcon?: string
  isDinnerTodoRunning: (todo: EatingTodo) => boolean
  isDinnerTodoInActivity: (todo: EatingTodo) => boolean
  getDinnerDuration: (todo: EatingTodo) => number
  getDinnerLiveRemaining: (todo: EatingTodo) => number
  getDinnerTotalBites: (todo: EatingTodo) => number
  getDinnerBitesLeft: (todo: EatingTodo) => number
  getMathTotalProblems: (todo: MathTodo) => number
  getMathDifficulty: (todo: MathTodo) => MathDifficulty | undefined
  getPVTotalProblems: (todo: PositionalNotationTodo) => number
  handleDinnerBite: (todo: EatingTodo) => void
  dinnerStartTimer: (todo: EatingTodo) => void
  handleDinnerReset: (todo: EatingTodo) => void | Promise<void>
  handleMathComplete: (todo: MathTodo) => void | Promise<void>
  handleMathFail: (todo: MathTodo) => void | Promise<void>
  handleMathReset: (todo: MathTodo) => void | Promise<void>
  handlePVComplete: (todo: PositionalNotationTodo) => void | Promise<void>
  handlePVFail: (todo: PositionalNotationTodo) => void | Promise<void>
  handlePVReset: (todo: PositionalNotationTodo) => void | Promise<void>
  handleAlphabetComplete: (todo: AlphabetTodo) => void | Promise<void>
  handleAlphabetFail: (todo: AlphabetTodo) => void | Promise<void>
  handleAlphabetReset: (todo: AlphabetTodo) => void | Promise<void>
  setActiveMathTodoId: (todoId: string | null) => void
  setActivePVTodoId: (todoId: string | null) => void
  setActiveAlphabetTodoId: (todoId: string | null) => void
  setMathCheckTriggerByTodo: Dispatch<SetStateAction<Record<string, number>>>
  setPVCheckTriggerByTodo: Dispatch<SetStateAction<Record<string, number>>>
  setAlphabetCheckTriggerByTodo: Dispatch<
    SetStateAction<Record<string, number>>
  >
  getAlphabetTotalProblems: (todo: AlphabetTodo) => number
  activeDinnerTodoId: string | null
  startDinnerActivity: (todoId: string) => void
  clearDinnerTodoState: (todoId: string) => void
  handleCompleteTodo: (todo: TodoRecord) => void | Promise<void>
  handleStandardReset: (todo: TodoRecord) => void | Promise<void>
  handleDeleteTodo: (todo: TodoRecord) => void | Promise<void>
}

export const createTodayTodoListRowDescriptor = (
  deps: TodayTodoDescriptorDeps
): ListRowDescriptor<TodoRecord> => {
  const descriptorByType: Record<
    TodoRecord['sourceTaskType'],
    TodayTodoTypeUiDescriptor
  > = {
    standard: {
      kind: 'configOnly',
      getStage: (todo) => (todo.completedAt ? 'completed' : 'setup'),
      renderItem: (todo) =>
        todo.completedAt ? (
          <ChoreOutcomeView
            imageSrc={
              deps.theme.id === 'princess'
                ? princessQuizCorrectImage
                : undefined
            }
            outcome="success"
          />
        ) : null,
      getStarCount: (todo) => (todo.completedAt ? undefined : todo.starValue),
      getPrimaryAction: (todo) => ({
        label: 'Open chore',
        icon:
          deps.theme.id === 'princess' ? (
            <img
              src={todo.completedAt ? princessActiveIcon : princessGiveStarIcon}
              alt={todo.completedAt ? 'Completed' : 'Open chore'}
              className="h-6 w-6 object-contain"
            />
          ) : todo.completedAt ? (
            <span role="img" aria-label="Completed">
              ✅
            </span>
          ) : (
            <span role="img" aria-label="Standard task">
              ⭐
            </span>
          ),
        disabled: Boolean(todo.completedAt) || deps.pendingTodoId === todo.id,
        hideButton: Boolean(todo.completedAt),
        variant: 'primary',
        showLabel: false,
        onClick: (item) => deps.handleCompleteTodo(item),
      }),
      getUtilityAction: (todo) => {
        const stage = descriptorByType.standard.getStage(todo)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset standard todo',
          deleteAriaLabel: 'Delete todo',
          onReset: (item) => deps.handleStandardReset(item),
          onDelete: (item) => deps.handleDeleteTodo(item),
          theme: deps.theme,
        })
      },
    },
    eating: {
      kind: 'complexChore',
      getStage: (todo) => {
        const eatingTodo = todo as EatingTodo
        if (eatingTodo.completedAt) return 'completed'
        return deps.isDinnerTodoInActivity(eatingTodo) ? 'activity' : 'setup'
      },
      renderItem: (todo) => {
        const eatingTodo = todo as EatingTodo
        return deps.isDinnerTodoInActivity(eatingTodo) ||
          Boolean(eatingTodo.completedAt)
          ? renderDinnerChore({
              theme: deps.theme,
              duration: deps.getDinnerDuration(eatingTodo),
              remaining: eatingTodo.dinnerRemainingSeconds,
              totalBites: deps.getDinnerTotalBites(eatingTodo),
              bitesLeft: deps.getDinnerBitesLeft(eatingTodo),
              starReward: eatingTodo.starValue,
              isTimerRunning: deps.isDinnerTodoRunning(eatingTodo),
              timerStartedAt: eatingTodo.dinnerTimerStartedAt,
              plateImage:
                deps.theme.id === 'princess' ? princessPlateImage : undefined,
              onAdjustTime: () => undefined,
              onAdjustBites: () => undefined,
              onStarsChange: () => undefined,
              isCompleted: Boolean(eatingTodo.completedAt),
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
              showSetupControls: false,
              showStarReward: false,
            })
          : null
      },
      getStarCount: (todo) =>
        isInChoreStage(descriptorByType.eating.getStage(todo))
          ? undefined
          : todo.starValue,
      getPrimaryAction: (todo) => {
        const eatingTodo = todo as EatingTodo
        const isFinished = Boolean(eatingTodo.completedAt)
        const stage = descriptorByType.eating.getStage(todo)
        const icon = isFinished ? (
          <img
            src={princessPlateImage}
            alt="Reset"
            className="h-6 w-6 object-contain"
          />
        ) : deps.theme.id === 'princess' ? (
          <img
            src={deps.activePrincessMealIcon}
            alt={deps.isDinnerTodoRunning(eatingTodo) ? 'Bite' : 'Start'}
            className="h-6 w-6 object-contain"
          />
        ) : (
          <span role="img" aria-label="Eating task">
            🍽️
          </span>
        )
        return createPresetDinnerPrimaryAction({
          stage,
          isTimerRunning: deps.isDinnerTodoRunning(eatingTodo),
          icon,
          disabled:
            deps.pendingTodoId === eatingTodo.id ||
            (deps.isDinnerTodoRunning(eatingTodo) &&
              deps.biteCooldownSeconds > 0),
          onReset: (item) => deps.handleDinnerReset(item as EatingTodo),
          onBite: (item) => {
            deps.handleDinnerBite(item as EatingTodo)
          },
          onStart: (item) => {
            const currentTodo = item as EatingTodo
            deps.setActiveMathTodoId(null)
            deps.setActivePVTodoId(null)
            deps.dinnerStartTimer(currentTodo)
            deps.startDinnerActivity(currentTodo.id)
          },
        })
      },
      getUtilityAction: (todo) => {
        const stage = descriptorByType.eating.getStage(todo)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset dinner todo',
          deleteAriaLabel: 'Delete todo',
          onReset: (item) => deps.handleDinnerReset(item as EatingTodo),
          onDelete: (item) => deps.handleDeleteTodo(item),
          theme: deps.theme,
        })
      },
    },
    math: {
      kind: 'complexChore',
      getStage: (todo) => {
        const mathTodo = todo as MathTodo
        if (mathTodo.completedAt) return 'completed'
        return deps.activeMathTodoId === mathTodo.id ? 'activity' : 'setup'
      },
      renderItem: (todo) => {
        const mathTodo = todo as MathTodo
        return deps.activeMathTodoId === mathTodo.id ||
          Boolean(mathTodo.completedAt)
          ? renderArithmeticChore({
              theme: deps.theme,
              totalProblems: deps.getMathTotalProblems(mathTodo),
              starReward: mathTodo.starValue,
              difficulty: deps.getMathDifficulty(mathTodo),
              isRunning: deps.activeMathTodoId === mathTodo.id,
              isCompleted: Boolean(mathTodo.completedAt),
              isFailed: mathTodo.mathLastOutcome === 'failure',
              onAdjustProblems: () => undefined,
              onStarsChange: () => undefined,
              onComplete: () => deps.handleMathComplete(mathTodo),
              onFail: () => deps.handleMathFail(mathTodo),
              checkTrigger: deps.mathCheckTriggerByTodo[mathTodo.id] ?? 0,
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
      },
      getStarCount: (todo) =>
        isInChoreStage(descriptorByType.math.getStage(todo))
          ? undefined
          : todo.starValue,
      getPrimaryAction: (todo) => {
        const stage = descriptorByType.math.getStage(todo)
        const icon =
          deps.theme.id === 'princess' ? (
            <img
              src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
              alt="Math task"
              className="h-6 w-6 object-contain"
            />
          ) : (
            <span role="img" aria-label="Math task">
              🔢
            </span>
          )
        return createPresetTestPrimaryAction({
          choreType: 'math',
          stage,
          icon,
          onReset: (item) => deps.handleMathReset(item as MathTodo),
          onCheck: (item) => {
            const currentTodo = item as MathTodo
            if (deps.activeMathTodoId === currentTodo.id) {
              deps.setMathCheckTriggerByTodo((prev) => ({
                ...prev,
                [currentTodo.id]: (prev[currentTodo.id] ?? 0) + 1,
              }))
            }
          },
          onStart: (item) => {
            const currentTodo = item as MathTodo
            if (deps.activeDinnerTodoId)
              deps.clearDinnerTodoState(deps.activeDinnerTodoId)
            deps.setActivePVTodoId(null)
            deps.setActiveMathTodoId(currentTodo.id)
          },
        })
      },
      getUtilityAction: (todo) => {
        const stage = descriptorByType.math.getStage(todo)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset arithmetic todo',
          deleteAriaLabel: 'Delete todo',
          onReset: (item) => deps.handleMathReset(item as MathTodo),
          onDelete: (item) => deps.handleDeleteTodo(item),
          theme: deps.theme,
        })
      },
    },
    'positional-notation': {
      kind: 'complexChore',
      getStage: (todo) => {
        const pvTodo = todo as PositionalNotationTodo
        if (pvTodo.completedAt) return 'completed'
        return deps.activePVTodoId === pvTodo.id ? 'activity' : 'setup'
      },
      renderItem: (todo) => {
        const pvTodo = todo as PositionalNotationTodo
        return deps.activePVTodoId === pvTodo.id || Boolean(pvTodo.completedAt)
          ? renderPositionalNotationChore({
              theme: deps.theme,
              totalProblems: deps.getPVTotalProblems(pvTodo),
              starReward: pvTodo.starValue,
              isRunning: deps.activePVTodoId === pvTodo.id,
              isCompleted: Boolean(pvTodo.completedAt),
              isFailed: pvTodo.pvLastOutcome === 'failure',
              onAdjustProblems: () => undefined,
              onStarsChange: () => undefined,
              onComplete: () => deps.handlePVComplete(pvTodo),
              onFail: () => deps.handlePVFail(pvTodo),
              checkTrigger: deps.pvCheckTriggerByTodo[pvTodo.id] ?? 0,
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
      },
      getStarCount: (todo) => {
        return isInChoreStage(
          descriptorByType['positional-notation'].getStage(todo)
        )
          ? undefined
          : todo.starValue
      },
      getPrimaryAction: (todo) => {
        const stage = descriptorByType['positional-notation'].getStage(todo)
        const icon =
          deps.theme.id === 'princess' ? (
            <img
              src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
              alt="Math task"
              className="h-6 w-6 object-contain"
            />
          ) : (
            <span role="img" aria-label="Math task">
              🔢
            </span>
          )
        return createPresetTestPrimaryAction({
          choreType: 'positional-notation',
          stage,
          icon,
          onReset: (item) => deps.handlePVReset(item as PositionalNotationTodo),
          onCheck: (item) => {
            const currentTodo = item as PositionalNotationTodo
            if (deps.activePVTodoId === currentTodo.id) {
              deps.setPVCheckTriggerByTodo((prev) => ({
                ...prev,
                [currentTodo.id]: (prev[currentTodo.id] ?? 0) + 1,
              }))
            }
          },
          onStart: (item) => {
            const currentTodo = item as PositionalNotationTodo
            if (deps.activeDinnerTodoId)
              deps.clearDinnerTodoState(deps.activeDinnerTodoId)
            deps.setActiveMathTodoId(null)
            deps.setActivePVTodoId(currentTodo.id)
          },
        })
      },
      getUtilityAction: (todo) => {
        const stage = descriptorByType['positional-notation'].getStage(todo)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset positional notation todo',
          deleteAriaLabel: 'Delete todo',
          onReset: (item) => deps.handlePVReset(item as PositionalNotationTodo),
          onDelete: (item) => deps.handleDeleteTodo(item),
          theme: deps.theme,
        })
      },
    },
    alphabet: {
      kind: 'complexChore',
      getStage: (todo) => {
        const alphabetTodo = todo as AlphabetTodo
        if (alphabetTodo.completedAt) return 'completed'
        return deps.activeAlphabetTodoId === alphabetTodo.id
          ? 'activity'
          : 'setup'
      },
      renderItem: (todo) => {
        const alphabetTodo = todo as AlphabetTodo
        return deps.activeAlphabetTodoId === alphabetTodo.id ||
          Boolean(alphabetTodo.completedAt)
          ? renderAlphabetChore({
              theme: deps.theme,
              totalProblems:
                deps.getAlphabetTotalProblems(alphabetTodo) ??
                DEFAULT_ALPHABET_PROBLEMS,
              starReward: alphabetTodo.starValue,
              isRunning: deps.activeAlphabetTodoId === alphabetTodo.id,
              isCompleted: Boolean(alphabetTodo.completedAt),
              isFailed: alphabetTodo.alphabetLastOutcome === 'failure',
              onAdjustProblems: () => undefined,
              onStarsChange: () => undefined,
              onComplete: () => deps.handleAlphabetComplete(alphabetTodo),
              onFail: () => deps.handleAlphabetFail(alphabetTodo),
              checkTrigger:
                deps.alphabetCheckTriggerByTodo[alphabetTodo.id] ?? 0,
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
      },
      getStarCount: (todo) =>
        isInChoreStage(descriptorByType.alphabet.getStage(todo))
          ? undefined
          : todo.starValue,
      getPrimaryAction: (todo) => {
        const stage = descriptorByType.alphabet.getStage(todo)
        return createPresetTestPrimaryAction({
          choreType: 'alphabet',
          stage,
          icon: (
            <img
              src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
              alt={
                stage === 'completed'
                  ? 'Reset'
                  : stage === 'activity'
                    ? 'Check answer'
                    : 'Start'
              }
              className="h-6 w-6 object-contain"
            />
          ),
          onReset: (item) => deps.handleAlphabetReset(item as AlphabetTodo),
          onCheck: (item) => {
            const currentTodo = item as AlphabetTodo
            if (deps.activeAlphabetTodoId === currentTodo.id) {
              deps.setAlphabetCheckTriggerByTodo((prev) => ({
                ...prev,
                [currentTodo.id]: (prev[currentTodo.id] ?? 0) + 1,
              }))
            }
          },
          onStart: (item) => {
            deps.setActiveAlphabetTodoId((item as AlphabetTodo).id)
          },
        })
      },
      getUtilityAction: (todo) => {
        const stage = descriptorByType.alphabet.getStage(todo)
        return createPresetUtilityAction({
          stage,
          resetAriaLabel: 'Reset alphabet todo',
          deleteAriaLabel: 'Delete todo',
          onReset: (item) => deps.handleAlphabetReset(item as AlphabetTodo),
          onDelete: (item) => deps.handleDeleteTodo(item),
          theme: deps.theme,
        })
      },
    },
  }

  const getDescriptor = (todo: TodoRecord) =>
    descriptorByType[todo.sourceTaskType]

  return {
    renderItem: (todo) => {
      const descriptor = getDescriptor(todo)
      const stage = descriptor.getStage(todo)
      const hideTitle = isInChoreStage(stage)

      return (
        <div
          className="flex flex-col"
          style={{ gap: `${Math.max(12, uiTokens.singleVerticalSpace / 2)}px` }}
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
              {todo.title}
            </div>
          )}

          {descriptor.renderItem(todo)}
        </div>
      )
    },
    getStarCount: (todo) => getDescriptor(todo).getStarCount?.(todo),
    isHighlighted: (todo) => Boolean(todo.completedAt),
    getPrimaryAction: (todo) => getDescriptor(todo).getPrimaryAction(todo),
    getUtilityAction: (todo) => getDescriptor(todo).getUtilityAction!(todo),
  }
}
