import {
  princessActiveIcon,
  princessBiteIcon,
  princessGiveStarIcon,
  princessMathsIcon,
  princessPlateImage,
} from '../assets/themes/princess/assets'
import { isInChoreStage, shouldUseResetUtility } from './choreModeDefinitions'
import type { ListRowDescriptor } from './listDescriptorTypes'
import {
  createPresetActivityPrimaryAction,
  createPresetDinnerPrimaryAction,
  createPresetTestPrimaryAction,
  createPresetUtilityAction,
} from './presetChoreActions'
import { createUnifiedChoreState, getChoreType } from './unifiedChoreState'
import { renderUnifiedChoreItem } from './unifiedChoreItemRenderer'
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
    renderItem: (item) => renderUnifiedChoreItem(deps, state, item),
    getStarCount: (item) => {
      if (isManage) return undefined
      const stage = state.getStage(item)
      if (isInChoreStage(stage)) return undefined
      return getChoreType(item) === 'watertoiletcheck'
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
          label: isItemCompleted ? 'Done' : isManage ? 'Give' : 'Open chore',
          icon: (
            <img
              src={isItemCompleted ? princessActiveIcon : princessGiveStarIcon}
              alt="icon"
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
        return createPresetActivityPrimaryAction<UnifiedChoreItem>({
          choreType: type,
          stage,
          icon: (
            <img
              src={
                stage === 'setup' ? princessGiveStarIcon : princessActiveIcon
              }
              alt="icon"
              className="h-6 w-6 object-contain"
            />
          ),
          onReset: (selected) => deps.onReset?.(selected),
          onFinish: (selected) => deps.onComplete?.(selected),
          onStart: (selected) => enterOrComplete(deps, selected),
        })
      }

      return createPresetTestPrimaryAction({
        choreType: type,
        stage,
        icon: (
          <img
            src={stage === 'setup' ? princessGiveStarIcon : princessMathsIcon}
            alt="icon"
            className="h-6 w-6 object-contain"
          />
        ),
        onReset: (selected) => deps.onReset?.(selected),
        onCheck: (selected) => incrementCheckTrigger(deps, type, selected.id),
        onStart: (selected) => enterOrComplete(deps, selected),
      })
    },
    getUtilityAction: (item) => {
      const stage = state.getStage(item)
      if (deps.hideDeleteUtility && !shouldUseResetUtility(stage)) {
        return undefined
      }

      return createPresetUtilityAction<UnifiedChoreItem>({
        stage,
        resetAriaLabel: 'Reset',
        deleteAriaLabel: 'Delete',
        onReset: (selected) => deps.onReset?.(selected),
        onDelete: (selected) =>
          isManage
            ? deps.onDeleteTask?.(selected.id)
            : deps.onDeleteTodo?.(selected.id),
        theme: deps.theme,
      })
    },
  }
}

const createEatingPrimaryAction = (
  deps: UnifiedChoreDeps,
  item: UnifiedChoreItem,
  stage: ReturnType<ReturnType<typeof createUnifiedChoreState>['getStage']>
) => {
  const isActive = deps.activeDinnerId === item.id
  const isFinished = stage === 'completed'
  const isCoolingDown =
    typeof deps.biteCooldownEndsAt === 'number' &&
    deps.biteCooldownEndsAt > Date.now()

  return createPresetDinnerPrimaryAction<UnifiedChoreItem>({
    stage,
    isTimerRunning: isActive,
    icon: (
      <img
        src={eatingActionIcon(deps, isActive, isFinished)}
        alt={isFinished ? 'Reset' : 'icon'}
        className="h-6 w-6 object-contain"
      />
    ),
    disabled: isActive && isCoolingDown,
    onReset: (selected) => deps.onReset?.(selected),
    onBite: (selected) => deps.onApplyBite?.(selected),
    onStart: (selected) => deps.onStartDinner?.(selected),
  })
}

const eatingActionIcon = (
  deps: UnifiedChoreDeps,
  isActive: boolean,
  isFinished: boolean
) => {
  if (isFinished) return princessPlateImage
  if (deps.theme.id === 'princess' && isActive) {
    return deps.activePrincessMealIcon ?? princessBiteIcon
  }
  return princessBiteIcon
}

const enterOrComplete = (deps: UnifiedChoreDeps, item: UnifiedChoreItem) => {
  if (deps.onEnterChore) return deps.onEnterChore(item)
  return deps.onComplete?.(item)
}

const incrementCheckTrigger = (
  deps: UnifiedChoreDeps,
  type: ReturnType<typeof getChoreType>,
  id: string
) => {
  const setters = {
    math: deps.setMathCheckTriggers,
    'positional-notation': deps.setPVCheckTriggers,
    alphabet: deps.setAlphabetCheckTriggers,
  }
  const setter =
    type === 'math' || type === 'positional-notation' || type === 'alphabet'
      ? setters[type]
      : undefined

  setter?.((prev) => ({
    ...prev,
    [id]: (prev[id] ?? 0) + 1,
  }))
}
