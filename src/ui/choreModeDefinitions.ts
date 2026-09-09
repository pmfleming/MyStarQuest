export type ChoreStage = 'setup' | 'activity' | 'completed'

export type ChoreModeType =
  | 'standard'
  | 'eating'
  | 'math'
  | 'large-numbers'
  | 'positional-notation'
  | 'alphabet'
  | 'spelling'
  | 'animals'
  | 'watertoiletcheck'

const hidePrimaryButtonInChore: Record<
  Exclude<ChoreModeType, 'standard'>,
  boolean
> = {
  eating: false,
  math: false,
  'large-numbers': false,
  'positional-notation': false,
  alphabet: true,
  spelling: true,
  animals: true,
  watertoiletcheck: false,
}

export const isInChoreStage = (stage: ChoreStage) => stage !== 'setup'

export const isFinalChoreStage = (stage: ChoreStage) => stage === 'completed'

export const shouldHidePresetChoreTitle = (stage: ChoreStage) =>
  isInChoreStage(stage)

export const shouldUseResetUtility = (stage: ChoreStage) =>
  isInChoreStage(stage)

export const shouldHidePresetPrimaryButton = (
  type: Exclude<ChoreModeType, 'standard'>,
  stage: ChoreStage
) =>
  isFinalChoreStage(stage) ||
  (stage === 'activity' && hidePrimaryButtonInChore[type])

export const getTestPrimaryActionLabel = (stage: ChoreStage) => {
  if (stage === 'activity') return 'Check result'
  return 'Run'
}

export const getDinnerPrimaryActionLabel = (
  stage: ChoreStage,
  isTimerRunning: boolean
) => {
  if (stage === 'activity' && isTimerRunning) return 'Bite'
  return 'Run'
}

export const getActivityPrimaryActionLabel = (stage: ChoreStage) => {
  if (stage === 'activity') return 'Finish'
  return 'Run'
}
