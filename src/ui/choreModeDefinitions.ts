export type ChoreStage = 'setup' | 'activity' | 'completed'

export type ChoreModeType =
  | 'standard'
  | 'eating'
  | 'math'
  | 'positional-notation'
  | 'alphabet'
  | 'watertoiletcheck'

type PresetChoreModeDefinition = {
  hidePrimaryButtonInChore: boolean
}

const presetChoreModeDefinitions: Record<
  Exclude<ChoreModeType, 'standard'>,
  PresetChoreModeDefinition
> = {
  eating: {
    hidePrimaryButtonInChore: false,
  },
  math: {
    hidePrimaryButtonInChore: false,
  },
  'positional-notation': {
    hidePrimaryButtonInChore: false,
  },
  alphabet: {
    hidePrimaryButtonInChore: true,
  },
  watertoiletcheck: {
    hidePrimaryButtonInChore: false,
  },
}

export const isInChoreStage = (stage: ChoreStage) => stage !== 'setup'

export const isFinalChoreStage = (stage: ChoreStage) => stage === 'completed'

export const shouldHidePresetChoreTitle = (stage: ChoreStage) =>
  isInChoreStage(stage)

export const shouldHidePresetChoreStars = (stage: ChoreStage) =>
  isInChoreStage(stage)

export const shouldUseResetUtility = (stage: ChoreStage) =>
  isInChoreStage(stage)

export const shouldHidePresetPrimaryButton = (
  type: Exclude<ChoreModeType, 'standard'>,
  stage: ChoreStage
) =>
  isFinalChoreStage(stage) ||
  (stage === 'activity' &&
    presetChoreModeDefinitions[type].hidePrimaryButtonInChore)

export const getTestPrimaryActionLabel = (stage: ChoreStage) => {
  if (stage === 'activity') return 'Check Answer'
  return 'Start'
}

export const getDinnerPrimaryActionLabel = (
  stage: ChoreStage,
  isTimerRunning: boolean
) => {
  if (stage === 'activity' && isTimerRunning) return 'Bite'
  return 'Start'
}

export const getActivityPrimaryActionLabel = (stage: ChoreStage) => {
  if (stage === 'activity') return 'Finish'
  return 'Start'
}
