import {
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  getManageTaskCompletedAt,
  getManageToiletStatus,
  getManageWaterLevel,
  isEatingTask,
  isEatingTodo,
  isWaterToiletTask,
  isWaterToiletTodo,
  type TaskRecord,
  type TaskType,
  type TaskWithEphemeral,
  type TodoRecord,
} from '../data/types'
import {
  calculateWaterToiletStars,
  getNextToiletStatus,
  getNextWaterLevel,
} from '../lib/choreLogic'
import type { ChoreStage } from './choreModeDefinitions'
import type {
  PrincessAsset,
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import {
  princessQuizCorrectImage,
  princessQuizIncorrectImage,
} from '../assets/themes/princess/assets'

export const isTaskItem = (item: UnifiedChoreItem): item is TaskWithEphemeral =>
  'taskType' in item

export const getChoreType = (item: UnifiedChoreItem): TaskType =>
  isTaskItem(item) ? item.taskType : item.sourceTaskType

export const isTestType = (type: TaskType) =>
  type === 'math' ||
  type === 'large-numbers' ||
  type === 'positional-notation' ||
  type === 'alphabet' ||
  type === 'spelling'

export const createUnifiedChoreState = (deps: UnifiedChoreDeps) => {
  const princessAsset = (asset?: string): PrincessAsset =>
    deps.theme.id === 'princess' ? asset : undefined
  const testOutcomeImages = () => ({
    completionImage: princessAsset(princessQuizCorrectImage),
    failureImage: princessAsset(princessQuizIncorrectImage),
  })

  const hasActiveDinnerCooldown = (item: UnifiedChoreItem) =>
    deps.activeDinnerId === item.id &&
    typeof deps.biteCooldownEndsAt === 'number' &&
    deps.biteCooldownEndsAt > Date.now()

  const isCompleted = (item: UnifiedChoreItem) =>
    isTaskItem(item)
      ? Boolean(getManageTaskCompletedAt(item))
      : Boolean(item.completedAt)

  const isDinnerAwaitingFinalCooldown = (item: UnifiedChoreItem) => {
    if (getChoreType(item) !== 'eating' || !isCompleted(item)) return false

    if (isTaskItem(item)) {
      return isEatingTask(item) && getManageDinnerBitesLeft(item) <= 0
        ? hasActiveDinnerCooldown(item)
        : false
    }

    return isEatingTodo(item) && item.dinnerBitesLeft <= 0
      ? hasActiveDinnerCooldown(item)
      : false
  }

  const isDinnerTimedOut = (item: UnifiedChoreItem) => {
    if (getChoreType(item) !== 'eating') return false

    if (isTaskItem(item)) {
      if (!isEatingTask(item)) return false
      return hasExpiredDinnerTimer(
        getManageDinnerRemaining(item),
        item.manageDinnerTimerStartedAt,
        getManageDinnerBitesLeft(item)
      )
    }

    return isEatingTodo(item)
      ? hasExpiredDinnerTimer(
          item.dinnerRemainingSeconds,
          item.dinnerTimerStartedAt,
          item.dinnerBitesLeft
        )
      : false
  }

  const getStage = (item: UnifiedChoreItem): ChoreStage => {
    if (isCompleted(item) || isDinnerTimedOut(item)) {
      return isDinnerAwaitingFinalCooldown(item) ? 'activity' : 'completed'
    }

    return isActiveItem(deps, item.id) ? 'activity' : 'setup'
  }

  const getWaterToiletDelta = (item: UnifiedChoreItem) => {
    if (isTaskItem(item)) {
      if (!isWaterToiletTask(item)) return item.starValue
      return calculateWaterToiletStars(
        getManageWaterLevel(item),
        getManageToiletStatus(item)
      )
    }

    if (!isWaterToiletTodo(item)) return item.starValue
    return calculateWaterToiletStars(item.waterLevel, item.toiletStatus)
  }

  const getWaterToiletRenderState = (item: UnifiedChoreItem) => {
    if (isTaskItem(item)) return getTaskWaterToiletRenderState(deps, item)
    return getTodoWaterToiletRenderState(deps, item)
  }

  return {
    princessAsset,
    testOutcomeImages,
    isCompleted,
    getStage,
    getWaterToiletDelta,
    getWaterToiletRenderState,
  }
}

const hasExpiredDinnerTimer = (
  remaining: number,
  startedAt: number | null | undefined,
  bitesLeft: number
) => {
  if (!startedAt) return remaining <= 0 && bitesLeft > 0
  const elapsed = (Date.now() - startedAt) / 1000
  return remaining - elapsed <= 0 && bitesLeft > 0
}

const isActiveItem = (deps: UnifiedChoreDeps, id: string) =>
  deps.activeMathId === id ||
  deps.activeLargeNumbersId === id ||
  deps.activePVId === id ||
  deps.activeAlphabetId === id ||
  deps.activeSpellingId === id ||
  deps.activeDinnerId === id ||
  deps.activeWaterToiletId === id

const getTaskWaterToiletRenderState = (
  deps: UnifiedChoreDeps,
  item: TaskWithEphemeral
) => {
  if (!isWaterToiletTask(item)) return null

  const waterLevel = getManageWaterLevel(item)
  const toiletStatus = getManageToiletStatus(item)

  return {
    isCompleted: Boolean(item.manageWaterToiletCompletedAt),
    waterLevel,
    toiletStatus,
    starDelta: calculateWaterToiletStars(waterLevel, toiletStatus),
    onCycleWater: () =>
      deps.onUpdateEphemeral?.(item.id, {
        manageWaterLevel: getNextWaterLevel(waterLevel),
      }),
    onCycleToilet: () =>
      deps.onUpdateEphemeral?.(item.id, {
        manageToiletStatus: getNextToiletStatus(toiletStatus),
      }),
  }
}

const getTodoWaterToiletRenderState = (
  deps: UnifiedChoreDeps,
  item: TodoRecord
) => {
  if (!isWaterToiletTodo(item)) return null

  return {
    isCompleted: Boolean(item.completedAt),
    waterLevel: item.waterLevel,
    toiletStatus: item.toiletStatus,
    starDelta: calculateWaterToiletStars(item.waterLevel, item.toiletStatus),
    onCycleWater: () =>
      deps.onUpdateTodoField?.(item.id, {
        waterLevel: getNextWaterLevel(item.waterLevel),
      }),
    onCycleToilet: () =>
      deps.onUpdateTodoField?.(item.id, {
        toiletStatus: getNextToiletStatus(item.toiletStatus),
      }),
  }
}

export type UnifiedChoreState = ReturnType<typeof createUnifiedChoreState>
export type RenderableTaskRecord = TaskRecord
