export type ChoreStage = 'setup' | 'activity' | 'completed'

export type ChoreModeType =
  | 'standard'
  | 'eating'
  | 'math'
  | 'positional-notation'
  | 'alphabet'

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
}

export const isInChoreStage = (stage: ChoreStage) => stage !== 'setup'

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
  isInChoreStage(stage) &&
  presetChoreModeDefinitions[type].hidePrimaryButtonInChore

export const getTestPrimaryActionLabel = (stage: ChoreStage) => {
  if (stage === 'completed') return 'Again 🔁'
  if (stage === 'activity') return 'Check Answer'
  return 'Start'
}

export const getDinnerPrimaryActionLabel = (
  stage: ChoreStage,
  isTimerRunning: boolean
) => {
  if (stage === 'completed') return 'Again 🔁'
  if (stage === 'activity' && isTimerRunning) return 'Bite'
  return 'Start'
}
