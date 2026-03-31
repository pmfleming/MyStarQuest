import type { TaskWithEphemeral, ToiletStatus, WaterLevel } from '../data/types'

export type WaterToiletOutcome = 'success' | 'failure'

const waterLevelCycle: readonly WaterLevel[] = [
  'full',
  'twothirds',
  'onethird',
  'empty',
]

const toiletStatusCycle: readonly ToiletStatus[] = ['notpeepee', 'didpeepee']

const waterLevelStarMap: Record<WaterLevel, number> = {
  full: -1,
  twothirds: 0,
  onethird: 0,
  empty: 1,
}

const toiletStatusStarMap: Record<ToiletStatus, number> = {
  notpeepee: -5,
  didpeepee: 1,
}

export function calculateWaterToiletStars(
  waterLevel: WaterLevel,
  toiletStatus: ToiletStatus
) {
  return waterLevelStarMap[waterLevel] + toiletStatusStarMap[toiletStatus]
}

export function getNextWaterLevel(currentLevel: WaterLevel) {
  const currentIndex = waterLevelCycle.indexOf(currentLevel)
  return waterLevelCycle[(currentIndex + 1) % waterLevelCycle.length]
}

export function getNextToiletStatus(currentStatus: ToiletStatus) {
  const currentIndex = toiletStatusCycle.indexOf(currentStatus)
  return toiletStatusCycle[(currentIndex + 1) % toiletStatusCycle.length]
}

export function getWaterToiletOutcome(
  waterLevel: WaterLevel,
  toiletStatus: ToiletStatus
): WaterToiletOutcome {
  return calculateWaterToiletStars(waterLevel, toiletStatus) > 0
    ? 'success'
    : 'failure'
}

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
    case 'watertoiletcheck':
      return { manageWaterToiletCompletedAt: timestamp }
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
