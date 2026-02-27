import { useState, useEffect, useCallback, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './StepperButton'
import StarDisplay from './StarDisplay'
import { uiTokens } from '../ui/tokens'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import mathsCorrectIcon from '../assets/themes/princess/maths-correct.svg'
import mathsIncorrectIcon from '../assets/themes/princess/maths-incorrect.svg'
import { celebrateSuccess } from '../utils/celebrate'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const MAX_ANSWER = 20
const DOT_SIZE = 28
const DOT_GAP = 6
const ANSWER_COUNTER_SIZE = 32
const ANSWER_DOT_GAP = 8
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const MAX_MISTAKES = 3
const FAILURE_TRANSITION_DELAY_MS = 3000
const STATUS_BAR_HEIGHT = 72
const STATUS_ICON_SIZE = Math.round(STATUS_BAR_HEIGHT * 0.9)
const STATUS_BAR_HORIZONTAL_PADDING = 16
const STATUS_ICON_GAP = 8

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateProblem(): {
  a: number
  b: number
  op: '+' | '-'
} {
  const isAdd = Math.random() > 0.5
  let a = Math.floor(Math.random() * 10) + 1
  let b = Math.floor(Math.random() * 10) + 1

  // Prevent negative results for subtraction
  if (!isAdd && b > a) {
    const temp = a
    a = b
    b = temp
  }

  return { a, b, op: isAdd ? '+' : '-' }
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

export interface MathsTesterProps {
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

const MathsTester = ({
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
}: MathsTesterProps) => {
  /* --- game state --- */
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [valA, setValA] = useState(0)
  const [valB, setValB] = useState(0)
  const [op, setOp] = useState<'+' | '-'>('+')
  const [userAnswer, setUserAnswer] = useState(0)
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
  const expectedAnswer = op === '+' ? valA + valB : valA - valB
  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  /* --- generate a fresh problem --- */
  const nextProblem = useCallback(() => {
    const p = generateProblem()
    setValA(p.a)
    setValB(p.b)
    setOp(p.op)
    setUserAnswer(0)
    setFeedback('idle')
  }, [])

  /* --- reset when game starts --- */
  useEffect(() => {
    if (isRunning && problemIndex === 0 && feedback === 'idle' && valA === 0) {
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      nextProblem()
    }
  }, [isRunning, problemIndex, feedback, valA, nextProblem])

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

    if (userAnswer === expectedAnswer) {
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
    expectedAnswer,
    feedback,
    nextProblem,
    onComplete,
    problemIndex,
    successCount,
    totalProblems,
    userAnswer,
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
      setValA(0)
      setValB(0)
      setOp('+')
      setUserAnswer(0)
      setResultHistory([])
      setIsFailurePending(false)
      setFeedback('idle')
    }
  }, [isRunning, isCompleted])

  /* ---------------------------------------------------------------- */
  /* Shared styles                                                     */
  /* ---------------------------------------------------------------- */

  const counterStyle = (size: number, delay: number): React.CSSProperties => ({
    width: size,
    height: size,
    objectFit: 'contain',
    animation: `dotmath-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`,
  })

  const crossedCounterStyle = (
    size: number,
    delay: number
  ): React.CSSProperties => ({
    width: size,
    height: size,
    objectFit: 'contain',
    opacity: 0.4,
    position: 'relative' as const,
    animation: `dotmath-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`,
  })

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
        @keyframes dotmath-pop-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes dotmath-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes dotmath-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes dotmath-slide-in-right {
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
                    animation: `dotmath-bounce 0.6s ease ${i * 0.15}s both`,
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
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontWeight: 'bold',
                    fontSize: 18,
                    color: theme.colors.text,
                    opacity: 0.7,
                  }}
                >
                  🔢 Puzzles
                </span>
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
                  ? 'dotmath-shake 0.5s ease'
                  : isCorrect
                    ? 'dotmath-pop-in 0.4s ease'
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
                            ? 'dotmath-slide-in-right 0.35s ease both'
                            : undefined,
                        }}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Term A */}
              <div
                style={{
                  background: `${theme.colors.surface}`,
                  border: `3px dashed ${theme.colors.primary}44`,
                  borderRadius: 20,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  width: '100%',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 'bold',
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    lineHeight: 1,
                  }}
                >
                  {valA}
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: DOT_GAP,
                    maxWidth: 160,
                  }}
                >
                  {Array.from({ length: valA }).map((_, i) => (
                    <img
                      key={`a-${i}`}
                      src={mathsCounterIcon}
                      alt="Counter"
                      style={counterStyle(DOT_SIZE, i * 0.05)}
                    />
                  ))}
                </div>
              </div>

              {/* Operator */}
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 'bold',
                  fontFamily: theme.fonts.heading,
                  color:
                    op === '+' ? theme.colors.secondary : theme.colors.accent,
                  lineHeight: 0.9,
                }}
              >
                {op === '+' ? '+' : '−'}
              </span>

              {/* Term B */}
              <div
                style={{
                  background: `${theme.colors.surface}`,
                  border: `3px dashed ${theme.colors.primary}44`,
                  borderRadius: 20,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  width: '100%',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    fontSize: 44,
                    fontWeight: 'bold',
                    fontFamily: theme.fonts.heading,
                    color:
                      op === '+' ? theme.colors.secondary : theme.colors.accent,
                    lineHeight: 1,
                  }}
                >
                  {valB}
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: DOT_GAP,
                    maxWidth: 160,
                  }}
                >
                  {Array.from({ length: valB }).map((_, i) =>
                    op === '+' ? (
                      <img
                        key={`b-${i}`}
                        src={mathsCounterIcon}
                        alt="Counter"
                        style={counterStyle(DOT_SIZE, i * 0.1)}
                      />
                    ) : (
                      <div
                        key={`b-${i}`}
                        style={{
                          position: 'relative',
                          width: DOT_SIZE,
                          height: DOT_SIZE,
                        }}
                      >
                        <img
                          src={mathsCounterIcon}
                          alt="Counter"
                          style={crossedCounterStyle(DOT_SIZE, 0.4 + i * 0.1)}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 16,
                          }}
                        >
                          ❌
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Equals sign */}
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 'bold',
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                  lineHeight: 0.9,
                }}
              >
                =
              </span>

              {/* Answer area */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                }}
              >
                {/* Answer dot box */}
                <div
                  style={{
                    border: `3px dashed ${theme.colors.accent}`,
                    background: `${theme.colors.accent}0D`,
                    borderRadius: 20,
                    minHeight: 72,
                    width: '100%',
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: ANSWER_DOT_GAP,
                    boxSizing: 'border-box',
                  }}
                >
                  {userAnswer === 0 ? (
                    <span
                      style={{
                        color: theme.colors.accent,
                        opacity: 0.5,
                        fontStyle: 'italic',
                        fontSize: 20,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      Empty
                    </span>
                  ) : (
                    Array.from({ length: userAnswer }).map((_, i) => (
                      <img
                        key={`c-${i}`}
                        src={mathsCounterIcon}
                        alt="Counter"
                        style={counterStyle(ANSWER_COUNTER_SIZE, 0)}
                      />
                    ))
                  )}
                </div>

                {/* +/- answer controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 12,
                  }}
                >
                  <StepperButton
                    theme={theme}
                    direction="prev"
                    onClick={() => setUserAnswer(Math.max(0, userAnswer - 1))}
                    disabled={userAnswer === 0 || isCorrect}
                    ariaLabel="Remove one dot"
                  />

                  <span
                    style={{
                      flex: 1,
                      fontSize: 44,
                      fontWeight: 'bold',
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.accent,
                      minWidth: 0,
                      textAlign: 'center',
                      lineHeight: 1,
                    }}
                  >
                    {userAnswer}
                  </span>

                  <StepperButton
                    theme={theme}
                    direction="next"
                    onClick={() => setUserAnswer(userAnswer + 1)}
                    disabled={userAnswer >= MAX_ANSWER || isCorrect}
                    ariaLabel="Add one dot"
                  />
                </div>
              </div>

              {/* Feedback area intentionally empty to keep layout stable */}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MathsTester
