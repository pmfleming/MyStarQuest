import { getThemeAsset } from './themeAssets'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  isEatingTask,
} from '../data/types'
import { renderDinnerChore } from './presetChoreRenderers'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import type { UnifiedChoreState } from './unifiedChoreState'
import { getTaskSuccessImage } from './taskSuccessImage'

export const renderEatingContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem
) => {
  if (!isEatingTask(item)) return null
  const isActive = deps.activeIds.eating === item.id
  const isCompleted = Boolean(item.manageDinnerCompletedAt)
  if (!isActive && !isCompleted) return null

  return renderDinnerChore({
    theme: deps.theme,
    duration: item.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS,
    remaining: getManageDinnerRemaining(item),
    totalBites: item.dinnerTotalBites ?? DEFAULT_DINNER_BITES,
    bitesLeft: getManageDinnerBitesLeft(item),
    starReward: item.starValue,
    isTimerRunning: isActive,
    timerStartedAt: item.manageDinnerTimerStartedAt,
    plateImage: state.themedAsset(getThemeAsset(deps.theme.id, 'plateImage')),
    onExpire: () => deps.onExpireDinner?.(item),
    isCompleted,
    ...state.testOutcomeImages(),
    completionImage: getTaskSuccessImage(item, deps.theme),
    biteCooldownSeconds: deps.biteCooldownSeconds,
    biteCooldownEndsAt: deps.biteCooldownEndsAt,
    biteIcon: state.themedAsset(deps.activeMealIcon),
    showSetupControls: false,
    showStarReward: false,
  })
}
