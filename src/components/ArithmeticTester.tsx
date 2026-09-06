import { useState, useCallback } from 'react'
import StepperButton from './ui/StepperButton'
import { uiTokens } from '../tokens'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import type { MathDifficulty } from '../data/types'
import {
  ActivityPlayArea,
  type ActivityChoreProps,
} from './ui/ActivityControls'
import { EmptyCounterHint, MathCounter } from './ui/ActivityMathCounters'
import CrownDifficultyControl, {
  type CrownDifficultyOption,
} from './ui/CrownDifficultyControl'
import MathActivityShell from './ui/MathActivityShell'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'

const MAX_ANSWER = 30
const MATH_DIFFICULTIES: CrownDifficultyOption<MathDifficulty>[] = [
  { value: 'easy', label: 'Easy', crowns: 1 },
  { value: 'hard', label: 'Hard', crowns: 2 },
]
const {
  mathCounterSize: DOT_SIZE,
  mathCounterGap: DOT_GAP,
  answerCounterSize: ANSWER_COUNTER_SIZE,
  answerCounterGap: ANSWER_DOT_GAP,
  stepperWidth: STEPPER_WIDTH,
  stepperHeight: STEPPER_HEIGHT,
} = uiTokens.activityTokens

type ArithmeticProblem = {
  a: number
  b: number
  c?: number
  op1: '+' | '-'
  op2?: '+' | '-'
}

const EMPTY_PROBLEM: ArithmeticProblem = { a: 0, b: 0, op1: '+' }

const randomOperand = () => Math.floor(Math.random() * 10) + 1

const generateEasyProblem = (): ArithmeticProblem => {
  const isAddition = Math.random() > 0.5
  let a = randomOperand()
  let b = randomOperand()
  if (!isAddition && b > a) [a, b] = [b, a]
  return { a, b, op1: isAddition ? '+' : '-' }
}

const generateHardProblem = (): ArithmeticProblem => {
  const first = generateEasyProblem()
  const isSecondAddition = Math.random() > 0.5
  const intermediate = first.op1 === '+' ? first.a + first.b : first.a - first.b
  let c = randomOperand()

  if (!isSecondAddition && intermediate <= 0) {
    return generateHardProblem()
  }
  if (!isSecondAddition && c > intermediate) {
    c = Math.floor(Math.random() * intermediate) + 1
  }

  return { ...first, c, op2: isSecondAddition ? '+' : '-' }
}

const generateProblem = (difficulty: MathDifficulty = 'easy') =>
  difficulty === 'hard' ? generateHardProblem() : generateEasyProblem()

function getProblemKey(p: ArithmeticProblem): string {
  return `${p.a}${p.op1}${p.b}${p.op2 ?? ''}${p.c ?? ''}`
}

export interface ArithmeticTesterProps extends ActivityChoreProps {
  difficulty?: MathDifficulty
  onDifficultyChange?: (difficulty: MathDifficulty) => void
}

const ArithmeticTester = (props: ArithmeticTesterProps) => {
  const { theme, isRunning, difficulty = 'easy', onDifficultyChange } = props
  const [problem, setProblem] = useState(EMPTY_PROBLEM)
  const { a: valA, b: valB, c: valC, op1, op2 } = problem
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
    const p = pickUnseenProblem(
      () => generateProblem(difficulty),
      (problem) => isSeen(getProblemKey(problem))
    )
    markSeen(getProblemKey(p))
    setProblem(p)
    setUserAnswer(0)
  }, [difficulty, isSeen, markSeen])

  const resetProblem = useCallback(() => {
    clearHistory()
    setProblem(EMPTY_PROBLEM)
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
  } = useCheckedActivityChallenge({
    ...props,
    canStart: valA === 0,
    onStart: nextProblem,
    onReset: resetProblem,
    isAnswerCorrect: userAnswer === expectedAnswer,
    onNextProblem: nextProblem,
  })

  const playAnimation = isWrong
    ? 'dotmath-shake 0.5s ease'
    : isCorrect
      ? 'dotmath-pop-in 0.4s ease'
      : undefined

  return (
    <MathActivityShell
      {...props}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      isSetup={isSetup}
      animationStyles={getActivityFeedbackAnimationStyles('dotmath')}
      difficultyControl={
        <CrownDifficultyControl
          theme={theme}
          value={difficulty}
          options={MATH_DIFFICULTIES}
          onChange={(value) => onDifficultyChange?.(value)}
          ariaLabel="Math difficulty"
          crownSize={DOT_SIZE}
        />
      }
    >
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
                        <MathCounter
                          src={mathsCounterIcon}
                          size={DOT_SIZE}
                          delay={0.4 + dotIndex * 0.05}
                          animationName="dotmath-pop-in"
                          style={{
                            opacity: 0.4,
                            position: 'relative',
                          }}
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
                      <MathCounter
                        key={`dot-${index}-${dotIndex}`}
                        src={mathsCounterIcon}
                        size={DOT_SIZE}
                        delay={dotIndex * 0.03}
                        animationName="dotmath-pop-in"
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
                <EmptyCounterHint
                  color={theme.colors.accent}
                  fontFamily={theme.fonts.body}
                />
              ) : (
                Array.from({ length: userAnswer }).map((_, index) => (
                  <MathCounter
                    key={`c-${index}`}
                    src={mathsCounterIcon}
                    size={ANSWER_COUNTER_SIZE}
                    delay={0}
                    animationName="dotmath-pop-in"
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
    </MathActivityShell>
  )
}

export default ArithmeticTester
