import type { ReactNode } from 'react'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_SPELLING_PROBLEMS,
  isAlphabetTask,
  isAlphabetTodo,
  isLargeNumbersTask,
  isLargeNumbersTodo,
  isMathTask,
  isMathTodo,
  isPositionalNotationTask,
  isPositionalNotationTodo,
  isSpellingTask,
  isSpellingTodo,
  type AlphabetTaskWithEphemeral,
  type AlphabetTodo,
  type LargeNumbersTaskWithEphemeral,
  type LargeNumbersTodo,
  type MathTaskWithEphemeral,
  type MathTodo,
  type PVTaskWithEphemeral,
  type PositionalNotationTodo,
  type SpellingTaskWithEphemeral,
  type SpellingTodo,
  type TaskOutcome,
  type TaskWithEphemeral,
  type TodoRecord,
} from '../data/types'
import type { ChoreStage } from './choreModeDefinitions'
import {
  renderAlphabetChore,
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

type TestVariant = 'math' | 'largeNumbers' | 'pv' | 'alphabet' | 'spelling'
type TestOutcome = TaskOutcome | null
type TestContentRenderer<T extends UnifiedChoreItem> = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: T
) => ReactNode | null

export const renderTestContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  if (isTaskItem(item)) {
    return renderFirstMatch(taskTestRenderers, deps, state, item)
  }

  if (stage !== 'activity' && stage !== 'completed') return null
  return renderFirstMatch(todoTestRenderers, deps, state, item)
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
    isFailed:
      isFailureModeEnabled(deps) && item.manageMathLastOutcome === 'failure',
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
    isFailed:
      isFailureModeEnabled(deps) && item.managePVLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updatePVProblems(deps, item, item.pvTotalProblems, delta),
  })

const renderLargeNumbersTask = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: LargeNumbersTaskWithEphemeral
) =>
  renderLargeNumbersChore({
    theme: deps.theme,
    totalProblems:
      item.largeNumbersTotalProblems ?? DEFAULT_LARGE_NUMBERS_PROBLEMS,
    ...createTaskActivityProps(deps, state, item, 'largeNumbers'),
    isCompleted: Boolean(item.manageLargeNumbersCompletedAt),
    isFailed:
      isFailureModeEnabled(deps) &&
      item.manageLargeNumbersLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updateLargeNumbersProblems(
        deps,
        item,
        item.largeNumbersTotalProblems,
        delta
      ),
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
    isFailed:
      isFailureModeEnabled(deps) &&
      item.manageAlphabetLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updateAlphabetProblems(deps, item, item.alphabetTotalProblems, delta),
  })

