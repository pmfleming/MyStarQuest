import type { ReactNode } from 'react'
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
import type {
  ResolvedListAction,
  ResolvedListUtilityAction,
} from '../components/ui/standardActionListTypes'

type PresetChoreType = Exclude<ChoreModeType, 'standard'>

type SharedPrimaryActionBase<T> = {
  stage: ChoreStage
  icon: ReactNode
  disabled?: boolean
  onStart: ResolvedListAction<T>['onClick']
  onReset: ResolvedListAction<T>['onClick']
}

type DinnerPrimaryActionConfig<T> = SharedPrimaryActionBase<T> & {
  isTimerRunning: boolean
  onBite: (item: T) => void | Promise<void>
}

type TestPrimaryActionConfig<T> = SharedPrimaryActionBase<T> & {
  choreType: Exclude<PresetChoreType, 'eating'>
  onCheck: (item: T) => void | Promise<void>
}

type ActivityPrimaryActionConfig<T> = SharedPrimaryActionBase<T> & {
  choreType: 'watertoiletcheck'
  onFinish: (item: T) => void | Promise<void>
}

type PresetUtilityActionConfig<T> = {
  stage: ChoreStage
  resetAriaLabel: string
  deleteAriaLabel: string
  onReset: ResolvedListAction<T>['onClick']
  onDelete: (item: T) => void | Promise<void>
}

type StagedPrimaryActionConfig<T> = SharedPrimaryActionBase<T> & {
  label: string
  hideButton: boolean
  onActivity: (item: T) => void | Promise<void>
}

const createStagedPrimaryAction = <T,>({
  stage,
  onStart,
  onActivity,
  onReset,
  ...action
}: StagedPrimaryActionConfig<T>): ResolvedListAction<T> => ({
  ...action,
  variant: 'primary',
  onClick: isFinalChoreStage(stage)
    ? onReset
    : stage === 'activity'
      ? onActivity
      : onStart,
})

export const createPresetUtilityAction = <T,>({
  stage,
  resetAriaLabel,
  deleteAriaLabel,
  onReset,
  onDelete,
}: PresetUtilityActionConfig<T>): ResolvedListUtilityAction<T> =>
  shouldUseResetUtility(stage)
    ? {
        label: 'Reset',
        ariaLabel: resetAriaLabel,
        exits: false,
        variant: 'neutral',
        onClick: onReset,
      }
    : {
        label: 'Delete',
        ariaLabel: deleteAriaLabel,
        exits: true,
        variant: 'danger',
        onClick: onDelete,
      }

export const createPresetDinnerPrimaryAction = <T,>({
  isTimerRunning,
  onBite,
  ...config
}: DinnerPrimaryActionConfig<T>): ResolvedListAction<T> =>
  createStagedPrimaryAction({
    ...config,
    label: getDinnerPrimaryActionLabel(config.stage, isTimerRunning),
    hideButton: isFinalChoreStage(config.stage),
    onActivity: isTimerRunning ? onBite : config.onStart,
  })

export const createPresetTestPrimaryAction = <T,>({
  choreType,
  onCheck,
  ...config
}: TestPrimaryActionConfig<T>): ResolvedListAction<T> =>
  createStagedPrimaryAction({
    ...config,
    label: getTestPrimaryActionLabel(config.stage),
    hideButton: shouldHidePresetPrimaryButton(choreType, config.stage),
    onActivity: onCheck,
  })

export const createPresetActivityPrimaryAction = <T,>({
  onFinish,
  ...config
}: ActivityPrimaryActionConfig<T>): ResolvedListAction<T> => ({
  ...createPresetTestPrimaryAction({ ...config, onCheck: onFinish }),
  label: getActivityPrimaryActionLabel(config.stage),
})
