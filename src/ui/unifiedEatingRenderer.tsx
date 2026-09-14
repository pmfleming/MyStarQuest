import { getThemeAsset } from './themeAssets'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  getManageDinnerBitesLeft,
  getManageDinnerRemaining,
  isEatingTask,
  type EatingTaskWithEphemeral,
} from '../data/types'
import type { ChoreStage } from './choreModeDefinitions'
import { renderDinnerChore } from './presetChoreRenderers'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'
import type { UnifiedChoreState } from './unifiedChoreState'
import { clamp } from './unifiedChoreRenderUtils'
import { clampDinnerSliceCount } from '../data/taskLimits'

export const renderEatingContent = (
  deps: UnifiedChoreDeps,
  state: UnifiedChoreState,
  item: UnifiedChoreItem,
  stage: ChoreStage
) => {
  const isActive = deps.activeIds.eating === item.id
  return isEatingTask(item)
    ? renderEatingTask(deps, state, item, isActive, stage)
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
    plateImage: state.themedAsset(getThemeAsset(deps.theme.id, 'plateImage')),
    onAdjustTime: async (delta) => {
      const next = clamp(
        (item.dinnerDurationSeconds ?? DEFAULT_DINNER_DURATION_SECONDS) + delta,
        5 * 60,
        30 * 60
      )
      await Promise.all([
        deps.onUpdateTaskField?.(item.id, { dinnerDurationSeconds: next }),
        deps.onUpdateEphemeral?.(item.id, {
          manageDinnerRemainingSeconds: next,
        }),
      ])
    },
    onAdjustBites: async (delta) => {
      const next = clampDinnerSliceCount(
        (item.dinnerTotalBites ?? DEFAULT_DINNER_BITES) + delta
      )
      await Promise.all([
        deps.onUpdateTaskField?.(item.id, { dinnerTotalBites: next }),
        deps.onUpdateEphemeral?.(item.id, { manageDinnerBitesLeft: next }),
      ])
    },
    onStarsChange: (value) =>
      deps.onUpdateTaskField?.(item.id, { starValue: value }),
    onExpire: () => deps.onExpireDinner?.(item),
    isCompleted,
    ...state.testOutcomeImages(),
    completionImage: state.themedAsset(
      getThemeAsset(deps.theme.id, 'eatingFullImage')
    ),
    biteCooldownSeconds: deps.biteCooldownSeconds,
    biteCooldownEndsAt: deps.biteCooldownEndsAt,
    biteIcon: state.themedAsset(deps.activeMealIcon),
    showSetupControls: isManage && !isActive && !isCompleted,
    showStarReward: isManage && !isActive && !isCompleted,
  })
}
