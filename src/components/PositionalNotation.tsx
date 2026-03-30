import { useState, useEffect, useCallback, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './ui/StepperButton'
import StarDisplay from './ui/StarDisplay'
import ChoreOutcomeView from './ChoreOutcomeView'
import { uiTokens } from '../tokens'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import { celebrateSuccess } from '../lib/celebrate'
import { useProblemHistory } from '../lib/useProblemHistory'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const MAX_POSITIONAL_NOTATION_TARGET = 129
const MAX_POSITIONAL_NOTATION_TENS = Math.floor(
  MAX_POSITIONAL_NOTATION_TARGET / 10
)
const MAX_POSITIONAL_NOTATION_ONES = 9
const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const MAX_MISTAKES = 3
const FAILURE_TRANSITION_DELAY_MS = 3000
const PLACE_VALUE_PANEL_GAP = 2
const PLACE_VALUE_PLUS_SIZE = 42
const PLACE_VALUE_TENS_STEPPER_WIDTH = 40
const PLACE_VALUE_ONES_STEPPER_WIDTH = 30
const PLACE_VALUE_STEPPER_HEIGHT = 44
const PLACE_VALUE_TENS_COLUMNS = 6
const PLACE_VALUE_TENS_PANEL_SPLIT = '1.7fr 1.3fr'
const PLACE_VALUE_PLUS_LEFT = '56.66%'

const {
  statusBarHeight: STATUS_BAR_HEIGHT,
  statusIconSize: STATUS_ICON_SIZE,
  statusIconGap: STATUS_ICON_GAP,
  mathCounterSize: ONE_COUNTER_SIZE,
  mathCounterGap: DOT_GAP,
} = uiTokens.activityTokens

const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const STATUS_BAR_HORIZONTAL_PADDING = 12
const SETUP_FIELD_GAP = uiTokens.singleVerticalSpace

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function generateProgressivePositionalNotationProblem(
  index: number,
  totalProblems: number
): { target: number } {
  if (totalProblems <= 1) {
    return { target: Math.floor(Math.random() * 20) + 1 }
  }

  const progress = clamp(index / Math.max(1, totalProblems - 1), 0, 1)
  const easedProgress = Math.pow(progress, 1.15)
  const bandStart = clamp(
    Math.round(1 + easedProgress * 110),
    1,
    MAX_POSITIONAL_NOTATION_TARGET
  )
  const bandEnd = clamp(
    Math.round(20 + easedProgress * 109),
    Math.min(MAX_POSITIONAL_NOTATION_TARGET, bandStart + 9),
    MAX_POSITIONAL_NOTATION_TARGET
  )
  const target =
    Math.floor(Math.random() * (bandEnd - bandStart + 1)) + bandStart

  return { target }
}

function getStatusIconOverlap(iconCount: number): number {
  if (iconCount <= 1) return 0
  const availableWidth = CONTROL_ROW_WIDTH - STATUS_BAR_HORIZONTAL_PADDING
  const naturalWidth =
    iconCount * STATUS_ICON_SIZE + (iconCount - 1) * STATUS_ICON_GAP

  if (naturalWidth <= availableWidth) return 0

  const requiredOverlap =
    (naturalWidth - availableWidth) / Math.max(1, iconCount - 1)

  return Math.min(STATUS_ICON_SIZE * 0.72, Math.max(0, requiredOverlap))
}

export interface PositionalNotationProps {
  theme: Theme
  totalProblems: number
  starReward: number
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
}

const PositionalNotation = ({
  theme,
  totalProblems,
  starReward,
  isRunning,
  isCompleted = false,
  isFailed = false,
  onAdjustProblems,
  onStarsChange,
  onComplete,
  onFail,
  checkTrigger = 0,
  completionImage,
  failureImage,
}: PositionalNotationProps) => {
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [targetNumber, setTargetNumber] = useState(0)
  const [userTens, setUserTens] = useState(0)
  const [userOnes, setUserOnes] = useState(0)
  const { isSeen, markSeen, clearHistory } = useProblemHistory()
  const [resultHistory, setResultHistory] = useState<
    Array<'correct' | 'incorrect'>
  >([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCheckTrigger = useRef(checkTrigger)

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter(
    (result) => result === 'incorrect'
  ).length
  const hasFailedByHistory = incorrectCount >= MAX_MISTAKES
  const isFailedState = isCompleted && (isFailed || hasFailedByHistory)
  const isSuccessState = isCompleted && !isFailedState
  const isFinished = isSuccessState || isFailedState
  const currentTotal = userTens * 10 + userOnes
  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  const nextProblem = useCallback(
    (nextIndex: number) => {
      let problem = generateProgressivePositionalNotationProblem(
        nextIndex,
        totalProblems
      )
      let attempts = 0
      while (isSeen(problem.target.toString()) && attempts < 10) {
        problem = generateProgressivePositionalNotationProblem(
          nextIndex,
          totalProblems
        )
        attempts++
      }
      markSeen(problem.target.toString())

      setTargetNumber(problem.target)
      setUserTens(0)
      setUserOnes(0)
      setFeedback('idle')
    },
    [totalProblems, isSeen, markSeen]
  )

  useEffect(() => {
    if (
      isRunning &&
      problemIndex === 0 &&
      feedback === 'idle' &&
      targetNumber === 0
    ) {
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      nextProblem(0)
    }
  }, [isRunning, problemIndex, feedback, targetNumber, nextProblem])

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [])

  const handleCheck = useCallback(() => {
    if (feedback !== 'idle' || isFailurePending) return

    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current)
      feedbackTimer.current = null
    }

    if (currentTotal === targetNumber) {
      setFeedback('correct')
      celebrateSuccess()
      window.setTimeout(() => {
        setResultHistory((prev) => [...prev, 'correct'])
      }, 120)
      const nextSuccess = successCount + 1
      setSuccessCount(nextSuccess)

      feedbackTimer.current = setTimeout(() => {
        if (problemIndex + 1 >= totalProblems) {
          onComplete()
        } else {
          const upcomingIndex = problemIndex + 1
          setProblemIndex(upcomingIndex)
          nextProblem(upcomingIndex)
        }
      }, CELEBRATION_DELAY_MS)
    } else {
      setFeedback('wrong')
      setResultHistory((prev) => [...prev, 'incorrect'])
      const nextRetryCount = retryCount + 1
      setRetryCount(nextRetryCount)

      if (nextRetryCount >= MAX_MISTAKES) {
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
    }
  }, [
    currentTotal,
    targetNumber,
    feedback,
    nextProblem,
    onComplete,
    problemIndex,
    successCount,
    totalProblems,
    isFailurePending,
    onFail,
    retryCount,
  ])

  useEffect(() => {
    if (checkTrigger === prevCheckTrigger.current) return
    prevCheckTrigger.current = checkTrigger
    if (isRunning && !isCompleted) {
      handleCheck()
    }
  }, [checkTrigger, handleCheck, isCompleted, isRunning])

  useEffect(() => {
    if (!isRunning && !isCompleted) {
      clearHistory()
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      setTargetNumber(0)
      setUserTens(0)
      setUserOnes(0)
      setResultHistory([])
      setIsFailurePending(false)
      setFeedback('idle')
    }
  }, [isRunning, isCompleted, clearHistory])

  const rodStyle = (delay: number): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: `2px solid ${theme.colors.secondary}`,
    borderRadius: 6,
    background: `${theme.colors.secondary}22`,
    padding: 2,
    gap: 1,
    animation: `pv-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`,
  })

  const TEN_COUNTER_SIZE = 12
  const ONE_CROWN_SIZE = Math.max(ONE_COUNTER_SIZE + 12, 30)

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: `${uiTokens.singleVerticalSpace}px`,
      }}
    >
      <style>{`
        @keyframes pv-pop-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes pv-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pv-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes pv-slide-in-right {
          0% { transform: translateX(28px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {isFinished ? (
        <ChoreOutcomeView
          imageSrc={isSuccessState ? completionImage : failureImage}
          outcome={isSuccessState ? 'success' : 'failure'}
        />
      ) : (
        <>
          {isSetup && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: SETUP_FIELD_GAP,
                width: `${CONTROL_ROW_WIDTH}px`,
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0,
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  <StepperButton
                    theme={theme}
                    direction="prev"
                    onClick={() => onAdjustProblems(-1)}
                    disabled={!isSetup || totalProblems <= MIN_PROBLEMS}
                    ariaLabel="Fewer puzzles"
                  />

                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontWeight: 'bold',
                        fontSize: 42,
                        color: theme.colors.primary,
                        lineHeight: 1,
                      }}
                    >
                      {totalProblems}
                    </span>
                  </div>

                  <StepperButton
                    theme={theme}
                    direction="next"
                    onClick={() => onAdjustProblems(1)}
                    disabled={!isSetup || totalProblems >= MAX_PROBLEMS}
                    ariaLabel="More puzzles"
                  />
                </div>
              </div>
            </div>
          )}

          {isSetup && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                width: `${CONTROL_ROW_WIDTH}px`,
                maxWidth: '100%',
              }}
            >
              <StarDisplay
                theme={theme}
                count={starReward}
                editable
                onChange={(value) => onStarsChange(value)}
                min={1}
                max={3}
              />
            </div>
          )}

          {isRunning && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                width: `${CONTROL_ROW_WIDTH}px`,
                maxWidth: '100%',
                animation: isWrong
                  ? 'pv-shake 0.5s ease'
                  : isCorrect
                    ? 'pv-pop-in 0.4s ease'
                    : undefined,
              }}
              key={isWrong ? `shake-${retryCount}` : undefined}
            >
              {/* Scoreboard */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  background: `${theme.colors.primary}12`,
                  padding: '0 8px',
                  height: STATUS_BAR_HEIGHT,
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: STATUS_ICON_GAP,
                    flexWrap: 'nowrap',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                  }}
                >
                  {resultHistory.map((result, index) => {
                    const isLatest = index === resultHistory.length - 1
                    const overlap = getStatusIconOverlap(resultHistory.length)
                    return (
                      <img
                        key={`result-live-${index}`}
                        src={
                          result === 'correct'
                            ? quizCorrectIcon
                            : quizIncorrectIcon
                        }
                        alt={result === 'correct' ? 'Correct' : 'Incorrect'}
                        style={{
                          width: STATUS_ICON_SIZE,
                          height: STATUS_ICON_SIZE,
                          marginLeft: index === 0 ? 0 : -overlap,
                          objectFit: 'contain',
                          animation: isLatest
                            ? 'pv-slide-in-right 0.35s ease both'
                            : undefined,
                        }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Target Number */}
              <div
                style={{
                  background: `${theme.colors.surface}`,
                  border: `3px dashed ${theme.colors.primary}33`,
                  borderRadius: 16,
                  padding: '8px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                  boxSizing: 'border-box',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    lineHeight: 1,
                  }}
                >
                  {targetNumber}
                </span>
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: PLACE_VALUE_TENS_PANEL_SPLIT,
                    gap: PLACE_VALUE_PANEL_GAP,
                    width: '100%',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Tens Column */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: `${theme.colors.secondary}12`,
                      borderRadius: 16,
                      padding: 8,
                      border: `2px solid ${theme.colors.secondary}22`,
                      boxSizing: 'border-box',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.secondary,
                        marginBottom: 6,
                      }}
                    >
                      Tens
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 4,
                        marginBottom: 8,
                        width: '100%',
                      }}
                    >
                      <StepperButton
                        theme={theme}
                        direction="prev"
                        onClick={() =>
                          setUserTens((value) => Math.max(0, value - 1))
                        }
                        disabled={userTens === 0 || isCorrect}
                        ariaLabel="Remove ten"
                        style={{
                          width: PLACE_VALUE_TENS_STEPPER_WIDTH,
                          minWidth: PLACE_VALUE_TENS_STEPPER_WIDTH,
                          height: PLACE_VALUE_STEPPER_HEIGHT,
                          fontSize: '1.2rem',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          fontFamily: theme.fonts.heading,
                          color: theme.colors.secondary,
                          width: 42,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {userTens * 10}
                      </span>
                      <StepperButton
                        theme={theme}
                        direction="next"
                        onClick={() =>
                          setUserTens((value) =>
                            Math.min(MAX_POSITIONAL_NOTATION_TENS, value + 1)
                          )
                        }
                        disabled={
                          userTens === MAX_POSITIONAL_NOTATION_TENS || isCorrect
                        }
                        ariaLabel="Add ten"
                        style={{
                          width: PLACE_VALUE_TENS_STEPPER_WIDTH,
                          minWidth: PLACE_VALUE_TENS_STEPPER_WIDTH,
                          height: PLACE_VALUE_STEPPER_HEIGHT,
                          fontSize: '1.2rem',
                          flexShrink: 0,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${PLACE_VALUE_TENS_COLUMNS}, max-content)`,
                        justifyContent: 'center',
                        columnGap: DOT_GAP,
                        rowGap: DOT_GAP,
                        minHeight: 100,
                        alignItems: 'flex-end',
                        paddingBottom: 4,
                        width: '100%',
                      }}
                    >
                      {userTens === 0 ? (
                        <span
                          style={{
                            color: theme.colors.secondary,
                            opacity: 0.3,
                            fontStyle: 'italic',
                            fontFamily: theme.fonts.body,
                            fontSize: 14,
                          }}
                        >
                          ?
                        </span>
                      ) : (
                        Array.from({ length: userTens }).map((_, index) => (
                          <div
                            key={`ten-${index}`}
                            style={rodStyle(index * 0.05)}
                          >
                            {Array.from({ length: 10 }).map((_, rodIndex) => (
                              <img
                                key={rodIndex}
                                src={mathsCounterIcon}
                                alt="Counter"
                                style={{
                                  width: TEN_COUNTER_SIZE,
                                  height: TEN_COUNTER_SIZE,
                                  objectFit: 'contain',
                                }}
                              />
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ones Column */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: `${theme.colors.primary}12`,
                      borderRadius: 16,
                      padding: 8,
                      border: `2px solid ${theme.colors.primary}22`,
                      boxSizing: 'border-box',
                      width: '100%',
                      minWidth: 0,
                      justifySelf: 'stretch',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.primary,
                        marginBottom: 6,
                      }}
                    >
                      Ones
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        marginBottom: 8,
                        width: '100%',
                        paddingLeft: 4,
                        paddingRight: 4,
                        boxSizing: 'border-box',
                      }}
                    >
                      <StepperButton
                        theme={theme}
                        direction="prev"
                        onClick={() =>
                          setUserOnes((value) => Math.max(0, value - 1))
                        }
                        disabled={userOnes === 0 || isCorrect}
                        ariaLabel="Remove one"
                        style={{
                          width: PLACE_VALUE_ONES_STEPPER_WIDTH,
                          minWidth: PLACE_VALUE_ONES_STEPPER_WIDTH,
                          height: PLACE_VALUE_STEPPER_HEIGHT,
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          fontFamily: theme.fonts.heading,
                          color: theme.colors.primary,
                          width: 24,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {userOnes}
                      </span>
                      <StepperButton
                        theme={theme}
                        direction="next"
                        onClick={() =>
                          setUserOnes((value) =>
                            Math.min(MAX_POSITIONAL_NOTATION_ONES, value + 1)
                          )
                        }
                        disabled={
                          userOnes === MAX_POSITIONAL_NOTATION_ONES || isCorrect
                        }
                        ariaLabel="Add one"
                        style={{
                          width: PLACE_VALUE_ONES_STEPPER_WIDTH,
                          minWidth: PLACE_VALUE_ONES_STEPPER_WIDTH,
                          height: PLACE_VALUE_STEPPER_HEIGHT,
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignContent: 'center',
                        alignItems: 'center',
                        minHeight: 100,
                        paddingBottom: 4,
                        width: '100%',
                        gap: DOT_GAP,
                        boxSizing: 'border-box',
                      }}
                    >
                      {userOnes === 0 ? (
                        <span
                          style={{
                            color: theme.colors.primary,
                            opacity: 0.3,
                            fontStyle: 'italic',
                            fontFamily: theme.fonts.body,
                            fontSize: 14,
                          }}
                        >
                          ?
                        </span>
                      ) : (
                        Array.from({ length: userOnes }).map((_, index) => (
                          <img
                            key={`one-${index}`}
                            src={mathsCounterIcon}
                            alt="Counter"
                            style={{
                              width: ONE_CROWN_SIZE,
                              height: ONE_CROWN_SIZE,
                              objectFit: 'contain',
                              animation: `pv-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${index * 0.05}s both`,
                            }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Plus sign overlay */}
                <div
                  style={{
                    position: 'absolute',
                    left: PLACE_VALUE_PLUS_LEFT,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: PLACE_VALUE_PLUS_SIZE,
                    height: PLACE_VALUE_PLUS_SIZE,
                    borderRadius: 12,
                    background: theme.colors.surface,
                    border: `2px solid ${theme.colors.primary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: theme.fonts.heading,
                    fontSize: 24,
                    fontWeight: 900,
                    color: theme.colors.primary,
                    boxShadow: `0 4px 10px ${theme.colors.primary}22`,
                    opacity: 0.92,
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                  aria-hidden="true"
                >
                  +
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PositionalNotation
