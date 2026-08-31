import type { ReactNode } from 'react'
import type {
  ResolvedListAction,
  ResolvedListUtilityAction,
} from './listDescriptorTypes'
import {
  getActivityPrimaryActionLabel,
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

type ActivityPrimaryActionConfig<T> = SharedPrimaryActionBase & {
  choreType: Exclude<
    PresetChoreType,
    | 'eating'
    | 'math'
    | 'large-numbers'
    | 'positional-notation'
    | 'alphabet'
    | 'spelling'
    | 'animals'
  >
  onStart: (item: T) => void | Promise<void>
  onFinish: (item: T) => void | Promise<void>
  onReset: (item: T) => void | Promise<void>
}

type PresetUtilityActionConfig<T> = {
  stage: ChoreStage
  resetAriaLabel: string
  deleteAriaLabel: string
  onReset: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
}

type StagedPrimaryActionConfig<T> = SharedPrimaryActionBase & {
  label: string
  hideButton: boolean
  onSetup: (item: T) => void | Promise<void>
  onActivity: (item: T) => void | Promise<void>
  onFinal: (item: T) => void | Promise<void>
}

const createStagedPrimaryAction = <T,>({
  stage,
  label,
  icon,
  disabled,
  hideButton,
  onSetup,
  onActivity,
  onFinal,
}: StagedPrimaryActionConfig<T>): ResolvedListAction<T> => ({
  label,
  icon,
  disabled,
  hideButton,
  variant: 'primary',
  showLabel: false,
  onClick: (item) => {
    if (isFinalChoreStage(stage)) return onFinal(item)
    return stage === 'activity' ? onActivity(item) : onSetup(item)
  },
})

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
  onClick: (item: T) => void | Promise<void>
): ResolvedListUtilityAction<T> => ({
  label: 'Reset',
  ariaLabel,
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
}: PresetUtilityActionConfig<T>): ResolvedListUtilityAction<T> =>
  shouldUseResetUtility(stage)
    ? createResetUtilityAction(resetAriaLabel, onReset)
    : createDeleteUtilityAction(deleteAriaLabel, onDelete)

export const createPresetDinnerPrimaryAction = <T,>({
  stage,
  isTimerRunning,
  icon,
  disabled,
  onStart,
  onBite,
  onReset,
}: DinnerPrimaryActionConfig<T>): ResolvedListAction<T> =>
  createStagedPrimaryAction({
    stage,
    label: getDinnerPrimaryActionLabel(stage, isTimerRunning),
    icon,
    disabled,
    hideButton: isFinalChoreStage(stage),
    onSetup: onStart,
    onActivity: isTimerRunning ? onBite : onStart,
    onFinal: onReset,
  })

export const createPresetTestPrimaryAction = <T,>({
  choreType,
  stage,
  icon,
  disabled,
  onStart,
  onCheck,
  onReset,
}: TestPrimaryActionConfig<T>): ResolvedListAction<T> =>
  createStagedPrimaryAction({
    stage,
    label: getTestPrimaryActionLabel(stage),
    icon,
    disabled,
    hideButton: shouldHidePresetPrimaryButton(choreType, stage),
    onSetup: onStart,
    onActivity: onCheck,
    onFinal: onReset,
  })

export const createPresetActivityPrimaryAction = <T,>({
  choreType,
  stage,
  icon,
  disabled,
  onStart,
  onFinish,
  onReset,
}: ActivityPrimaryActionConfig<T>): ResolvedListAction<T> =>
  createStagedPrimaryAction({
    stage,
    label: getActivityPrimaryActionLabel(stage),
    icon,
    disabled,
    hideButton: shouldHidePresetPrimaryButton(choreType, stage),
    onSetup: onStart,
    onActivity: onFinish,
    onFinal: onReset,
  })
