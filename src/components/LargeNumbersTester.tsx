import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import { useProblemHistory } from '../lib/useProblemHistory'
import { uiTokens } from '../tokens'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
} from './ui/ActivityControls'
import { CounterGroup, MathCounter, TenRod } from './ui/ActivityMathCounters'
import StepperButton from './ui/StepperButton'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 9
const MIN_ADDEND = 11
const MAX_SUM = 99
const MAX_FIRST_ADDEND = MAX_SUM - MIN_ADDEND
const MAX_ONES_TENS = 1
const MAX_TENS_RODS = 10
const PLACE_GRID_COLUMNS = '44px 40px minmax(82px, 1fr) 42px minmax(82px, 1fr)'
const TENS_COUNTER_COLUMNS = '2 / 4'
const DIGIT_STEPPER_WIDTH = 30
const DIGIT_STEPPER_HEIGHT = 40
const DIGIT_FONT_SIZE = 54
const ANSWER_DIGIT_FONT_SIZE = 50
const TEN_COUNTER_SIZE = 10
const ONE_COUNTER_SIZE = 24

const { mathCounterGap: DOT_GAP } = uiTokens.activityTokens

type LargeNumbersProblem = {
  a: number
  b: number
}

type OnesAnswerState = {
  ones: number
  onesTens: number
}

function generateLargeNumbersProblem(): LargeNumbersProblem {
  const a =
    Math.floor(Math.random() * (MAX_FIRST_ADDEND - MIN_ADDEND + 1)) + MIN_ADDEND
  const maxB = MAX_SUM - a
  const b = Math.floor(Math.random() * (maxB - MIN_ADDEND + 1)) + MIN_ADDEND

  return Math.random() > 0.5 ? { a, b } : { a: b, b: a }
}

function getProblemKey(problem: LargeNumbersProblem): string {
  return `${problem.a}+${problem.b}`
}

const getDigits = (value: number) => ({
  hundreds: Math.floor(value / 100),
  tens: Math.floor((value % 100) / 10),
  ones: value % 10,
})

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const getAdjustedOnesState = (
  { ones, onesTens }: OnesAnswerState,
  delta: number,
  currentAnswer: number
): OnesAnswerState | null => {
  if (delta > 0) {
    if (
      currentAnswer >= MAX_SUM ||
      (onesTens === MAX_ONES_TENS && ones === 9)
    ) {
      return null
    }

    return ones < 9
      ? { ones: ones + 1, onesTens }
      : { ones: 0, onesTens: clamp(onesTens + 1, 0, MAX_ONES_TENS) }
  }

  if (ones === 0 && onesTens === 0) return null

  return ones > 0
    ? { ones: ones - 1, onesTens }
    : { ones: onesTens > 0 ? 9 : 0, onesTens: Math.max(0, onesTens - 1) }
}

export type LargeNumbersTesterProps = ActivityChoreProps

