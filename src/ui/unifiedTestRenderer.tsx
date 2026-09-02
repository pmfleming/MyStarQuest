import type { ReactNode } from 'react'
import type { ActivityChoreProps } from '../components/ui/ActivityControls'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ANIMALS_PROBLEMS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_SPELLING_PROBLEMS,
  type TaskOutcome,
  type TaskUpdatableFields,
  type TaskWithEphemeral,
  type TestType,
  type TodoRecord,
} from '../data/types'
import type { ChoreStage } from './choreModeDefinitions'
import {
  renderAlphabetChore,
  renderAnimalsChore,
  renderArithmeticChore,
  renderLargeNumbersChore,
  renderPositionalNotationChore,
  renderSpellingChore,
} from './presetChoreRenderers'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import { isTaskItem, type UnifiedChoreState } from './unifiedChoreState'
import { clamp, noop } from './unifiedChoreRenderUtils'

type TestVariant =
  'math' | 'largeNumbers' | 'pv' | 'alphabet' | 'spelling' | 'animals'
type TestTaskItem = Extract<TaskWithEphemeral, { taskType: TestType }>
type TestTodoItem = Extract<TodoRecord, { sourceTaskType: TestType }>
type TestOutcome = TaskOutcome | null | undefined
type ProblemField = Extract<
  keyof TaskUpdatableFields,
  | 'mathTotalProblems'
  | 'largeNumbersTotalProblems'
  | 'pvTotalProblems'
  | 'alphabetTotalProblems'
  | 'spellingTotalProblems'
  | 'animalsTotalProblems'
>
type ActivityRenderer = (props: ActivityChoreProps) => ReactNode

type TaskActivityOptions = {
  variant: TestVariant
  problemField: ProblemField
  totalProblems: number
  completedAt?: number | null
  outcome?: TestOutcome
  render: ActivityRenderer
}

type TodoActivityOptions = {
  variant: TestVariant
  totalProblems: number
  outcome?: TestOutcome
  render: ActivityRenderer
}

export const renderTestContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  if (isTaskItem(item)) return renderTaskTest(deps, state, item)
  if (stage !== 'activity' && stage !== 'completed') return null
  return renderTodoTest(deps, state, item)
}

const renderTaskTest = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TaskWithEphemeral
): ReactNode | null => {
  switch (item.taskType) {
    case 'math': {
      const totalProblems = item.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS
      return renderTaskActivity(deps, state, item, {
        variant: 'math',
        problemField: 'mathTotalProblems',
        totalProblems,
        completedAt: item.manageMathCompletedAt,
        outcome: item.manageMathLastOutcome,
        render: (props) =>
          renderArithmeticChore({
            ...props,
            difficulty: item.mathDifficulty ?? 'easy',
            onDifficultyChange: (difficulty) =>
              deps.onUpdateTaskField?.(item.id, {
                mathDifficulty: difficulty,
              }),
          }),
      })
    }
    case 'large-numbers': {
      const totalProblems =
        item.largeNumbersTotalProblems ?? DEFAULT_LARGE_NUMBERS_PROBLEMS
      return renderTaskActivity(deps, state, item, {
        variant: 'largeNumbers',
        problemField: 'largeNumbersTotalProblems',
        totalProblems,
        completedAt: item.manageLargeNumbersCompletedAt,
        outcome: item.manageLargeNumbersLastOutcome,
        render: renderLargeNumbersChore,
      })
    }
    case 'positional-notation': {
      const totalProblems = item.pvTotalProblems ?? DEFAULT_PV_PROBLEMS
      return renderTaskActivity(deps, state, item, {
        variant: 'pv',
        problemField: 'pvTotalProblems',
        totalProblems,
        completedAt: item.managePVCompletedAt,
        outcome: item.managePVLastOutcome,
        render: renderPositionalNotationChore,
      })
    }
    case 'alphabet': {
      const totalProblems =
        item.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS
      return renderTaskActivity(deps, state, item, {
        variant: 'alphabet',
        problemField: 'alphabetTotalProblems',
        totalProblems,
        completedAt: item.manageAlphabetCompletedAt,
        outcome: item.manageAlphabetLastOutcome,
        render: renderAlphabetChore,
      })
    }
    case 'spelling': {
      const totalProblems =
        item.spellingTotalProblems ?? DEFAULT_SPELLING_PROBLEMS
      return renderTaskActivity(deps, state, item, {
        variant: 'spelling',
        problemField: 'spellingTotalProblems',
        totalProblems,
        completedAt: item.manageSpellingCompletedAt,
        outcome: item.manageSpellingLastOutcome,
        render: renderSpellingChore,
      })
    }
    case 'animals': {
      const totalProblems =
        item.animalsTotalProblems ?? DEFAULT_ANIMALS_PROBLEMS
      return renderTaskActivity(deps, state, item, {
        variant: 'animals',
        problemField: 'animalsTotalProblems',
        totalProblems,
        completedAt: item.manageAnimalsCompletedAt,
        outcome: item.manageAnimalsLastOutcome,
        render: renderAnimalsChore,
      })
    }
    default:
      return null
  }
}

