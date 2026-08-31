import {
  MAX_ACTIVITY_MISTAKES,
  type ActivityResult,
} from '../components/ui/ActivityControls'

type ActivityOutcomeArgs = {
  isCompleted: boolean
  isFailed: boolean
  failureModeEnabled: boolean
  results: ActivityResult[]
}

export const getActivityOutcome = ({
  isCompleted,
  isFailed,
  failureModeEnabled,
  results,
}: ActivityOutcomeArgs) => {
  const mistakeLimitReached =
    results.filter((result) => result === 'incorrect').length >=
    MAX_ACTIVITY_MISTAKES
  const isFailedState =
    failureModeEnabled && isCompleted && (isFailed || mistakeLimitReached)
  const isSuccessState = isCompleted && !isFailedState

  return {
    isFailedState,
    isSuccessState,
    isFinished: isSuccessState || isFailedState,
  }
}

export const getVisibleActivityResults = (
  results: ActivityResult[],
  failureModeEnabled: boolean
) =>
  failureModeEnabled
    ? results
    : results.filter((result) => result === 'correct')

export const getActivityMistakeUpdate = (
  results: ActivityResult[],
  failureModeEnabled: boolean
) => {
  const nextResults: ActivityResult[] = failureModeEnabled
    ? [...results, 'incorrect']
    : results

  return {
    nextResults,
    shouldFail:
      failureModeEnabled &&
      nextResults.filter((result) => result === 'incorrect').length >=
        MAX_ACTIVITY_MISTAKES,
  }
}
