import { getThemeAsset } from './themeAssets'
import { getChoreImage } from '../assets/chores/assets'
import { getPresetChoreOverviewImage } from './choreOverviewAssets'
import { getTaskTypeIcon } from './taskTypeIcons'
import { isInChoreStage, shouldUseResetUtility } from './choreModeDefinitions'
import type { ListRowDescriptor } from './listDescriptorTypes'
import {
  createPresetActivityPrimaryAction,
  createPresetDinnerPrimaryAction,
  createPresetTestPrimaryAction,
  createPresetUtilityAction,
} from './presetChoreActions'
import {
  createUnifiedChoreState,
  getChoreType,
  isTaskItem,
} from './unifiedChoreState'
import {
  renderUnifiedChoreHeader,
  renderUnifiedChoreItem,
} from './unifiedChoreItemRenderer'
import type {
  UnifiedChoreDeps,
  UnifiedChoreItem,
} from './unifiedChoreDescriptorTypes'

export type { UnifiedChoreDeps } from './unifiedChoreDescriptorTypes'

export function createUnifiedChoreDescriptor(
  deps: UnifiedChoreDeps
): ListRowDescriptor<UnifiedChoreItem> {
  const isManage = deps.mode === 'manage'
  const state = createUnifiedChoreState(deps)

  return {
    renderHeader: (item) => renderUnifiedChoreHeader(deps, state, item),
    renderItem: (item) => renderUnifiedChoreItem(deps, state, item),
    getStarCount: (item) => {
      if (isManage) return undefined
      const stage = state.getStage(item)
      if (isInChoreStage(stage)) return undefined
      const type = getChoreType(item)
      if (
        (type === 'standard' && getChoreImage(item.imageKey, deps.theme.id)) ||
        getPresetChoreOverviewImage(type, deps.theme.id)
      ) {
        return undefined
      }
      return type === 'watertoiletcheck'
        ? state.getWaterToiletDelta(item)
        : item.starValue
    },
    isHighlighted: (item) => state.getStage(item) === 'completed',
    getPrimaryAction: (item) => {
      const stage = state.getStage(item)
      const type = getChoreType(item)

      if (type === 'standard') {
        const isItemCompleted = state.isCompleted(item)
        return {
          label: 'Give stars',
          ariaLabel: `Give stars for ${item.title}`,
          icon: (
            <img
              src={
                isItemCompleted
                  ? getThemeAsset(deps.theme.id, 'activeIcon')
                  : (getChoreImage(item.imageKey, deps.theme.id) ??
                    getThemeAsset(deps.theme.id, 'giveStarIcon'))
              }
              data-artwork-fit={
                deps.theme.id === 'teenie' && isItemCompleted
                  ? 'contain'
                  : undefined
              }
              alt=""
              aria-hidden="true"
              decoding="async"
              className="h-6 w-6 object-contain"
            />
          ),
          disabled: isItemCompleted,
          hideButton: isItemCompleted,
          variant: 'primary',
          showLabel: false,
          onClick: (selected) => deps.onComplete?.(selected),
        }
      }

      if (type === 'eating') {
        return createEatingPrimaryAction(deps, item, stage)
      }

      if (type === 'watertoiletcheck') {
        const action = createPresetActivityPrimaryAction<UnifiedChoreItem>({
          choreType: type,
          stage,
          icon: (
            <img
              src={
                stage === 'setup'
                  ? getThemeAsset(deps.theme.id, 'giveStarIcon')
                  : getThemeAsset(deps.theme.id, 'activeIcon')
              }
              data-artwork-fit={
                deps.theme.id === 'teenie' && stage !== 'setup'
                  ? 'contain'
                  : undefined
              }
              alt=""
              aria-hidden="true"
              decoding="async"
              className="h-6 w-6 object-contain"
            />
          ),
          onReset: (selected) => deps.onReset?.(selected),
          onFinish: (selected) => deps.onComplete?.(selected),
          onStart: (selected) => enterOrComplete(deps, selected),
        })
        return { ...action, ariaLabel: `${action.label} ${item.title}` }
      }

      const action = createPresetTestPrimaryAction<UnifiedChoreItem>({
        choreType: type,
        stage,
        icon: (
          <img
            src={getTaskTypeIcon(type, deps.theme.id)}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="h-6 w-6 object-contain"
          />
        ),
        onReset: (selected) => deps.onReset?.(selected),
        onCheck: (selected) => deps.onCheck?.(type, selected.id),
        onStart: (selected) => enterOrComplete(deps, selected),
      })
      return { ...action, ariaLabel: `${action.label} ${item.title}` }
    },
    getUtilityAction: (item) => {
      const stage = state.getStage(item)
      if (deps.hideDeleteUtility && !shouldUseResetUtility(stage)) {
        return undefined
      }

      return createPresetUtilityAction<UnifiedChoreItem>({
        stage,
        resetAriaLabel: `Reset ${item.title}`,
        deleteAriaLabel: `Delete ${item.title}`,
        onReset: (selected) => deps.onReset?.(selected),
        onDelete: (selected) =>
          isManage || isTaskItem(selected)
            ? deps.onDeleteTask?.(selected.id)
            : deps.onDeleteTodo?.(selected.id),
      })
    },
  }
}

const createEatingPrimaryAction = (
  deps: UnifiedChoreDeps,
  item: UnifiedChoreItem,
  stage: ReturnType<ReturnType<typeof createUnifiedChoreState>['getStage']>
) => {
  const isActive = deps.activeIds.eating === item.id
  const isFinished = stage === 'completed'
  const isCoolingDown =
    typeof deps.biteCooldownEndsAt === 'number' &&
    deps.biteCooldownEndsAt > Date.now()

  const action = createPresetDinnerPrimaryAction<UnifiedChoreItem>({
    stage,
    isTimerRunning: isActive,
    icon: (
      <img
        src={eatingActionIcon(deps, isActive, isFinished)}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="h-6 w-6 object-contain"
      />
    ),
    disabled: isActive && isCoolingDown,
    onReset: (selected) => deps.onReset?.(selected),
    onBite: (selected) => deps.onApplyBite?.(selected),
    onStart: (selected) => deps.onStartDinner?.(selected),
  })
  return { ...action, ariaLabel: `${action.label} ${item.title}` }
}

const eatingActionIcon = (
  deps: UnifiedChoreDeps,
  isActive: boolean,
  isFinished: boolean
) => {
  if (isFinished) return getThemeAsset(deps.theme.id, 'plateImage')
  if (
    (deps.theme.id === 'princess' || deps.theme.id === 'teenie') &&
    isActive
  ) {
    return deps.activeMealIcon ?? getThemeAsset(deps.theme.id, 'biteIcon')
  }
  return getThemeAsset(deps.theme.id, 'biteIcon')
}

const enterOrComplete = (deps: UnifiedChoreDeps, item: UnifiedChoreItem) => {
  if (deps.onEnterChore) return deps.onEnterChore(item)
  return deps.onComplete?.(item)
}