const LargeNumbersTester = ({
  theme,
  totalProblems,
  starReward,
  isRunning,
  isEditable = true,
  isCompleted = false,
  isFailed = false,
  onAdjustProblems,
  onStarsChange,
  onComplete,
  onFail,
  checkTrigger = 0,
  completionImage,
  failureImage,
  failureModeEnabled = true,
}: LargeNumbersTesterProps) => {
  const [addendA, setAddendA] = useState(0)
  const [addendB, setAddendB] = useState(0)
  const [userTensRods, setUserTensRods] = useState(0)
  const [userOnesTens, setUserOnesTens] = useState(0)
  const [userOnes, setUserOnes] = useState(0)
  const { isSeen, markSeen, clearHistory } = useProblemHistory()

  const expectedAnswer = addendA + addendB
  const firstDigits = getDigits(addendA)
  const secondDigits = getDigits(addendB)
  const currentAnswer = (userTensRods + userOnesTens) * 10 + userOnes
  const answerDigits = getDigits(currentAnswer)

  const nextProblem = useCallback(() => {
    let problem = generateLargeNumbersProblem()
    let attempts = 0
    while (isSeen(getProblemKey(problem)) && attempts < 10) {
      problem = generateLargeNumbersProblem()
      attempts++
    }
    markSeen(getProblemKey(problem))

    setAddendA(problem.a)
    setAddendB(problem.b)
    setUserTensRods(0)
    setUserOnesTens(0)
    setUserOnes(0)
  }, [isSeen, markSeen])

  const resetProblem = useCallback(() => {
    clearHistory()
    setAddendA(0)
    setAddendB(0)
    setUserTensRods(0)
    setUserOnesTens(0)
    setUserOnes(0)
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
    canStart: addendA === 0,
    onStart: nextProblem,
    onReset: resetProblem,
    onComplete,
    onFail,
    failureModeEnabled,
  })

  useEffect(() => {
    consumeCheckTrigger(currentAnswer === expectedAnswer, () => {
      resetFeedback()
      nextProblem()
    })
  }, [
    consumeCheckTrigger,
    currentAnswer,
    expectedAnswer,
    nextProblem,
    resetFeedback,
  ])

  const adjustOnes = (delta: number) => {
    const nextState = getAdjustedOnesState(
      {
        ones: userOnes,
        onesTens: userOnesTens,
      },
      delta,
      currentAnswer
    )

    if (!nextState) return

    setUserOnes(nextState.ones)
    setUserOnesTens(nextState.onesTens)
  }

  const canAddOne =
    getAdjustedOnesState(
      {
        ones: userOnes,
        onesTens: userOnesTens,
      },
      1,
      currentAnswer
    ) !== null
  const canRemoveOne =
    getAdjustedOnesState(
      {
        ones: userOnes,
        onesTens: userOnesTens,
      },
      -1,
      currentAnswer
    ) !== null

  const canAddTen = currentAnswer + 10 <= MAX_SUM

  const adjustTens = (delta: number) => {
    if (delta > 0 && !canAddTen) return
    setUserTensRods((value) => clamp(value + delta, 0, MAX_TENS_RODS))
  }

  const playAnimation = isWrong
    ? 'large-numbers-shake 0.5s ease'
    : isCorrect
      ? 'large-numbers-pop-in 0.4s ease'
      : undefined

  const digitCellStyle = (
    background: string,
    isAnswer = false
  ): CSSProperties => ({
    minHeight: isAnswer ? 58 : 62,
    borderRadius: 8,
    background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: theme.fonts.heading,
    fontSize: isAnswer ? ANSWER_DIGIT_FONT_SIZE : DIGIT_FONT_SIZE,
    fontWeight: 900,
    lineHeight: 1,
    color: theme.colors.text,
    boxSizing: 'border-box',
  })

  const stepperStyle: CSSProperties = {
    width: DIGIT_STEPPER_WIDTH,
    minWidth: DIGIT_STEPPER_WIDTH,
    height: DIGIT_STEPPER_HEIGHT,
    fontSize: '1rem',
    borderRadius: 14,
  }

  const renderTenRod = (key: string, index: number) => (
    <TenRod
      key={key}
      src={mathsCounterIcon}
      counterSize={TEN_COUNTER_SIZE}
      delay={index * 0.04}
      animationName="large-numbers-pop-in"
      borderColor={theme.colors.secondary}
    />
  )

  const renderSingleCounters = (count: number, color: string) => (
    <CounterGroup
      count={count}
      color={color}
      fontFamily={theme.fonts.body}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        gap: DOT_GAP,
        minHeight: 58,
        width: '100%',
      }}
    >
      {(index) => (
        <MathCounter
          key={`single-${index}`}
          src={mathsCounterIcon}
          size={ONE_COUNTER_SIZE}
          delay={index * 0.04}
          animationName="large-numbers-pop-in"
        />
      )}
    </CounterGroup>
  )

  const renderTenRods = (count: number, color: string) => (
    <CounterGroup
      count={count}
      color={color}
      fontFamily={theme.fonts.body}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, max-content)',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: DOT_GAP,
        minHeight: 92,
        width: '100%',
      }}
    >
      {(index) => renderTenRod(`ten-rod-${index}`, index)}
    </CounterGroup>
  )

  const renderRegroupedTen = () => (
    <div
      style={{
        minHeight: 142,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
      aria-hidden="true"
    >
      {userOnesTens > 0 && renderTenRod('ones-regrouped-ten', 0)}
    </div>
  )

  const counterControl = (
    label: string,
    value: number,
    color: string,
    onPrev: () => void,
    onNext: () => void,
    disablePrev: boolean,
    disableNext: boolean,
    counters: ReactNode
  ) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        minWidth: 0,
        borderRadius: 14,
        border: `2px solid ${color}24`,
        background: `${color}10`,
        padding: 8,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 15,
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <StepperButton
          theme={theme}
          direction="prev"
          onClick={onPrev}
          disabled={disablePrev || isCorrect}
          ariaLabel={`Remove one ${label.toLowerCase()}`}
          style={stepperStyle}
        />
        <span
          style={{
            width: 24,
            textAlign: 'center',
            fontFamily: theme.fonts.heading,
            fontSize: 26,
            fontWeight: 900,
            color,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <StepperButton
          theme={theme}
          direction="next"
          onClick={onNext}
          disabled={disableNext || isCorrect}
          ariaLabel={`Add one ${label.toLowerCase()}`}
          style={stepperStyle}
        />
      </div>
      {counters}
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
        @keyframes large-numbers-pop-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes large-numbers-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes large-numbers-slide-in-right {
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
        isEditable={isEditable}
      />

      {isRunning && (
        <ActivityPlayArea
          theme={theme}
          results={resultHistory}
          correctIcon={quizCorrectIcon}
          incorrectIcon={quizIncorrectIcon}
          slideAnimationName="large-numbers-slide-in-right"
          animation={playAnimation}
          shakeKey={isWrong ? `shake-${retryCount}` : undefined}
        >
          <div
            style={{
              width: '100%',
              borderRadius: 18,
              border: `3px dashed ${theme.colors.primary}55`,
              background: theme.colors.surface,
              padding: 12,
              boxSizing: 'border-box',
              boxShadow: `0 8px 18px ${theme.colors.primary}12`,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: PLACE_GRID_COLUMNS,
                gap: 4,
                alignItems: 'stretch',
              }}
            >
              <div />
              <div />
              <div style={digitCellStyle(`${theme.colors.secondary}24`)}>
                {firstDigits.tens}
              </div>
              <div />
              <div style={digitCellStyle(`${theme.colors.primary}24`)}>
                {firstDigits.ones}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: theme.fonts.heading,
                  fontSize: 52,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: theme.colors.primary,
                }}
              >
                +
              </div>
              <div />
              <div style={digitCellStyle(`${theme.colors.secondary}24`)}>
                {secondDigits.tens}
              </div>
              <div />
              <div style={digitCellStyle(`${theme.colors.primary}24`)}>
                {secondDigits.ones}
              </div>

              <div />
              <div />
              <div style={digitCellStyle(`${theme.colors.secondary}14`)}>
                {userOnesTens > 0 ? userOnesTens : ''}
              </div>
              <div />
              <div />
            </div>

            <div
              style={{
                height: 5,
                borderRadius: 999,
                background: theme.colors.text,
                opacity: 0.9,
                margin: '8px 0',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: PLACE_GRID_COLUMNS,
                gap: 4,
                alignItems: 'stretch',
              }}
            >
              <div />
              <div style={digitCellStyle(`${theme.colors.accent}18`, true)}>
                {answerDigits.hundreds === 0 ? '' : answerDigits.hundreds}
              </div>
              <div style={digitCellStyle(`${theme.colors.accent}22`, true)}>
                {answerDigits.tens}
              </div>
              <div />
              <div style={digitCellStyle(`${theme.colors.accent}22`, true)}>
                {answerDigits.ones}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: PLACE_GRID_COLUMNS,
              gap: 8,
              width: '100%',
              alignItems: 'start',
            }}
          >
            <div />
            <div style={{ gridColumn: TENS_COUNTER_COLUMNS }}>
              {counterControl(
                'Tens',
                userTensRods,
                theme.colors.secondary,
                () => adjustTens(-1),
                () => adjustTens(1),
                userTensRods === 0,
                !canAddTen,
                renderTenRods(userTensRods, theme.colors.secondary)
              )}
            </div>
            {renderRegroupedTen()}
            {counterControl(
              'Ones',
              userOnes,
              theme.colors.primary,
              () => adjustOnes(-1),
              () => adjustOnes(1),
              !canRemoveOne,
              !canAddOne,
              renderSingleCounters(userOnes, theme.colors.primary)
            )}
          </div>
        </ActivityPlayArea>
      )}
    </ActivityOutcomeShell>
  )
}

export default LargeNumbersTester
