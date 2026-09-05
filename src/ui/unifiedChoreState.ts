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

const getDinnerState = (item: UnifiedChoreItem) => {
  if (isTaskItem(item)) {
    return isEatingTask(item)
      ? {
          remaining: getManageDinnerRemaining(item),
          startedAt: item.manageDinnerTimerStartedAt,
          bitesLeft: getManageDinnerBitesLeft(item),
        }
      : null
  }
  return isEatingTodo(item)
    ? {
        remaining: item.dinnerRemainingSeconds,
        startedAt: item.dinnerTimerStartedAt,
        bitesLeft: item.dinnerBitesLeft,
      }
    : null
}

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

  const getStage = (item: UnifiedChoreItem): ChoreStage => {
    const dinner = getDinnerState(item)
    const completed = isCompleted(item)
    if (completed || (dinner && hasExpiredDinnerTimer(dinner))) {
      const awaitingFinalBite = completed && dinner && dinner.bitesLeft <= 0
      return awaitingFinalBite && hasActiveDinnerCooldown(item)
        ? 'activity'
        : 'completed'
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

const hasExpiredDinnerTimer = ({
  remaining,
  startedAt,
  bitesLeft,
}: NonNullable<ReturnType<typeof getDinnerState>>) => {
  const elapsed = startedAt ? (Date.now() - startedAt) / 1000 : 0
  return remaining - elapsed <= 0 && bitesLeft > 0
}

const isActiveItem = (deps: UnifiedChoreDeps, id: string) =>
  [
    deps.activeMathId,
    deps.activeLargeNumbersId,
    deps.activePVId,
    deps.activeAlphabetId,
    deps.activeSpellingId,
    deps.activeAnimalsId,
    deps.activeDinnerId,
    deps.activeWaterToiletId,
  ].includes(id)

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
