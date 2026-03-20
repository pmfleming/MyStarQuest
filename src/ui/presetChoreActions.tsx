import type { ReactNode } from 'react'
import { princessResetIcon } from '../assets/themes/princess/assets'
import type { Theme } from '../contexts/ThemeContext'
import type {
  ResolvedListAction,
  ResolvedListUtilityAction,
} from './listDescriptorTypes'
import {
  getDinnerPrimaryActionLabel,
  getTestPrimaryActionLabel,
  isFinalChoreStage,
  shouldHidePresetPrimaryButton,
  shouldUseResetUtility,
  type ChoreModeType,
  type ChoreStage,
} from './choreModeDefinitions'

type PresetChoreType = Exclude<ChoreModeType, 'standard'>

type SharedPrimaryActionBase = {
  stage: ChoreStage
  icon: ReactNode
  disabled?: boolean
}

type DinnerPrimaryActionConfig<T> = SharedPrimaryActionBase & {
  isTimerRunning: boolean
  onStart: (item: T) => void | Promise<void>
  onBite: (item: T) => void | Promise<void>
  onReset: (item: T) => void | Promise<void>
}

type TestPrimaryActionConfig<T> = SharedPrimaryActionBase & {
  choreType: Exclude<PresetChoreType, 'eating'>
  onStart: (item: T) => void | Promise<void>
  onCheck: (item: T) => void | Promise<void>
  onReset: (item: T) => void | Promise<void>
}

type PresetUtilityActionConfig<T> = {
  stage: ChoreStage
  resetAriaLabel: string
  deleteAriaLabel: string
  onReset: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
  theme: Theme
}

export const createDeleteUtilityAction = <T,>(
  ariaLabel: string,
  onClick: (item: T) => void | Promise<void>
): ResolvedListUtilityAction<T> => ({
  label: 'Delete',
  ariaLabel,
  exits: true,
  variant: 'danger',
  onClick,
})

export const createResetUtilityAction = <T,>(
  ariaLabel: string,
  onClick: (item: T) => void | Promise<void>,
  theme: Theme
): ResolvedListUtilityAction<T> => ({
  label: 'Reset',
  ariaLabel,
  icon:
    theme.id === 'princess' ? (
      <img
        src={princessResetIcon}
        alt="Reset"
        className="h-6 w-6 object-contain"
      />
    ) : undefined,
  exits: false,
  variant: 'neutral',
  onClick,
})

export const createPresetUtilityAction = <T,>({
  stage,
  resetAriaLabel,
  deleteAriaLabel,
  onReset,
  onDelete,
  theme,
}: PresetUtilityActionConfig<T>): ResolvedListUtilityAction<T> =>
  shouldUseResetUtility(stage)
    ? createResetUtilityAction(resetAriaLabel, onReset, theme)
    : createDeleteUtilityAction(deleteAriaLabel, onDelete)

export const createPresetDinnerPrimaryAction = <T,>({
  stage,
  isTimerRunning,
  icon,
  disabled,
  onStart,
  onBite,
  onReset,
}: DinnerPrimaryActionConfig<T>): ResolvedListAction<T> => ({
  label: getDinnerPrimaryActionLabel(stage, isTimerRunning),
  icon,
  disabled,
  hideButton: isFinalChoreStage(stage),
  variant: 'primary',
  showLabel: false,
  onClick: (item) => {
    if (isFinalChoreStage(stage)) {
      return onReset(item)
    }

    if (stage === 'activity' && isTimerRunning) {
      return onBite(item)
    }

    return onStart(item)
  },
})

export const createPresetTestPrimaryAction = <T,>({
  choreType,
  stage,
  icon,
  disabled,
  onStart,
  onCheck,
  onReset,
}: TestPrimaryActionConfig<T>): ResolvedListAction<T> => ({
  label: getTestPrimaryActionLabel(stage),
  icon,
  disabled,
  hideButton: shouldHidePresetPrimaryButton(choreType, stage),
  variant: 'primary',
  showLabel: false,
  onClick: (item) => {
    if (isFinalChoreStage(stage)) {
      return onReset(item)
    }

    if (stage === 'activity') {
      return onCheck(item)
    }

    return onStart(item)
  },
})
