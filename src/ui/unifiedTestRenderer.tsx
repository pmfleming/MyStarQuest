import type { ReactNode } from 'react'
import type { ActivityChoreProps } from '../components/ui/ActivityControls'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ANIMALS_PROBLEMS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_SPELLING_PROBLEMS,
  isTestType,
  manageOutcomeFieldByType,
  type TaskEphemeralState,
  type TaskUpdatableFields,
  type TaskWithEphemeral,
  type TestType,
  type TodoRecord,
  type TodoUpdatableFields,
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

type TestTaskItem = Extract<TaskWithEphemeral, { taskType: TestType }>
type TestTodoItem = Extract<TodoRecord, { sourceTaskType: TestType }>
type ProblemField = Extract<keyof TaskUpdatableFields, `${string}TotalProblems`>
type ActivityRenderer = (props: ActivityChoreProps) => ReactNode

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

// Each activity keeps its field names, defaults, and renderer together.
const testActivities = {
  math: {
    problemField: 'mathTotalProblems',
    defaultProblems: DEFAULT_MATH_PROBLEMS,
    outcomeField: 'mathLastOutcome',
    render: renderArithmeticChore,
  },
  'large-numbers': {
    problemField: 'largeNumbersTotalProblems',
    defaultProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
    outcomeField: 'largeNumbersLastOutcome',
    render: renderLargeNumbersChore,
  },
  'positional-notation': {
    problemField: 'pvTotalProblems',
    defaultProblems: DEFAULT_PV_PROBLEMS,
    outcomeField: 'pvLastOutcome',
    render: renderPositionalNotationChore,
  },
  alphabet: {
    problemField: 'alphabetTotalProblems',
    defaultProblems: DEFAULT_ALPHABET_PROBLEMS,
    outcomeField: 'alphabetLastOutcome',
    render: renderAlphabetChore,
  },
  spelling: {
    problemField: 'spellingTotalProblems',
    defaultProblems: DEFAULT_SPELLING_PROBLEMS,
    outcomeField: 'spellingLastOutcome',
    render: renderSpellingChore,
  },
  animals: {
    problemField: 'animalsTotalProblems',
    defaultProblems: DEFAULT_ANIMALS_PROBLEMS,
    outcomeField: 'animalsLastOutcome',
    render: renderAnimalsChore,
  },
} satisfies {
  [Type in TestType]: {
    problemField: Extract<
      keyof Extract<TestTaskItem, { taskType: Type }>,
      ProblemField
    >
    defaultProblems: number
    outcomeField: Extract<
      keyof Extract<TestTodoItem, { sourceTaskType: Type }>,
      `${string}LastOutcome`
    >
    render: ActivityRenderer
  }
}

const renderTaskTest = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TaskWithEphemeral
): ReactNode | null => {
  if (!isTestType(item.taskType)) return null
  const type = item.taskType
  const activity = testActivities[type]
  const fields: TaskUpdatableFields = item
  const ephemeral: TaskEphemeralState = item
  const totalProblems =
    fields[activity.problemField] ?? activity.defaultProblems
  const failureModeEnabled = deps.testFailureModeEnabled !== false
  const outcomeImages = state.testOutcomeImages()
  const render =
    item.taskType === 'math'
      ? (props: ActivityChoreProps) =>
          renderArithmeticChore({
            ...props,
            difficulty: item.mathDifficulty ?? 'easy',
            onDifficultyChange: (difficulty) =>
              deps.onUpdateTaskField?.(item.id, { mathDifficulty: difficulty }),
          })
      : activity.render

  return render({
    theme: deps.theme,
    totalProblems,
    starReward: item.starValue,
    isEditable: Boolean(deps.onUpdateTaskField),
    isRunning: deps.activeIds[type] === item.id,
    isCompleted: state.isCompleted(item),
    isFailed:
      failureModeEnabled &&
      ephemeral[manageOutcomeFieldByType[type]] === 'failure',
    failureModeEnabled,
    onAdjustProblems: (delta) =>
      deps.onUpdateTaskField?.(item.id, {
        [activity.problemField]: clamp(totalProblems + delta, 1, 9),
      }),
    onStarsChange: (starValue) =>
      deps.onUpdateTaskField?.(item.id, { starValue }),
    onExit: deps.onExitActivity,
    onComplete: () => deps.onComplete?.(item),
    onFail: failureModeEnabled ? () => deps.onFail?.(item) : undefined,
    checkTrigger: deps.checkTriggers[type]?.[item.id] ?? 0,
    completionImage: outcomeImages.completionImage,
    failureImage: failureModeEnabled ? outcomeImages.failureImage : undefined,
  })
}

const renderTodoTest = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: TodoRecord
): ReactNode | null => {
  if (!isTestType(item.sourceTaskType)) return null
  const type = item.sourceTaskType
  const activity = testActivities[type]
  const fields: TaskUpdatableFields = item
  const outcomes: TodoUpdatableFields = item
  return activity.render({
    theme: deps.theme,
    totalProblems: fields[activity.problemField] ?? activity.defaultProblems,
    starReward: item.starValue,
    isEditable: false,
    isRunning: deps.activeIds[type] === item.id,
    isCompleted: state.isCompleted(item),
    isFailed: outcomes[activity.outcomeField] === 'failure',
    onAdjustProblems: noop,
    onStarsChange: noop,
    onExit: deps.onExitActivity,
    onComplete: () => deps.onComplete?.(item),
    onFail: () => deps.onFail?.(item),
    checkTrigger: deps.checkTriggers[type]?.[item.id] ?? 0,
    ...state.testOutcomeImages(),
  })
}
