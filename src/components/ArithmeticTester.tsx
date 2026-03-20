import { useState, useEffect, useCallback, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './StepperButton'
import StarDisplay from './StarDisplay'
import ChoreOutcomeView from './ChoreOutcomeView'
import { uiTokens } from '../ui/tokens'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { celebrateSuccess } from '../lib/celebrate'
import { useProblemHistory } from '../lib/useProblemHistory'
import type { MathDifficulty } from '../data/types'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const MAX_ANSWER = 30
const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const MAX_MISTAKES = 3
const FAILURE_TRANSITION_DELAY_MS = 3000

const {
  statusBarHeight: STATUS_BAR_HEIGHT,
  statusIconSize: STATUS_ICON_SIZE,
  statusIconGap: STATUS_ICON_GAP,
  mathCounterSize: DOT_SIZE,
  mathCounterGap: DOT_GAP,
  answerCounterSize: ANSWER_COUNTER_SIZE,
  answerCounterGap: ANSWER_DOT_GAP,
  stepperWidth: STEPPER_WIDTH,
  stepperHeight: STEPPER_HEIGHT,
} = uiTokens.activityTokens

const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const STATUS_BAR_HORIZONTAL_PADDING = 12

function generateProblem(difficulty: MathDifficulty = 'easy'): {
  a: number
  b: number
  c?: number
  op1: '+' | '-'
  op2?: '+' | '-'
} {
  const isAdd1 = Math.random() > 0.5
  let a = Math.floor(Math.random() * 10) + 1
  let b = Math.floor(Math.random() * 10) + 1

  if (difficulty === 'hard') {
    const isAdd2 = Math.random() > 0.5
    let c = Math.floor(Math.random() * 10) + 1

    if (!isAdd1 && b > a) [a, b] = [b, a]
    const intermediate = isAdd1 ? a + b : a - b

    if (!isAdd2 && c > intermediate) {
      if (intermediate > 0) {
        c = Math.floor(Math.random() * intermediate) + 1
      } else {
        return generateProblem(difficulty)
      }
    }

    return { a, b, c, op1: isAdd1 ? '+' : '-', op2: isAdd2 ? '+' : '-' }
  }

  if (!isAdd1 && b > a) [a, b] = [b, a]
  return { a, b, op1: isAdd1 ? '+' : '-' }
}

function getProblemKey(p: {
  a: number
  b: number
  c?: number
  op1: '+' | '-'
  op2?: '+' | '-'
}): string {
  return `${p.a}${p.op1}${p.b}${p.op2 ?? ''}${p.c ?? ''}`
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

export interface ArithmeticTesterProps {
  theme: Theme
  totalProblems: number
  starReward: number
  difficulty?: MathDifficulty
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onDifficultyChange?: (difficulty: MathDifficulty) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
}

const ArithmeticTester = ({
  theme,
  totalProblems,
  starReward,
  difficulty = 'easy',
  isRunning,
  isCompleted = false,
  isFailed = false,
  onAdjustProblems,
  onStarsChange,
  onDifficultyChange,
  onComplete,
  onFail,
  checkTrigger = 0,
  completionImage,
  failureImage,
}: ArithmeticTesterProps) => {
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [valA, setValA] = useState(0)
  const [valB, setValB] = useState(0)
  const [valC, setValC] = useState<number | undefined>(undefined)
  const [op1, setOp1] = useState<'+' | '-'>('+')
  const [op2, setOp2] = useState<'+' | '-' | undefined>(undefined)
  const [userAnswer, setUserAnswer] = useState(0)
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

  const expectedAnswer = (() => {
    let res = op1 === '+' ? valA + valB : valA - valB
    if (valC !== undefined && op2 !== undefined) {
      res = op2 === '+' ? res + valC : res - valC
    }
    return res
  })()

  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  const nextProblem = useCallback(() => {
    let p = generateProblem(difficulty)
    let attempts = 0
    while (isSeen(getProblemKey(p)) && attempts < 10) {
      p = generateProblem(difficulty)
      attempts++
    }
    markSeen(getProblemKey(p))
    setValA(p.a)
    setValB(p.b)
    setValC(p.c)
    setOp1(p.op1)
    setOp2(p.op2)
    setUserAnswer(0)
    setFeedback('idle')
  }, [difficulty, isSeen, markSeen])

  useEffect(() => {
    if (isRunning && problemIndex === 0 && feedback === 'idle' && valA === 0) {
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      nextProblem()
    }
  }, [isRunning, problemIndex, feedback, valA, nextProblem])

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
          setProblemIndex((index) => index + 1)
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

  useEffect(() => {
    if (!isRunning && !isCompleted) {
      clearHistory()
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      setValA(0)
      setValB(0)
      setValC(undefined)
      setOp1('+')
      setOp2(undefined)
      setUserAnswer(0)
      setResultHistory([])
      setIsFailurePending(false)
      setFeedback('idle')
    }
  }, [isRunning, isCompleted, clearHistory])

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
        @keyframes dotmath-pop-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
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
                gap: 16,
                width: `${CONTROL_ROW_WIDTH}px`,
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  background: theme.colors.surface,
                  borderRadius: '16px',
                  padding: '4px',
                  border: `2px solid ${theme.colors.accent}`,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                {(['easy', 'hard'] as MathDifficulty[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onDifficultyChange?.(value)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: '12px',
                      border: 'none',
                      fontFamily: theme.fonts.heading,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      background:
                        difficulty === value
                          ? theme.colors.primary
                          : 'transparent',
                      color:
                        difficulty === value
                          ? theme.id === 'space'
                            ? '#000'
                            : '#fff'
                          : theme.colors.text,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {value.toUpperCase()}
                  </button>
                ))}
              </div>

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
          )}

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
                  ? 'dotmath-shake 0.5s ease'
                  : isCorrect
                    ? 'dotmath-pop-in 0.4s ease'
                    : undefined,
              }}
              key={isWrong ? `shake-${retryCount}` : undefined}
            >
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
                            ? 'dotmath-slide-in-right 0.35s ease both'
                            : undefined,
                        }}
                      />
                    )
                  })}
                </div>
              </div>

              {[
                { val: valA, op: undefined, color: theme.colors.primary },
                {
                  val: valB,
                  op: op1,
                  color:
                    op1 === '+' ? theme.colors.secondary : theme.colors.accent,
                },
                ...(valC !== undefined
                  ? [
                      {
                        val: valC,
                        op: op2,
                        color:
                          op2 === '+'
                            ? theme.colors.secondary
                            : theme.colors.accent,
                      },
                    ]
                  : []),
              ].map((term, index) => (
                <div
                  key={`term-row-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    gap: 4,
                  }}
                >
                  {term.op && (
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: term.color,
                        lineHeight: 0.8,
                      }}
                    >
                      {term.op === '+' ? '+' : '−'}
                    </span>
                  )}

                  <div
                    style={{
                      background: `${theme.colors.surface}`,
                      border: `3px dashed ${theme.colors.primary}33`,
                      borderRadius: 16,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 40,
                      width: '100%',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: term.color,
                        lineHeight: 1,
                        minWidth: '1.2em',
                        textAlign: 'center',
                      }}
                    >
                      {term.val}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: DOT_GAP,
                        maxWidth: 160,
                        justifyContent: 'center',
                        maxHeight: 60,
                        overflowY: 'hidden',
                      }}
                    >
                      {Array.from({ length: term.val }).map((_, dotIndex) =>
                        term.op === '-' ? (
                          <div
                            key={`dot-${index}-${dotIndex}`}
                            style={{
                              position: 'relative',
                              width: DOT_SIZE,
                              height: DOT_SIZE,
                            }}
                          >
                            <img
                              src={mathsCounterIcon}
                              alt="Counter"
                              style={crossedCounterStyle(
                                DOT_SIZE,
                                0.4 + dotIndex * 0.05
                              )}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: 12,
                                lineHeight: 1,
                              }}
                            >
                              ❌
                            </span>
                          </div>
                        ) : (
                          <img
                            key={`dot-${index}-${dotIndex}`}
                            src={mathsCounterIcon}
                            alt="Counter"
                            style={counterStyle(DOT_SIZE, dotIndex * 0.03)}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <span
                style={{
                  fontSize: 44,
                  fontWeight: 'bold',
                  fontFamily: theme.fonts.heading,
                  color: theme.colors.text,
                  lineHeight: 0.8,
                  marginTop: 2,
                }}
              >
                =
              </span>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                }}
              >
                <div
                  style={{
                    border: `3px dashed ${theme.colors.accent}`,
                    background: `${theme.colors.accent}0D`,
                    borderRadius: 16,
                    minHeight: 52,
                    width: '100%',
                    padding: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: ANSWER_DOT_GAP,
                    boxSizing: 'border-box',
                    maxHeight: 100,
                    overflowY: 'hidden',
                  }}
                >
                  {userAnswer === 0 ? (
                    <span
                      style={{
                        color: theme.colors.accent,
                        opacity: 0.5,
                        fontStyle: 'italic',
                        fontSize: 18,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      ?
                    </span>
                  ) : (
                    Array.from({ length: userAnswer }).map((_, index) => (
                      <img
                        key={`c-${index}`}
                        src={mathsCounterIcon}
                        alt="Counter"
                        style={counterStyle(ANSWER_COUNTER_SIZE, 0)}
                      />
                    ))
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: 8,
                  }}
                >
                  <StepperButton
                    theme={theme}
                    direction="prev"
                    onClick={() => setUserAnswer(Math.max(0, userAnswer - 1))}
                    disabled={userAnswer === 0 || isCorrect}
                    ariaLabel="Remove one dot"
                    style={{
                      width: STEPPER_WIDTH,
                      height: STEPPER_HEIGHT,
                    }}
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
                    style={{
                      width: STEPPER_WIDTH,
                      height: STEPPER_HEIGHT,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ArithmeticTester
