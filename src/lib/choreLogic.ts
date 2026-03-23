import type { TaskWithEphemeral } from '../data/types'

/**
 * Common logic for awarding a task based on its type.
 * Returns the ephemeral state update patch.
 */
export function calculateAwardTaskPatch(
  task: TaskWithEphemeral,
  timestamp: number
) {
  switch (task.taskType) {
    case 'standard':
      return { manageCompletedAt: timestamp }
    case 'eating':
      return { manageDinnerCompletedAt: timestamp }
    case 'math':
      return { manageMathCompletedAt: timestamp }
    case 'positional-notation':
      return { managePVCompletedAt: timestamp }
    case 'alphabet':
      return { manageAlphabetCompletedAt: timestamp }
    default:
      return {}
  }
}

/**
 * Logic for applying a bite in dinner activity.
 * Returns null if no bite can be applied, otherwise returns the next state.
 */
export function calculateNextDinnerBiteState(
  currentBitesLeft: number,
  isComplete: boolean
) {
  if (isComplete || currentBitesLeft <= 0) return null
  const nextBites = Math.max(0, currentBitesLeft - 1)
  return {
    nextBites,
    isNowComplete: nextBites === 0,
  }
}
