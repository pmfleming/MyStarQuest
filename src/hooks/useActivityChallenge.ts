import { useActivityPersistence } from './useActivityPersistence'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MAX_ACTIVITY_MISTAKES,
  getVisibleActivityResults,
  type ActivityResult,
} from '../lib/activityOutcome'

import { celebrateSuccess } from '../lib/celebrate'

export type ActivityFeedback = 'idle' | 'correct' | 'wrong'

export type UseActivityChallengeArgs = {
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  totalProblems: number
  checkTrigger?: number
  canStart: boolean
  onStart: () => void
  onReset: () => void
  onComplete: () => void | Promise<void>
  onFail?: () => void | Promise<void>
  failureModeEnabled?: boolean
}

const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const FAILURE_TRANSITION_DELAY_MS = 3000

export const useActivityChallenge = ({
  isRunning,
  isCompleted = false,
  isFailed = false,
  totalProblems,
  checkTrigger = 0,
  canStart,
  onStart,
  onReset,
  onComplete,
  onFail,
  failureModeEnabled = true,
}: UseActivityChallengeArgs) => {
  const {
    complete,
    fail,
    feedback: persistence,
  } = useActivityPersistence({ onComplete, onFail })
  const [problemIndex, setProblemIndex] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [resultHistory, setResultHistory] = useState<ActivityResult[]>([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<ActivityFeedback>('idle')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const historyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const prevCheckTrigger = useRef(checkTrigger)

  const clearFeedbackTimer = useCallback(() => {
    clearTimeout(historyTimer.current)
    clearTimeout(feedbackTimer.current)
    historyTimer.current = undefined
    feedbackTimer.current = undefined
  }, [])

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter(
    (result) => result === 'incorrect'
  ).length
  const hasFailedByHistory =
    failureModeEnabled && incorrectCount >= MAX_ACTIVITY_MISTAKES
  const isFailedState = isCompleted && (isFailed || hasFailedByHistory)
  const isSuccessState = isCompleted && !isFailedState
  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  const submitAnswer = useCallback(
    (isAnswerCorrect: boolean, onNextProblem: (index: number) => void) => {
      if (feedback !== 'idle' || isFailurePending) return
      clearFeedbackTimer()

      if (isAnswerCorrect) {
        setFeedback('correct')
        celebrateSuccess()
        historyTimer.current = setTimeout(() => {
          historyTimer.current = undefined
          setResultHistory((prev) => [...prev, 'correct'])
        }, 120)

        feedbackTimer.current = setTimeout(() => {
          const nextIndex = problemIndex + 1
          if (nextIndex >= totalProblems) {
            complete()
          } else {
            setProblemIndex(nextIndex)
            onNextProblem(nextIndex)
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
          fail()
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
      complete,
      fail,
      problemIndex,
      retryCount,
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
    if (isSetup) {
      const frame = requestAnimationFrame(resetChallenge)
      return () => cancelAnimationFrame(frame)
    }
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
    persistence,
    problemIndex,
    retryCount,
    resultHistory: getVisibleActivityResults(resultHistory, failureModeEnabled),
    feedback,
    isSetup,
    isFinished: isCompleted,
    isSuccessState,
    isCorrect,
    isWrong,
    isFailurePending,
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
