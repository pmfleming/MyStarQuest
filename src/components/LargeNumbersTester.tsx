import {
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import type { MathDifficulty } from '../data/types'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import { uiTokens } from '../tokens'
import { getThemeAsset } from '../ui/themeAssets'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'
import { type ActivityChoreProps } from './ui/ActivityControls'
import { CounterGroup, MathCounter, TenRod } from './ui/ActivityMathCounters'
import MathActivityPlayArea from './ui/MathActivityPlayArea'
import MathActivityShell from './ui/MathActivityShell'
import StepperButton from './ui/StepperButton'
import CrownDifficultyControl, {
  type CrownDifficultyOption,
} from './ui/CrownDifficultyControl'
import SegmentedChoiceControl, {
  type SegmentedChoiceOption,
} from './ui/SegmentedChoiceControl'

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
  operation: '+' | '-'
}

type OperationMode = 'addition' | 'subtraction' | 'both'

const OPERATION_OPTIONS: SegmentedChoiceOption<OperationMode>[] = [
  { value: 'addition', label: 'Addition only', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction only', symbol: '−' },
  { value: 'both', label: 'Addition and subtraction', symbol: '+ / −' },
]

const DIFFICULTY_OPTIONS: CrownDifficultyOption<MathDifficulty>[] = [
  { value: 'easy', label: 'Easy', crowns: 1 },
  { value: 'hard', label: 'Hard', crowns: 2 },
]

const EMPTY_PROBLEM: LargeNumbersProblem = { a: 0, b: 0, operation: '+' }

type OnesAnswerState = {
  ones: number
  onesTens: number
}

function generateAddends(difficulty: MathDifficulty) {
  if (difficulty === 'easy') {
    const choice = Math.floor(Math.random() * 18)
    const b = choice < 9 ? choice + 1 : (choice - 8) * 10
    const a = Math.floor(Math.random() * (MAX_SUM - b)) + 1
    return { a, b }
  }
  const a =
    Math.floor(Math.random() * (MAX_FIRST_ADDEND - MIN_ADDEND + 1)) + MIN_ADDEND
  const maxB = MAX_SUM - a
  const b = Math.floor(Math.random() * (maxB - MIN_ADDEND + 1)) + MIN_ADDEND
  return Math.random() > 0.5 ? { a, b } : { a: b, b: a }
}

function generateLargeNumbersProblem(
  mode: OperationMode,
  difficulty: MathDifficulty
): LargeNumbersProblem {
  const { a, b } = generateAddends(difficulty)
  const subtract =
    mode === 'subtraction' || (mode === 'both' && Math.random() < 0.5)
  if (subtract) return { a: a + b, b, operation: '-' }
  return { a, b, operation: '+' }
}

function getProblemKey(problem: LargeNumbersProblem): string {
  return `${problem.a}${problem.operation}${problem.b}`
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

const LargeNumbersTester = (props: LargeNumbersTesterProps) => {
  const { theme, isRunning } = props
  const [operationMode, setOperationMode] = useState<OperationMode>('addition')
  const [difficulty, setDifficulty] = useState<MathDifficulty>('hard')
  const [{ a: operandA, b: operandB, operation }, setProblem] =
    useState(EMPTY_PROBLEM)
  const [userTensRods, setUserTensRods] = useState(0)
  const [onesState, setOnesState] = useState({ ones: 0, onesTens: 0 })
  const { ones: userOnes, onesTens: userOnesTens } = onesState
  const { isSeen, markSeen, clearHistory } = useProblemHistory()

  const expectedAnswer =
    operation === '+' ? operandA + operandB : operandA - operandB
  const firstDigits = getDigits(operandA)
  const secondDigits = getDigits(operandB)
  const currentAnswer = (userTensRods + userOnesTens) * 10 + userOnes
  const answerDigits = getDigits(currentAnswer)

  const nextProblem = useCallback(() => {
    const problem = pickUnseenProblem(
      () => generateLargeNumbersProblem(operationMode, difficulty),
      (candidate) => isSeen(getProblemKey(candidate))
    )
    markSeen(getProblemKey(problem))

    setProblem(problem)
    setUserTensRods(0)
    setOnesState({ ones: 0, onesTens: 0 })
  }, [isSeen, markSeen, operationMode, difficulty])

  const resetProblem = useCallback(() => {
    clearHistory()
    setProblem(EMPTY_PROBLEM)
    setUserTensRods(0)
    setOnesState({ ones: 0, onesTens: 0 })
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
    canStart: operandA === 0,
    onStart: nextProblem,
    onReset: resetProblem,
    isAnswerCorrect: currentAnswer === expectedAnswer,
    onNextProblem: nextProblem,
  })

  const adjustOnes = (delta: number) => {
    const nextState = getAdjustedOnesState(onesState, delta, currentAnswer)

    if (!nextState) return

    setOnesState(nextState)
  }

  const canAddOne = getAdjustedOnesState(onesState, 1, currentAnswer) !== null
  const canRemoveOne =
    getAdjustedOnesState(onesState, -1, currentAnswer) !== null

  const canAddTen = currentAnswer + 10 <= MAX_SUM

  const adjustTens = (delta: number) => {
    if (delta > 0 && !canAddTen) return
    setUserTensRods((value) => clamp(value + delta, 0, MAX_TENS_RODS))
  }

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
      src={getThemeAsset(theme.id, 'mathsCounter')}
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
          src={getThemeAsset(theme.id, 'mathsCounter')}
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
    <MathActivityShell
      {...props}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      isSetup={isSetup}
      animationStyles={getActivityFeedbackAnimationStyles('large-numbers')}
      difficultyControl={
        <>
          <CrownDifficultyControl
            theme={theme}
            value={difficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={setDifficulty}
            ariaLabel="Large numbers difficulty"
          />
          <SegmentedChoiceControl
            theme={theme}
            value={operationMode}
            options={OPERATION_OPTIONS}
            onChange={setOperationMode}
            ariaLabel="Math operations"
            showSymbolLabels={false}
          />
        </>
      }
    >
      {isRunning && (
        <MathActivityPlayArea
          theme={theme}
          results={resultHistory}
          animationPrefix="large-numbers"
          isCorrect={isCorrect}
          isWrong={isWrong}
          retryCount={retryCount}
        >
          <div
            role="group"
            aria-label={`${operandA} ${operation === '+' ? 'plus' : 'minus'} ${operandB}`}
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
                {operation === '+' ? '+' : '−'}
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
        </MathActivityPlayArea>
      )}
    </MathActivityShell>
  )
}

export default LargeNumbersTester
