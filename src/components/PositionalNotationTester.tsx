import { useState, useEffect, useCallback, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './StepperButton'
import StarDisplay from './StarDisplay'
import { uiTokens } from '../ui/tokens'
import mathsCorrectIcon from '../assets/themes/princess/maths-correct.svg'
import mathsIncorrectIcon from '../assets/themes/princess/maths-incorrect.svg'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import { celebrateSuccess } from '../utils/celebrate'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const MAX_MISTAKES = 3
const FAILURE_TRANSITION_DELAY_MS = 3000
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const STATUS_BAR_HEIGHT = 72
const STATUS_ICON_SIZE = Math.round(STATUS_BAR_HEIGHT * 0.9)
const STATUS_BAR_HORIZONTAL_PADDING = 16
const STATUS_ICON_GAP = 8

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generatePositionalNotationProblem(): { target: number } {
  // Random number 1–99 (tens and ones)
  const target = Math.floor(Math.random() * 99) + 1
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface PositionalNotationTesterProps {
  theme: Theme
  totalProblems: number
  starReward: number
  /** Whether the game is actively running */
  isRunning: boolean
  /** Explicit completion flag — set by parent after star award */
  isCompleted?: boolean
  /** Explicit failure flag from persisted task outcome */
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  /** Called when all problems are solved successfully */
  onComplete: () => void
  /** Called when the player reaches max mistakes */
  onFail?: () => void
  /** Increments when parent requests a check-answer action */
  checkTrigger?: number
  /** Optional completion image (themed) */
  completionImage?: string
  /** Optional failure image (themed) */
  failureImage?: string
}

const PositionalNotationTester = ({
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
}: PositionalNotationTesterProps) => {
  /* --- game state --- */
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [targetNumber, setTargetNumber] = useState(0)
  const [userTens, setUserTens] = useState(0)
  const [userOnes, setUserOnes] = useState(0)
  const [resultHistory, setResultHistory] = useState<
    Array<'correct' | 'incorrect'>
  >([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevCheckTrigger = useRef(checkTrigger)

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter((r) => r === 'incorrect').length
  const hasFailedByHistory = incorrectCount >= MAX_MISTAKES
  const isFailedState = isCompleted && (isFailed || hasFailedByHistory)
  const isSuccessState = isCompleted && !isFailedState
  const isFinished = isSuccessState || isFailedState
  const currentTotal = userTens * 10 + userOnes
  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  /* --- generate a fresh problem --- */
  const nextProblem = useCallback(() => {
    const p = generatePositionalNotationProblem()
    setTargetNumber(p.target)
    setUserTens(0)
    setUserOnes(0)
    setFeedback('idle')
  }, [])

  /* --- reset when game starts --- */
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
      nextProblem()
    }
  }, [isRunning, problemIndex, feedback, targetNumber, nextProblem])

  /* --- cleanup timers --- */
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [])

  /* --- check answer --- */
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
          setProblemIndex((i) => i + 1)
          nextProblem()
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

  /* --- reset internal state when parent signals a new game --- */
  useEffect(() => {
    if (!isRunning && !isCompleted) {
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
  }, [isRunning, isCompleted])

  /* ---------------------------------------------------------------- */
  /* Visual helpers                                                    */
  /* ---------------------------------------------------------------- */

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
  const ONE_COUNTER_SIZE = 28

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
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
      {/* Inject keyframe animations */}
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

      {/* ---- COMPLETION VIEW ---- */}
      {isFinished ? (
        isSuccessState ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}
          >
            <img
              src={completionImage ?? mathsCorrectIcon}
              alt="All done!"
              style={{
                maxWidth: '240px',
                maxHeight: '280px',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : isFailedState ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}
          >
            <img
              src={failureImage ?? mathsIncorrectIcon}
              alt="Try again!"
              style={{
                maxWidth: '240px',
                maxHeight: '280px',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              padding: '20px',
            }}
          >
            <span
              style={{
                fontSize: 42,
                fontFamily: theme.fonts.heading,
                fontWeight: 'bold',
                color: theme.colors.secondary,
              }}
            >
              You Did It! 🎉
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: starReward }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 40,
                    animation: `pv-bounce 0.6s ease ${i * 0.15}s both`,
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
            <span
              style={{
                fontSize: 20,
                fontFamily: theme.fonts.body,
                color: theme.colors.text,
              }}
            >
              Solved {successCount} puzzles!
            </span>
            {resultHistory.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  maxWidth: `${CONTROL_ROW_WIDTH}px`,
                }}
              >
                {resultHistory.map((result, index) => (
                  <img
                    key={`result-end-${index}`}
                    src={
                      result === 'correct'
                        ? mathsCorrectIcon
                        : mathsIncorrectIcon
                    }
                    alt={result === 'correct' ? 'Correct' : 'Incorrect'}
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: 'contain',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <>
          {/* ---- PROBLEMS STEPPER (setup only) ---- */}
          {isSetup && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${CONTROL_ROW_WIDTH}px`,
                maxWidth: '100%',
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
          )}

          {/* ---- STAR REWARD (setup only) ---- */}
          {isSetup && (
            <StarDisplay
              theme={theme}
              count={starReward}
              editable
              onChange={(value) => onStarsChange(value)}
              min={1}
              max={3}
            />
          )}

          {/* ---- PLAY AREA ---- */}
          {isRunning && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
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
                  background: `${theme.colors.primary}18`,
                  padding: '0 8px',
                  height: STATUS_BAR_HEIGHT,
                  borderRadius: 16,
                  boxSizing: 'border-box',
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
                            ? mathsCorrectIcon
                            : mathsIncorrectIcon
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

              {/* Target number */}
              <div
                style={{
                  background: `${theme.colors.surface}`,
                  border: `4px dashed ${theme.colors.primary}44`,
                  borderRadius: 20,
                  padding: '12px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 900,
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    lineHeight: 1,
                  }}
                >
                  {targetNumber}
                </span>
              </div>

              {/* Builder columns */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: 8,
                  width: '100%',
                }}
              >
                {/* TENS column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: `${theme.colors.secondary}18`,
                    borderRadius: 16,
                    padding: 10,
                    border: `2px solid ${theme.colors.secondary}33`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.secondary,
                      marginBottom: 8,
                    }}
                  >
                    Tens
                  </span>

                  {/* Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <StepperButton
                      theme={theme}
                      direction="prev"
                      onClick={() => setUserTens((p) => Math.max(0, p - 1))}
                      disabled={userTens === 0 || isCorrect}
                      ariaLabel="Remove ten"
                      style={{ width: 38, height: 48, fontSize: '1.5rem' }}
                    />
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.secondary,
                        width: 30,
                        textAlign: 'center',
                      }}
                    >
                      {userTens}
                    </span>
                    <StepperButton
                      theme={theme}
                      direction="next"
                      onClick={() => setUserTens((p) => Math.min(9, p + 1))}
                      disabled={userTens === 9 || isCorrect}
                      ariaLabel="Add ten"
                      style={{ width: 38, height: 48, fontSize: '1.5rem' }}
                    />
                  </div>

                  {/* Rods visual */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: 4,
                      minHeight: 120,
                      alignItems: 'flex-end',
                      paddingBottom: 4,
                    }}
                  >
                    {userTens === 0 ? (
                      <span
                        style={{
                          color: theme.colors.secondary,
                          opacity: 0.35,
                          fontStyle: 'italic',
                          fontFamily: theme.fonts.body,
                          fontSize: 14,
                        }}
                      >
                        Empty
                      </span>
                    ) : (
                      Array.from({ length: userTens }).map((_, i) => (
                        <div key={`ten-${i}`} style={rodStyle(i * 0.05)}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <img
                              key={j}
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

                {/* ONES column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: `${theme.colors.primary}18`,
                    borderRadius: 16,
                    padding: 10,
                    border: `2px solid ${theme.colors.primary}33`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.primary,
                      marginBottom: 8,
                    }}
                  >
                    Ones
                  </span>

                  {/* Stepper */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <StepperButton
                      theme={theme}
                      direction="prev"
                      onClick={() => setUserOnes((p) => Math.max(0, p - 1))}
                      disabled={userOnes === 0 || isCorrect}
                      ariaLabel="Remove one"
                      style={{ width: 38, height: 48, fontSize: '1.5rem' }}
                    />
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.primary,
                        width: 30,
                        textAlign: 'center',
                      }}
                    >
                      {userOnes}
                    </span>
                    <StepperButton
                      theme={theme}
                      direction="next"
                      onClick={() => setUserOnes((p) => Math.min(9, p + 1))}
                      disabled={userOnes === 9 || isCorrect}
                      ariaLabel="Add one"
                      style={{ width: 38, height: 48, fontSize: '1.5rem' }}
                    />
                  </div>

                  {/* Units visual */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      minHeight: 120,
                      paddingBottom: 4,
                    }}
                  >
                    {userOnes === 0 ? (
                      <span
                        style={{
                          color: theme.colors.primary,
                          opacity: 0.35,
                          fontStyle: 'italic',
                          fontFamily: theme.fonts.body,
                          fontSize: 14,
                        }}
                      >
                        Empty
                      </span>
                    ) : (
                      Array.from({ length: userOnes }).map((_, i) => (
                        <img
                          key={`one-${i}`}
                          src={mathsCounterIcon}
                          alt="Counter"
                          style={{
                            width: ONE_COUNTER_SIZE,
                            height: ONE_COUNTER_SIZE,
                            objectFit: 'contain',
                            margin: 3,
                            animation: `pv-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${i * 0.05}s both`,
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PositionalNotationTester
