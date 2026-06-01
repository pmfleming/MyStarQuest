import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  isAlphabetTask,
  isAlphabetTodo,
  isMathTask,
  isMathTodo,
  isPositionalNotationTask,
  isPositionalNotationTodo,
  type AlphabetTaskWithEphemeral,
  type AlphabetTodo,
  type MathTaskWithEphemeral,
  type MathTodo,
  type PVTaskWithEphemeral,
  type PositionalNotationTodo,
  type TaskOutcome,
} from '../data/types'
import type { ChoreStage } from './choreModeDefinitions'
import {
  renderAlphabetChore,
  renderArithmeticChore,
  renderPositionalNotationChore,
} from './presetChoreRenderers'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import { isTaskItem, type UnifiedChoreState } from './unifiedChoreState'
import { clamp, noop } from './unifiedChoreRenderUtils'

type TestVariant = 'math' | 'pv' | 'alphabet'
type TestOutcome = TaskOutcome | null

export const renderTestContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  if (isTaskItem(item)) {
    if (isMathTask(item)) return renderMathTask(deps, state, item)
    if (isPositionalNotationTask(item)) return renderPVTask(deps, state, item)
    if (isAlphabetTask(item)) return renderAlphabetTask(deps, state, item)
    return null
  }

  if (stage !== 'activity' && stage !== 'completed') return null
  if (isMathTodo(item)) return renderMathTodo(deps, state, item)
  if (isPositionalNotationTodo(item)) return renderPVTodo(deps, state, item)
  if (isAlphabetTodo(item)) return renderAlphabetTodo(deps, state, item)
  return null
}

const renderMathTask = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: MathTaskWithEphemeral
) =>
  renderArithmeticChore({
    theme: deps.theme,
    totalProblems: item.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
    difficulty: item.mathDifficulty ?? 'easy',
    ...createTaskActivityProps(deps, state, item, 'math'),
    isCompleted: Boolean(item.manageMathCompletedAt),
    isFailed: item.manageMathLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updateMathProblems(deps, item, item.mathTotalProblems, delta),
    onDifficultyChange: (difficulty) =>
      deps.onUpdateTaskField?.(item.id, { mathDifficulty: difficulty }),
  })

const renderPVTask = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: PVTaskWithEphemeral
) =>
  renderPositionalNotationChore({
    theme: deps.theme,
    totalProblems: item.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
    ...createTaskActivityProps(deps, state, item, 'pv'),
    isCompleted: Boolean(item.managePVCompletedAt),
    isFailed: item.managePVLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updatePVProblems(deps, item, item.pvTotalProblems, delta),
  })

const renderAlphabetTask = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: AlphabetTaskWithEphemeral
) =>
  renderAlphabetChore({
    theme: deps.theme,
    totalProblems: item.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
    ...createTaskActivityProps(deps, state, item, 'alphabet'),
    isCompleted: Boolean(item.manageAlphabetCompletedAt),
    isFailed: item.manageAlphabetLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updateAlphabetProblems(deps, item, item.alphabetTotalProblems, delta),
  })

const renderMathTodo = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: MathTodo
) =>
  renderArithmeticChore({
    theme: deps.theme,
    totalProblems: item.mathTotalProblems ?? DEFAULT_MATH_PROBLEMS,
    difficulty: item.mathDifficulty ?? 'easy',
    ...createTodoActivityProps(deps, state, item, 'math', item.mathLastOutcome),
    isCompleted: Boolean(item.completedAt),
    onAdjustProblems: noop,
  })

const renderPVTodo = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: PositionalNotationTodo
) =>
  renderPositionalNotationChore({
    theme: deps.theme,
    totalProblems: item.pvTotalProblems ?? DEFAULT_PV_PROBLEMS,
    ...createTodoActivityProps(deps, state, item, 'pv', item.pvLastOutcome),
    isCompleted: Boolean(item.completedAt),
    onAdjustProblems: noop,
  })

const renderAlphabetTodo = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: AlphabetTodo
) =>
  renderAlphabetChore({
    theme: deps.theme,
    totalProblems: item.alphabetTotalProblems ?? DEFAULT_ALPHABET_PROBLEMS,
    ...createTodoActivityProps(
      deps,
      state,
      item,
      'alphabet',
      item.alphabetLastOutcome
    ),
    isCompleted: Boolean(item.completedAt),
    onAdjustProblems: noop,
  })

const createTaskActivityProps = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: MathTaskWithEphemeral | PVTaskWithEphemeral | AlphabetTaskWithEphemeral,
  variant: TestVariant
) => ({
  starReward: item.starValue,
  isRunning: getActiveTestId(deps, variant) === item.id,
  onStarsChange: (value: number) =>
    deps.onUpdateTaskField?.(item.id, { starValue: value }),
  onComplete: () => deps.onComplete?.(item),
  onFail: () => deps.onFail?.(item),
  checkTrigger: getCheckTrigger(deps, variant, item.id),
  ...state.testOutcomeImages(),
})

const createTodoActivityProps = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: MathTodo | PositionalNotationTodo | AlphabetTodo,
  variant: TestVariant,
  lastOutcome: TestOutcome
) => ({
  starReward: item.starValue,
  isRunning: getActiveTestId(deps, variant) === item.id,
  isFailed: lastOutcome === 'failure',
  onStarsChange: noop,
  onComplete: () => deps.onComplete?.(item),
  onFail: () => deps.onFail?.(item),
  checkTrigger: getCheckTrigger(deps, variant, item.id),
  ...state.testOutcomeImages(),
})

const getActiveTestId = (deps: UnifiedChoreDeps, variant: TestVariant) => {
  const activeIds: Record<TestVariant, string | null> = {
    math: deps.activeMathId,
    pv: deps.activePVId,
    alphabet: deps.activeAlphabetId,
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
    pv: deps.pvCheckTriggers,
    alphabet: deps.alphabetCheckTriggers,
  }
  return triggers[variant][id] ?? 0
}

const updateMathProblems = (
  deps: UnifiedChoreDeps,
  item: MathTaskWithEphemeral,
  current: number | undefined,
  delta: number
) =>
  deps.onUpdateTaskField?.(item.id, {
    mathTotalProblems: clamp((current ?? DEFAULT_MATH_PROBLEMS) + delta, 1, 10),
  })

const updatePVProblems = (
  deps: UnifiedChoreDeps,
  item: PVTaskWithEphemeral,
  current: number | undefined,
  delta: number
) =>
  deps.onUpdateTaskField?.(item.id, {
    pvTotalProblems: clamp((current ?? DEFAULT_PV_PROBLEMS) + delta, 1, 10),
  })

const updateAlphabetProblems = (
  deps: UnifiedChoreDeps,
  item: AlphabetTaskWithEphemeral,
  current: number | undefined,
  delta: number
) =>
  deps.onUpdateTaskField?.(item.id, {
    alphabetTotalProblems: clamp(
      (current ?? DEFAULT_ALPHABET_PROBLEMS) + delta,
      1,
      10
    ),
  })