const renderTodoTest = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TodoRecord
): ReactNode | null => {
  switch (item.sourceTaskType) {
    case 'math':
      return renderTodoActivity(deps, state, item, {
        variant: 'math',
        totalProblems: item.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
        outcome: item.mathLastOutcome,
        render: renderArithmeticChore,
      })
    case 'large-numbers':
      return renderTodoActivity(deps, state, item, {
        variant: 'largeNumbers',
        totalProblems:
          item.largeNumbersTotalProblems ?? DEFAULT_LARGE_NUMBERS_PROBLEMS,
        outcome: item.largeNumbersLastOutcome,
        render: renderLargeNumbersChore,
      })
    case 'positional-notation':
      return renderTodoActivity(deps, state, item, {
        variant: 'pv',
        totalProblems: item.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
        outcome: item.pvLastOutcome,
        render: renderPositionalNotationChore,
      })
    case 'alphabet':
      return renderTodoActivity(deps, state, item, {
        variant: 'alphabet',
        totalProblems: item.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
        outcome: item.alphabetLastOutcome,
        render: renderAlphabetChore,
      })
    case 'spelling':
      return renderTodoActivity(deps, state, item, {
        variant: 'spelling',
        totalProblems: item.spellingTotalProblems ?? DEFAULT_SPELLING_PROBLEMS,
        outcome: item.spellingLastOutcome,
        render: renderSpellingChore,
      })
    case 'animals':
      return renderTodoActivity(deps, state, item, {
        variant: 'animals',
        totalProblems: item.animalsTotalProblems ?? DEFAULT_ANIMALS_PROBLEMS,
        outcome: item.animalsLastOutcome,
        render: renderAnimalsChore,
      })
    default:
      return null
  }
}

const renderTaskActivity = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TestTaskItem,
  options: TaskActivityOptions
) =>
  options.render({
    theme: deps.theme,
    totalProblems: options.totalProblems,
    ...createTaskActivityProps(deps, state, item, options.variant),
    isCompleted: Boolean(options.completedAt),
    isFailed: isFailureModeEnabled(deps) && options.outcome === 'failure',
    onAdjustProblems: (delta) =>
      updateProblemCount(
        deps,
        item.id,
        options.problemField,
        options.totalProblems,
        delta
      ),
  })

const renderTodoActivity = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TestTodoItem,
  options: TodoActivityOptions
) =>
  options.render({
    theme: deps.theme,
    totalProblems: options.totalProblems,
    ...createTodoActivityProps(
      deps,
      state,
      item,
      options.variant,
      options.outcome
    ),
    isCompleted: Boolean(item.completedAt),
    onAdjustProblems: noop,
  })

const createTaskActivityProps = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TestTaskItem,
  variant: TestVariant
) => {
  const failureModeEnabled = isFailureModeEnabled(deps)
  const outcomeImages = state.testOutcomeImages()

  return {
    starReward: item.starValue,
    isEditable: Boolean(deps.onUpdateTaskField),
    isRunning: getActiveTestId(deps, variant) === item.id,
    failureModeEnabled,
    onStarsChange: (value: number) =>
      deps.onUpdateTaskField?.(item.id, { starValue: value }),
    onExit: deps.onExitActivity,
    onComplete: () => deps.onComplete?.(item),
    onFail: failureModeEnabled ? () => deps.onFail?.(item) : undefined,
    checkTrigger: getCheckTrigger(deps, variant, item.id),
    completionImage: outcomeImages.completionImage,
    failureImage: failureModeEnabled ? outcomeImages.failureImage : undefined,
  }
}

const createTodoActivityProps = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TestTodoItem,
  variant: TestVariant,
  outcome: TestOutcome
) => ({
  starReward: item.starValue,
  isEditable: false,
  isRunning: getActiveTestId(deps, variant) === item.id,
  isFailed: outcome === 'failure',
  onStarsChange: noop,
  onExit: deps.onExitActivity,
  onComplete: () => deps.onComplete?.(item),
  onFail: () => deps.onFail?.(item),
  checkTrigger: getCheckTrigger(deps, variant, item.id),
  ...state.testOutcomeImages(),
})

const getActiveTestId = (deps: UnifiedChoreDeps, variant: TestVariant) => {
  const activeIds: Record<TestVariant, string | null> = {
    math: deps.activeMathId,
    largeNumbers: deps.activeLargeNumbersId,
    pv: deps.activePVId,
    alphabet: deps.activeAlphabetId,
    spelling: deps.activeSpellingId,
    animals: deps.activeAnimalsId,
  }
  return activeIds[variant]
}

const getCheckTrigger = (
  deps: UnifiedChoreDeps,
  variant: TestVariant,
  id: string
) => {
  const triggers: Record<TestVariant, Record<string, number>> = {
    math: deps.mathCheckTriggers,
    largeNumbers: deps.largeNumbersCheckTriggers,
    pv: deps.pvCheckTriggers,
    alphabet: deps.alphabetCheckTriggers,
    spelling: deps.spellingCheckTriggers,
    animals: deps.animalsCheckTriggers,
  }
  return triggers[variant][id] ?? 0
}

const updateProblemCount = (
  deps: UnifiedChoreDeps,
  itemId: string,
  field: ProblemField,
  current: number,
  delta: number
) =>
  deps.onUpdateTaskField?.(itemId, {
    [field]: clamp(current + delta, 1, 9),
  })

const isFailureModeEnabled = (deps: UnifiedChoreDeps) =>
  deps.testFailureModeEnabled !== false
