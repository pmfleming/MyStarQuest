import {
  manageCompletedAtFieldByType,
  type TaskWithEphemeral,
  type ToiletStatus,
  type WaterLevel,
} from '../data/types'

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

const getNextCycleValue = <Value>(cycle: readonly Value[], current: Value) =>
  cycle[(cycle.indexOf(current) + 1) % cycle.length]

export function calculateWaterToiletStars(
  waterLevel: WaterLevel,
  toiletStatus: ToiletStatus
) {
  return waterLevelStarMap[waterLevel] + toiletStatusStarMap[toiletStatus]
}

export function getNextWaterLevel(currentLevel: WaterLevel) {
  return getNextCycleValue(waterLevelCycle, currentLevel)
}

export function getNextToiletStatus(currentStatus: ToiletStatus) {
  return getNextCycleValue(toiletStatusCycle, currentStatus)
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
  const field = manageCompletedAtFieldByType[task.taskType]
  return field ? { [field]: timestamp } : {}
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
