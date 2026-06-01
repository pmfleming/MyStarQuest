import { useState, useEffect, useCallback } from 'react'
import StepperButton from './ui/StepperButton'
import { uiTokens } from '../tokens'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { useProblemHistory } from '../lib/useProblemHistory'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import type { MathDifficulty } from '../data/types'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
} from './ui/ActivityControls'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const MAX_ANSWER = 30
const MATH_DIFFICULTIES: MathDifficulty[] = ['easy', 'hard']
const {
  mathCounterSize: DOT_SIZE,
  mathCounterGap: DOT_GAP,
  answerCounterSize: ANSWER_COUNTER_SIZE,
  answerCounterGap: ANSWER_DOT_GAP,
  stepperWidth: STEPPER_WIDTH,
  stepperHeight: STEPPER_HEIGHT,
} = uiTokens.activityTokens

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

export interface ArithmeticTesterProps extends ActivityChoreProps {
  difficulty?: MathDifficulty
  onDifficultyChange?: (difficulty: MathDifficulty) => void
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
  const [valA, setValA] = useState(0)
  const [valB, setValB] = useState(0)
  const [valC, setValC] = useState<number | undefined>(undefined)
  const [op1, setOp1] = useState<'+' | '-'>('+')
  const [op2, setOp2] = useState<'+' | '-' | undefined>(undefined)
  const [userAnswer, setUserAnswer] = useState(0)
  const { isSeen, markSeen, clearHistory } = useProblemHistory()

  const expectedAnswer = (() => {
    let res = op1 === '+' ? valA + valB : valA - valB
    if (valC !== undefined && op2 !== undefined) {
      res = op2 === '+' ? res + valC : res - valC
    }
    return res
  })()

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
  }, [difficulty, isSeen, markSeen])

  const resetProblem = useCallback(() => {
    clearHistory()
    setValA(0)
    setValB(0)
    setValC(undefined)
    setOp1('+')
    setOp2(undefined)
    setUserAnswer(0)
  }, [clearHistory])

  const {
    retryCount,
    resultHistory,
    isSetup,
    isFinished,
    isSuccessState,
    isCorrect,
    isWrong,
    consumeCheckTrigger,
    resetFeedback,
  } = useActivityChallenge({
    isRunning,
    isCompleted,
    isFailed,
    totalProblems,
    checkTrigger,
    canStart: valA === 0,
    onStart: nextProblem,
    onReset: resetProblem,
    onComplete,
    onFail,
  })

  useEffect(() => {
    consumeCheckTrigger(userAnswer === expectedAnswer, () => {
      resetFeedback()
      nextProblem()
    })
  }, [
    consumeCheckTrigger,
    expectedAnswer,
    nextProblem,
    resetFeedback,
    userAnswer,
  ])

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
    position: 'relative',
    animation: `dotmath-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`,
  })

  const playAnimation = isWrong
    ? 'dotmath-shake 0.5s ease'
    : isCorrect
      ? 'dotmath-pop-in 0.4s ease'
      : undefined

  const difficultyControl = (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          minHeight: uiTokens.listActionHeight,
          background: theme.colors.surface,
          borderRadius: uiTokens.listActionRadius,
          padding: uiTokens.controlInset / 2,
          border: `2px solid ${theme.colors.accent}`,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {MATH_DIFFICULTIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onDifficultyChange?.(value)}
            style={{
              flex: 1,
              padding: 0,
              borderRadius:
                uiTokens.listActionRadius - uiTokens.controlInset / 2,
              border: 'none',
              fontFamily: theme.fonts.heading,
              fontWeight: 'bold',
              fontSize: '1rem',
              lineHeight: 1,
              cursor: 'pointer',
              background:
                difficulty === value ? theme.colors.primary : 'transparent',
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
    </div>
  )

  return (
    <ActivityOutcomeShell
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
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

      <ActivitySetupControls
        isSetup={isSetup}
        theme={theme}
        totalProblems={totalProblems}
        min={MIN_PROBLEMS}
        max={MAX_PROBLEMS}
        onAdjustProblems={onAdjustProblems}
        starReward={starReward}
        onStarsChange={onStarsChange}
        previousAriaLabel="Fewer puzzles"
        nextAriaLabel="More puzzles"
        beforeProblemControl={difficultyControl}
      />

      {isRunning && (
        <ActivityPlayArea
          theme={theme}
          results={resultHistory}
          correctIcon={quizCorrectIcon}
          incorrectIcon={quizIncorrectIcon}
          slideAnimationName="dotmath-slide-in-right"
          animation={playAnimation}
          shakeKey={isWrong ? `shake-${retryCount}` : undefined}
        >
          {[
            { val: valA, op: undefined, color: theme.colors.primary },
            {
              val: valB,
              op: op1,
              color: op1 === '+' ? theme.colors.secondary : theme.colors.accent,
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
        </ActivityPlayArea>
      )}
    </ActivityOutcomeShell>
  )
}

export default ArithmeticTester