const renderSpellingTask = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: SpellingTaskWithEphemeral
) =>
  renderSpellingChore({
    theme: deps.theme,
    totalProblems: item.spellingTotalProblems ?? DEFAULT_SPELLING_PROBLEMS,
    ...createTaskActivityProps(deps, state, item, 'spelling'),
    isCompleted: Boolean(item.manageSpellingCompletedAt),
    isFailed:
      isFailureModeEnabled(deps) &&
      item.manageSpellingLastOutcome === 'failure',
    onAdjustProblems: (delta) =>
      updateSpellingProblems(deps, item, item.spellingTotalProblems, delta),
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

const renderLargeNumbersTodo = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: LargeNumbersTodo
) =>
  renderLargeNumbersChore({
    theme: deps.theme,
    totalProblems:
      item.largeNumbersTotalProblems ?? DEFAULT_LARGE_NUMBERS_PROBLEMS,
    ...createTodoActivityProps(
      deps,
      state,
      item,
      'largeNumbers',
      item.largeNumbersLastOutcome
    ),
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

const renderSpellingTodo = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: SpellingTodo
) =>
  renderSpellingChore({
    theme: deps.theme,
    totalProblems: item.spellingTotalProblems ?? DEFAULT_SPELLING_PROBLEMS,
    ...createTodoActivityProps(
      deps,
      state,
      item,
      'spelling',
      item.spellingLastOutcome
    ),
    isCompleted: Boolean(item.completedAt),
    onAdjustProblems: noop,
  })

const createTestRenderer =
  <T extends UnifiedChoreItem, TMatch extends T>(
    matches: (item: T) => item is TMatch,
    render: (
      deps: UnifiedChoreDeps,
      state: UnifiedChoreState,
      item: TMatch
    ) => ReactNode | null
  ): TestContentRenderer<T> =>
  (deps, state, item) =>
    matches(item) ? render(deps, state, item) : null

const renderFirstMatch = <T extends UnifiedChoreItem>(
  renderers: readonly TestContentRenderer<T>[],
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: T
) => {
  for (const render of renderers) {
    const content = render(deps, state, item)
    if (content) return content
  }

  return null
}

const taskTestRenderers = [
  createTestRenderer<TaskWithEphemeral, MathTaskWithEphemeral>(
    isMathTask,
    renderMathTask
  ),
  createTestRenderer<TaskWithEphemeral, LargeNumbersTaskWithEphemeral>(
    isLargeNumbersTask,
    renderLargeNumbersTask
  ),
  createTestRenderer<TaskWithEphemeral, PVTaskWithEphemeral>(
    isPositionalNotationTask,
    renderPVTask
  ),
  createTestRenderer<TaskWithEphemeral, AlphabetTaskWithEphemeral>(
    isAlphabetTask,
    renderAlphabetTask
  ),
  createTestRenderer<TaskWithEphemeral, SpellingTaskWithEphemeral>(
    isSpellingTask,
    renderSpellingTask
  ),
] satisfies readonly TestContentRenderer<TaskWithEphemeral>[]

const todoTestRenderers = [
  createTestRenderer<TodoRecord, MathTodo>(isMathTodo, renderMathTodo),
  createTestRenderer<TodoRecord, LargeNumbersTodo>(
    isLargeNumbersTodo,
    renderLargeNumbersTodo
  ),
  createTestRenderer<TodoRecord, PositionalNotationTodo>(
    isPositionalNotationTodo,
    renderPVTodo
  ),
  createTestRenderer<TodoRecord, AlphabetTodo>(
    isAlphabetTodo,
    renderAlphabetTodo
  ),
  createTestRenderer<TodoRecord, SpellingTodo>(
    isSpellingTodo,
    renderSpellingTodo
  ),
] satisfies readonly TestContentRenderer<TodoRecord>[]

const createTaskActivityProps = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item:
    | MathTaskWithEphemeral
    | LargeNumbersTaskWithEphemeral
    | PVTaskWithEphemeral
    | AlphabetTaskWithEphemeral
    | SpellingTaskWithEphemeral,
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
  item:
    | MathTodo
    | LargeNumbersTodo
    | PositionalNotationTodo
    | AlphabetTodo
    | SpellingTodo,
  variant: TestVariant,
  lastOutcome: TestOutcome
) => ({
  starReward: item.starValue,
  isEditable: false,
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
    largeNumbers: deps.activeLargeNumbersId,
    pv: deps.activePVId,
    alphabet: deps.activeAlphabetId,
    spelling: deps.activeSpellingId,
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
  }
  return triggers[variant][id] ?? 0
}

const isFailureModeEnabled = (deps: UnifiedChoreDeps) =>
  deps.testFailureModeEnabled !== false

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

const updateLargeNumbersProblems = (
  deps: UnifiedChoreDeps,
  item: LargeNumbersTaskWithEphemeral,
  current: number | undefined,
  delta: number
) =>
  deps.onUpdateTaskField?.(item.id, {
    largeNumbersTotalProblems: clamp(
      (current ?? DEFAULT_LARGE_NUMBERS_PROBLEMS) + delta,
      1,
      10
    ),
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

const updateSpellingProblems = (
  deps: UnifiedChoreDeps,
  item: SpellingTaskWithEphemeral,
  current: number | undefined,
  delta: number
) =>
  deps.onUpdateTaskField?.(item.id, {
    spellingTotalProblems: clamp(
      (current ?? DEFAULT_SPELLING_PROBLEMS) + delta,
      1,
      10
    ),
  })
