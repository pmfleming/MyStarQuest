import { useCallback, useEffect, useRef, useState } from 'react'
import { celebrateSuccess } from '../lib/celebrate'
import {
  MAX_ACTIVITY_MISTAKES,
  type ActivityResult,
} from '../components/ui/ActivityControls'

export type ActivityFeedback = 'idle' | 'correct' | 'wrong'

export type UseActivityChallengeArgs = {
  isRunning: boolean
  isCompleted: boolean
  isFailed: boolean
  totalProblems: number
  checkTrigger: number
  canStart: boolean
  onStart: () => void
  onReset: () => void
  onComplete: () => void
  onFail?: () => void
  failureModeEnabled?: boolean
}

const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const FAILURE_TRANSITION_DELAY_MS = 3000

export const useActivityChallenge = ({
  isRunning,
  isCompleted,
  isFailed,
  totalProblems,
  checkTrigger,
  canStart,
  onStart,
  onReset,
  onComplete,
  onFail,
  failureModeEnabled = true,
}: UseActivityChallengeArgs) => {
  const [problemIndex, setProblemIndex] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [resultHistory, setResultHistory] = useState<ActivityResult[]>([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<ActivityFeedback>('idle')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCheckTrigger = useRef(checkTrigger)

  const clearFeedbackTimer = useCallback(() => {
    if (!feedbackTimer.current) return
    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = null
  }, [])

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter(
    (result) => result === 'incorrect'
  ).length
  const hasFailedByHistory =
    failureModeEnabled && incorrectCount >= MAX_ACTIVITY_MISTAKES
  const isFailedState = isCompleted && (isFailed || hasFailedByHistory)
  const isSuccessState = isCompleted && !isFailedState
  const isFinished = isSuccessState || isFailedState
  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  const startNextProblem = useCallback(
    (nextIndex: number, onNextProblem: (index: number) => void) => {
      setProblemIndex(nextIndex)
      onNextProblem(nextIndex)
    },
    []
  )

  const submitAnswer = useCallback(
    (isAnswerCorrect: boolean, onNextProblem: (index: number) => void) => {
      if (feedback !== 'idle' || isFailurePending) return
      clearFeedbackTimer()

      if (isAnswerCorrect) {
        setFeedback('correct')
        celebrateSuccess()
        window.setTimeout(() => {
          setResultHistory((prev) => [...prev, 'correct'])
        }, 120)

        feedbackTimer.current = setTimeout(() => {
          const nextIndex = problemIndex + 1
          if (nextIndex >= totalProblems) {
            onComplete()
          } else {
            startNextProblem(nextIndex, onNextProblem)
          }
        }, CELEBRATION_DELAY_MS)
        return
      }

      setFeedback('wrong')
      if (failureModeEnabled) {
        setResultHistory((prev) => [...prev, 'incorrect'])
      }
      const nextRetryCount = retryCount + 1
      setRetryCount(nextRetryCount)

      if (failureModeEnabled && nextRetryCount >= MAX_ACTIVITY_MISTAKES) {
        setIsFailurePending(true)
        feedbackTimer.current = setTimeout(() => {
          onFail?.()
        }, FAILURE_TRANSITION_DELAY_MS)
        return
      }

      feedbackTimer.current = setTimeout(
        () => setFeedback('idle'),
        SHAKE_DURATION_MS
      )
    },
    [
      clearFeedbackTimer,
      feedback,
      failureModeEnabled,
      isFailurePending,
      onComplete,
      onFail,
      problemIndex,
      retryCount,
      startNextProblem,
      totalProblems,
    ]
  )

  const resetChallenge = useCallback(() => {
    clearFeedbackTimer()
    setProblemIndex(0)
    setRetryCount(0)
    setResultHistory([])
    setIsFailurePending(false)
    setFeedback('idle')
    onReset()
  }, [clearFeedbackTimer, onReset])

  const resetFeedback = useCallback(() => setFeedback('idle'), [])

  useEffect(() => clearFeedbackTimer, [clearFeedbackTimer])

  useEffect(() => {
    if (isRunning && canStart && problemIndex === 0 && feedback === 'idle') {
      onStart()
    }
  }, [canStart, feedback, isRunning, onStart, problemIndex])

  useEffect(() => {
    if (isSetup) resetChallenge()
  }, [isSetup, resetChallenge])

  const consumeCheckTrigger = useCallback(
    (isAnswerCorrect: boolean, onNextProblem: (index: number) => void) => {
      if (checkTrigger === prevCheckTrigger.current) return
      prevCheckTrigger.current = checkTrigger
      if (isRunning && !isCompleted) {
        submitAnswer(isAnswerCorrect, onNextProblem)
      }
    },
    [checkTrigger, isCompleted, isRunning, submitAnswer]
  )

  return {
    problemIndex,
    retryCount,
    resultHistory: failureModeEnabled
      ? resultHistory
      : resultHistory.filter((result) => result === 'correct'),
    feedback,
    isSetup,
    isFinished,
    isSuccessState,
    isCorrect,
    isWrong,
    submitAnswer,
    consumeCheckTrigger,
    resetFeedback,
  }
}

type UseCheckedActivityChallengeArgs = UseActivityChallengeArgs & {
  isAnswerCorrect: boolean
  onNextProblem: (nextIndex: number) => void
}

export const useCheckedActivityChallenge = ({
  isAnswerCorrect,
  onNextProblem,
  ...challengeArgs
}: UseCheckedActivityChallengeArgs) => {
  const challenge = useActivityChallenge(challengeArgs)
  const { consumeCheckTrigger, resetFeedback } = challenge
  const advance = useCallback(
    (nextIndex: number) => {
      resetFeedback()
      onNextProblem(nextIndex)
    },
    [onNextProblem, resetFeedback]
  )

  useEffect(() => {
    consumeCheckTrigger(isAnswerCorrect, advance)
  }, [advance, consumeCheckTrigger, isAnswerCorrect])

  return challenge
}
