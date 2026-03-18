import type { Dispatch, ReactNode, SetStateAction } from 'react'
import ArithmeticTester from '../components/ArithmeticTester'
import AlphabetTester from '../components/AlphabetTester'
import DinnerCountdown from '../components/DinnerCountdown'
import PositionalNotation from '../components/PositionalNotation'
import {
  princessActiveIcon,
  princessEatingFailImage,
  princessEatingFullImage,
  princessGiveStarIcon,
  princessQuizCorrectImage,
  princessMathsIcon,
  princessQuizIncorrectImage,
  princessPlateImage,
  princessResetIcon,
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

type ChoreUiKind = 'complexChore' | 'simpleChore' | 'configOnly'
type ChoreStage = 'setup' | 'activity' | 'completed'

type TodayTodoTypeUiDescriptor = {
  kind: ChoreUiKind
  getStage: (todo: TodoRecord) => ChoreStage
  renderItem: (todo: TodoRecord) => ReactNode
  getStarCount?: (todo: TodoRecord) => number | undefined
  getPrimaryAction: (todo: TodoRecord) => {
    label: string
    ariaLabel?: string
    icon: ReactNode
    disabled?: boolean
    variant?: 'primary' | 'neutral' | 'danger'
    showLabel?: boolean
    onClick: (item: TodoRecord) => void | Promise<void>
  }
  getUtilityAction?: (todo: TodoRecord) => {
    label: string
    ariaLabel: string
    icon?: ReactNode
    exits?: boolean
    variant: 'neutral' | 'danger'
    onClick: (item: TodoRecord) => void | Promise<void>
  }
}

type TodayTodoDescriptorDeps = {
  theme: Theme
  biteCooldownSeconds: number
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
  handleDeleteTodo: (todo: TodoRecord) => void | Promise<void>
}

const getResetUtilityAction = (
  ariaLabel: string,
  onClick: (todo: TodoRecord) => void | Promise<void>,
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
  onClick: (todo: TodoRecord) => void | Promise<void>
) => ({
  label: 'Delete',
  ariaLabel,
  exits: true,
  variant: 'danger' as const,
  onClick,
})

export const createTodayTodoListRowDescriptor = (
  deps: TodayTodoDescriptorDeps
): ListRowDescriptor<TodoRecord> => {
  const isPVTodoInTask = (todo: PositionalNotationTodo) =>
    deps.activePVTodoId === todo.id || Boolean(todo.completedAt)

  const descriptorByType: Record<
    TodoRecord['sourceTaskType'],
    TodayTodoTypeUiDescriptor
  > = {
    standard: {
      kind: 'configOnly',
      getStage: (todo) => (todo.completedAt ? 'completed' : 'setup'),
      renderItem: () => null,
      getStarCount: (todo) => todo.starValue,
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
        variant: 'primary',
        showLabel: false,
        onClick: (item) => deps.handleCompleteTodo(item),
      }),
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
        return deps.isDinnerTodoInActivity(eatingTodo) ? (
          <DinnerCountdown
            theme={deps.theme}
            duration={deps.getDinnerDuration(eatingTodo)}
            remaining={deps.getDinnerLiveRemaining(eatingTodo)}
            totalBites={deps.getDinnerTotalBites(eatingTodo)}
            bitesLeft={deps.getDinnerBitesLeft(eatingTodo)}
            starReward={eatingTodo.starValue}
            isTimerRunning={deps.isDinnerTodoRunning(eatingTodo)}
            plateImage={
              deps.theme.id === 'princess' ? princessPlateImage : undefined
            }
            onAdjustTime={() => undefined}
            onAdjustBites={() => undefined}
            onStarsChange={() => undefined}
            isCompleted={Boolean(eatingTodo.completedAt)}
            completionImage={
              deps.theme.id === 'princess' ? princessEatingFullImage : undefined
            }
            failureImage={
              deps.theme.id === 'princess' ? princessEatingFailImage : undefined
            }
            biteCooldownSeconds={deps.biteCooldownSeconds}
            biteIcon={
              deps.theme.id === 'princess'
                ? deps.activePrincessMealIcon
                : undefined
            }
            showSetupControls={false}
            showStarReward={false}
          />
        ) : null
      },
      getStarCount: (todo) =>
        deps.isDinnerTodoInActivity(todo as EatingTodo)
          ? undefined
          : todo.starValue,
      getPrimaryAction: (todo) => {
        const eatingTodo = todo as EatingTodo
        const icon =
          deps.theme.id === 'princess' ? (
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
        return {
          label: 'Open chore',
          icon,
          disabled:
            Boolean(eatingTodo.completedAt) ||
            deps.pendingTodoId === eatingTodo.id ||
            (deps.isDinnerTodoRunning(eatingTodo) &&
              deps.biteCooldownSeconds > 0),
          variant: 'primary',
          showLabel: false,
          onClick: (item) => {
            const currentTodo = item as EatingTodo
            deps.setActiveMathTodoId(null)
            deps.setActivePVTodoId(null)
            if (deps.isDinnerTodoRunning(currentTodo)) {
              deps.handleDinnerBite(currentTodo)
              return
            }
            deps.dinnerStartTimer(currentTodo)
            deps.startDinnerActivity(currentTodo.id)
          },
        }
      },
      getUtilityAction: (todo) => {
        const eatingTodo = todo as EatingTodo
        return deps.isDinnerTodoInActivity(eatingTodo)
          ? getResetUtilityAction(
              'Reset dinner todo',
              (item) => deps.handleDinnerReset(item as EatingTodo),
              deps.theme
            )
          : getDeleteUtilityAction('Delete todo', (item) =>
              deps.handleDeleteTodo(item)
            )
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
          Boolean(mathTodo.completedAt) ? (
          <ArithmeticTester
            theme={deps.theme}
            totalProblems={deps.getMathTotalProblems(mathTodo)}
            starReward={mathTodo.starValue}
            difficulty={deps.getMathDifficulty(mathTodo)}
            isRunning={deps.activeMathTodoId === mathTodo.id}
            isCompleted={Boolean(mathTodo.completedAt)}
            isFailed={mathTodo.mathLastOutcome === 'failure'}
            onAdjustProblems={() => undefined}
            onStarsChange={() => undefined}
            onComplete={() => deps.handleMathComplete(mathTodo)}
            onFail={() => deps.handleMathFail(mathTodo)}
            checkTrigger={deps.mathCheckTriggerByTodo[mathTodo.id] ?? 0}
            completionImage={
              deps.theme.id === 'princess'
                ? princessQuizCorrectImage
                : undefined
            }
            failureImage={
              deps.theme.id === 'princess'
                ? princessQuizIncorrectImage
                : undefined
            }
          />
        ) : null
      },
      getStarCount: (todo) => {
        const pvTodo = todo as PositionalNotationTodo
        return isPVTodoInTask(pvTodo) ? undefined : pvTodo.starValue
      },
      getPrimaryAction: (todo) => {
        const mathTodo = todo as MathTodo
        const icon =
          deps.theme.id === 'princess' ? (
            <img
              src={
                deps.theme.id === 'princess'
                  ? princessMathsIcon
                  : princessGiveStarIcon
              }
              alt="Math task"
              className="h-6 w-6 object-contain"
            />
          ) : (
            <span role="img" aria-label="Math task">
              🔢
            </span>
          )
        return {
          label: 'Open chore',
          icon,
          disabled: Boolean(mathTodo.completedAt),
          variant: 'primary',
          showLabel: false,
          onClick: (item) => {
            const currentTodo = item as MathTodo
            if (deps.activeDinnerTodoId)
              deps.clearDinnerTodoState(deps.activeDinnerTodoId)
            deps.setActivePVTodoId(null)
            if (deps.activeMathTodoId === currentTodo.id) {
              deps.setMathCheckTriggerByTodo((prev) => ({
                ...prev,
                [currentTodo.id]: (prev[currentTodo.id] ?? 0) + 1,
              }))
              return
            }
            deps.setActiveMathTodoId(currentTodo.id)
          },
        }
      },
      getUtilityAction: (todo) => {
        const mathTodo = todo as MathTodo
        const inActivity =
          deps.activeMathTodoId === mathTodo.id || Boolean(mathTodo.completedAt)
        return inActivity
          ? getResetUtilityAction(
              'Reset arithmetic todo',
              (item) => deps.handleMathReset(item as MathTodo),
              deps.theme
            )
          : getDeleteUtilityAction('Delete todo', (item) =>
              deps.handleDeleteTodo(item)
            )
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
        return deps.activePVTodoId === pvTodo.id ||
          Boolean(pvTodo.completedAt) ? (
          <PositionalNotation
            theme={deps.theme}
            totalProblems={deps.getPVTotalProblems(pvTodo)}
            starReward={pvTodo.starValue}
            isRunning={deps.activePVTodoId === pvTodo.id}
            isCompleted={Boolean(pvTodo.completedAt)}
            isFailed={pvTodo.pvLastOutcome === 'failure'}
            onAdjustProblems={() => undefined}
            onStarsChange={() => undefined}
            onComplete={() => deps.handlePVComplete(pvTodo)}
            onFail={() => deps.handlePVFail(pvTodo)}
            checkTrigger={deps.pvCheckTriggerByTodo[pvTodo.id] ?? 0}
            completionImage={
              deps.theme.id === 'princess'
                ? princessQuizCorrectImage
                : undefined
            }
            failureImage={
              deps.theme.id === 'princess'
                ? princessQuizIncorrectImage
                : undefined
            }
          />
        ) : null
      },
      getStarCount: (todo) => {
        const pvTodo = todo as PositionalNotationTodo
        return isPVTodoInTask(pvTodo) ? undefined : pvTodo.starValue
      },
      getPrimaryAction: (todo) => {
        const pvTodo = todo as PositionalNotationTodo
        const icon =
          deps.theme.id === 'princess' ? (
            <img
              src={princessMathsIcon}
              alt="Math task"
              className="h-6 w-6 object-contain"
            />
          ) : (
            <span role="img" aria-label="Math task">
              🔢
            </span>
          )
        return {
          label: 'Open chore',
          icon,
          disabled: Boolean(pvTodo.completedAt),
          variant: 'primary',
          showLabel: false,
          onClick: (item) => {
            const currentTodo = item as PositionalNotationTodo
            if (deps.activeDinnerTodoId)
              deps.clearDinnerTodoState(deps.activeDinnerTodoId)
            deps.setActiveMathTodoId(null)
            if (deps.activePVTodoId === currentTodo.id) {
              deps.setPVCheckTriggerByTodo((prev) => ({
                ...prev,
                [currentTodo.id]: (prev[currentTodo.id] ?? 0) + 1,
              }))
              return
            }
            deps.setActivePVTodoId(currentTodo.id)
          },
        }
      },
      getUtilityAction: (todo) => {
        const pvTodo = todo as PositionalNotationTodo
        const inActivity =
          deps.activePVTodoId === pvTodo.id || Boolean(pvTodo.completedAt)
        return inActivity
          ? getResetUtilityAction(
              'Reset positional notation todo',
              (item) => deps.handlePVReset(item as PositionalNotationTodo),
              deps.theme
            )
          : getDeleteUtilityAction('Delete todo', (item) =>
              deps.handleDeleteTodo(item)
            )
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
        return (
          <AlphabetTester
            theme={deps.theme}
            totalProblems={
              deps.getAlphabetTotalProblems(alphabetTodo) ??
              DEFAULT_ALPHABET_PROBLEMS
            }
            starReward={alphabetTodo.starValue}
            isRunning={deps.activeAlphabetTodoId === alphabetTodo.id}
            isCompleted={Boolean(alphabetTodo.completedAt)}
            isFailed={alphabetTodo.alphabetLastOutcome === 'failure'}
            onAdjustProblems={() => undefined}
            onStarsChange={() => undefined}
            onComplete={() => deps.handleAlphabetComplete(alphabetTodo)}
            onFail={() => deps.handleAlphabetFail(alphabetTodo)}
            checkTrigger={deps.alphabetCheckTriggerByTodo[alphabetTodo.id] ?? 0}
            completionImage={
              deps.theme.id === 'princess'
                ? princessQuizCorrectImage
                : undefined
            }
            failureImage={
              deps.theme.id === 'princess'
                ? princessQuizIncorrectImage
                : undefined
            }
          />
        )
      },
      getPrimaryAction: (todo) => {
        const alphabetTodo = todo as AlphabetTodo
        const isFinished = Boolean(alphabetTodo.completedAt)
        const isRunning =
          deps.activeAlphabetTodoId === alphabetTodo.id && !isFinished
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
            const currentTodo = item as AlphabetTodo
            if (currentTodo.completedAt) {
              return deps.handleAlphabetReset(currentTodo)
            }
            if (deps.activeAlphabetTodoId === currentTodo.id) {
              deps.setAlphabetCheckTriggerByTodo((prev) => ({
                ...prev,
                [currentTodo.id]: (prev[currentTodo.id] ?? 0) + 1,
              }))
              return
            }
            deps.setActiveAlphabetTodoId(currentTodo.id)
          },
        }
      },
      getUtilityAction: (todo) => {
        const alphabetTodo = todo as AlphabetTodo
        const inActivity =
          deps.activeAlphabetTodoId === alphabetTodo.id ||
          Boolean(alphabetTodo.completedAt)
        return inActivity
          ? getResetUtilityAction(
              'Reset alphabet todo',
              (item) => deps.handleAlphabetReset(item as AlphabetTodo),
              deps.theme
            )
          : getDeleteUtilityAction('Delete todo', (item) =>
              deps.handleDeleteTodo(item)
            )
      },
    },
  }

  const getDescriptor = (todo: TodoRecord) =>
    descriptorByType[todo.sourceTaskType]

  return {
    renderItem: (todo) => {
      const descriptor = getDescriptor(todo)
      const stage = descriptor.getStage(todo)
      const hideTitle = stage === 'activity'

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
