import {
  princessEatingFailImage,
  princessEatingFullImage,
  princessPlateImage,
} from '../assets/themes/princess/assets'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  isEatingTask,
  isEatingTodo,
  type EatingTaskWithEphemeral,
  type EatingTodo,
} from '../data/types'
import type { ChoreStage } from './choreModeDefinitions'
import { renderDinnerChore } from './presetChoreRenderers'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import { isTaskItem, type UnifiedChoreState } from './unifiedChoreState'
import { clamp, noop } from './unifiedChoreRenderUtils'

export const renderEatingContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  const isActive = deps.activeDinnerId === item.id
  if (isTaskItem(item)) {
    return isEatingTask(item)
      ? renderEatingTask(deps, state, item, isActive, stage)
      : null
  }

  return isEatingTodo(item)
    ? renderEatingTodo(deps, state, item, isActive)
    : null
}

const renderEatingTask = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: EatingTaskWithEphemeral,
  isActive: boolean,
  stage: ChoreStage
) => {
  const isCompleted = Boolean(item.manageDinnerCompletedAt)
  const isManage = deps.mode === 'manage'
  if (!isActive && !isCompleted && (!isManage || stage !== 'setup')) {
    return null
  }

  return renderDinnerChore({
    theme: deps.theme,
    duration: item.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
    remaining: getManageDinnerRemaining(item),
    totalBites: item.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
    bitesLeft: getManageDinnerBitesLeft(item),
    starReward: item.starValue,
    isTimerRunning: isActive,
    timerStartedAt: item.manageDinnerTimerStartedAt,
    plateImage: state.princessAsset(princessPlateImage),
    onAdjustTime: (delta) => {
      const next = clamp(
        (item.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS) + delta,
        5 * 60,
        30 * 60
      )
      deps.onUpdateTaskField?.(item.id, { dinnerDurationSeconds: next })
      deps.onUpdateEphemeral?.(item.id, {
        manageDinnerRemainingSeconds: next,
      })
    },
    onAdjustBites: (delta) => {
      const next = clamp(
        (item.dinnerTotalBites ?? DEFAULT_DINNER_BITES) + delta,
        1,
        16
      )
      deps.onUpdateTaskField?.(item.id, { dinnerTotalBites: next })
      deps.onUpdateEphemeral?.(item.id, { manageDinnerBitesLeft: next })
    },
    onStarsChange: (value) =>
      deps.onUpdateTaskField?.(item.id, { starValue: value }),
    onExpire: () => deps.onExpireDinner?.(item),
    isCompleted,
    ...state.testOutcomeImages(),
    biteCooldownSeconds: deps.biteCooldownSeconds,
    biteCooldownEndsAt: deps.biteCooldownEndsAt,
    biteIcon: state.princessAsset(deps.activePrincessMealIcon),
    showSetupControls: isManage && !isActive && !isCompleted,
    showStarReward: isManage && !isActive && !isCompleted,
  })
}

const renderEatingTodo = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: EatingTodo,
  isActive: boolean
) => {
  const isCompleted = Boolean(item.completedAt)
  if (!isActive && !isCompleted) return null

  return renderDinnerChore({
    theme: deps.theme,
    duration: item.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
    remaining: item.dinnerRemainingSeconds,
    totalBites: item.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
    bitesLeft: item.dinnerBitesLeft,
    starReward: item.starValue,
    isTimerRunning: isActive,
    timerStartedAt: item.dinnerTimerStartedAt,
    plateImage: state.princessAsset(princessPlateImage),
    isCompleted,
    completionImage: state.princessAsset(princessEatingFullImage),
    failureImage: state.princessAsset(princessEatingFailImage),
    biteCooldownSeconds: deps.biteCooldownSeconds,
    biteCooldownEndsAt: deps.biteCooldownEndsAt,
    biteIcon: state.princessAsset(deps.activePrincessMealIcon),
    onAdjustTime: noop,
    onAdjustBites: noop,
    onStarsChange: noop,
    onExpire: () => deps.onExpireDinner?.(item),
    showSetupControls: false,
    showStarReward: false,
  })
}
