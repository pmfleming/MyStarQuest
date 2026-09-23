import type { ReactNode } from 'react'
import type { ActivityChoreProps } from '../components/ui/ActivityControls'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ANIMALS_PROBLEMS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_FRACTIONS_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_SPELLING_PROBLEMS,
  isTestType,
  manageOutcomeFieldByType,
  type TaskEphemeralState,
  type TaskUpdatableFields,
  type TaskWithEphemeral,
  type TestType,
} from '../data/types'
import {
  renderAlphabetChore,
  renderAnimalsChore,
  renderArithmeticChore,
  renderLargeNumbersChore,
  renderFractionsChore,
  renderPositionalNotationChore,
  renderSpellingChore,
} from './presetChoreRenderers'
import type { UnifiedChoreDeps } from './unifiedChoreDescriptorTypes'
import type { UnifiedChoreState } from './unifiedChoreState'
import { clamp } from './unifiedChoreRenderUtils'

type TestTaskItem = Extract<TaskWithEphemeral, { taskType: TestType }>
type ProblemField = Extract<keyof TaskUpdatableFields, `${string}TotalProblems`>
type ActivityRenderer = (props: ActivityChoreProps) => ReactNode

// Each activity keeps its field names, defaults, and renderer together.
const testActivities = {
  fractions: {
    problemField: 'fractionsTotalProblems',
    defaultProblems: DEFAULT_FRACTIONS_PROBLEMS,
    render: renderFractionsChore,
  },
  math: {
    problemField: 'mathTotalProblems',
    defaultProblems: DEFAULT_MATH_PROBLEMS,
    render: renderArithmeticChore,
  },
  'large-numbers': {
    problemField: 'largeNumbersTotalProblems',
    defaultProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
    render: renderLargeNumbersChore,
  },
  'positional-notation': {
    problemField: 'pvTotalProblems',
    defaultProblems: DEFAULT_PV_PROBLEMS,
    render: renderPositionalNotationChore,
  },
  alphabet: {
    problemField: 'alphabetTotalProblems',
    defaultProblems: DEFAULT_ALPHABET_PROBLEMS,
    render: renderAlphabetChore,
  },
  spelling: {
    problemField: 'spellingTotalProblems',
    defaultProblems: DEFAULT_SPELLING_PROBLEMS,
    render: renderSpellingChore,
  },
  animals: {
    problemField: 'animalsTotalProblems',
    defaultProblems: DEFAULT_ANIMALS_PROBLEMS,
    render: renderAnimalsChore,
  },
} satisfies {
  [Type in TestType]: {
    problemField: Extract<
      keyof Extract<TestTaskItem, { taskType: Type }>,
      ProblemField
    >
    defaultProblems: number
    render: ActivityRenderer
  }
}

export const renderTestContent = (
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
