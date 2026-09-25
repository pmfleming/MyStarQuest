import {
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  getManageTaskCompletedAt,
  getManageToiletStatus,
  getManageWaterLevel,
  isEatingTask,
  isWaterToiletTask,
  type TaskWithEphemeral,
} from '../data/types'
import {
  calculateWaterToiletStars,
  getNextToiletStatus,
  getNextWaterLevel,
} from '../lib/choreLogic'
import type { ChoreStage } from './choreModeDefinitions'
import { getThemeAsset, hasIllustratedTheme } from './themeAssets'
import type {
  ThemedAsset,
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'

const getDinnerState = (item: UnifiedChoreItem) => {
  return isEatingTask(item)
    ? {
        remaining: getManageDinnerRemaining(item),
        startedAt: item.manageDinnerTimerStartedAt,
        bitesLeft: getManageDinnerBitesLeft(item),
      }
    : null
}

export const createUnifiedChoreState = (deps: UnifiedChoreDeps) => {
  const themedAsset = (asset?: string): ThemedAsset =>
    hasIllustratedTheme(deps.theme.id) ? asset : undefined
  const testOutcomeImages = () => ({
    completionImage: themedAsset(
      getThemeAsset(deps.theme.id, 'quizCorrectImage')
    ),
    failureImage: themedAsset(
      getThemeAsset(deps.theme.id, 'quizIncorrectImage')
    ),
  })

  const hasActiveDinnerCooldown = (item: UnifiedChoreItem) =>
    deps.activeIds.eating === item.id &&
    typeof deps.biteCooldownEndsAt === 'number' &&
    deps.biteCooldownEndsAt > Date.now()

  const isCompleted = (item: UnifiedChoreItem) =>
    Boolean(getManageTaskCompletedAt(item))

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
    if (!isWaterToiletTask(item)) return item.starValue
    return calculateWaterToiletStars(
      getManageWaterLevel(item),
      getManageToiletStatus(item)
    )
  }

  const getWaterToiletRenderState = (item: UnifiedChoreItem) => {
    return getTaskWaterToiletRenderState(deps, item)
  }

  return {
    themedAsset,
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
  if (startedAt == null) return false
  const elapsed = (Date.now() - startedAt) / 1000
  return remaining - elapsed <= 0 && bitesLeft > 0
}

const isActiveItem = (deps: UnifiedChoreDeps, id: string) =>
  Object.values(deps.activeIds).includes(id)

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

export type UnifiedChoreState = ReturnType<typeof createUnifiedChoreState>
