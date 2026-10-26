import {
  Fragment,
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import {
  generateLargeNumbersProblem,
  type LargeNumbersDifficulty,
  type LargeNumbersProblem,
  type OperationMode,
} from '../lib/largeNumbersProblems'
import {
  getPlaceValueTotal,
  type PlaceValues,
} from '../lib/positionalNotationProblems'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import { uiTokens } from '../tokens'
import { getThemeAsset } from '../ui/themeAssets'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'
import { type ActivityChoreProps } from './ui/ActivityControls'
import { CounterGroup, MathCounter, TenRod } from './ui/ActivityMathCounters'
import MathActivityPlayArea from './ui/MathActivityPlayArea'
import LargeNumbersExpandedAnswer from './ui/LargeNumbersExpandedAnswer'
import MathActivityShell from './ui/MathActivityShell'
import { NumberStepper } from './ui/StepperButton'
import CrownDifficultyControl, {
  type CrownDifficultyOption,
} from './ui/CrownDifficultyControl'
import SegmentedChoiceControl, {
  type SegmentedChoiceOption,
} from './ui/SegmentedChoiceControl'

const MAX_SUM = 99
const MAX_ONES_TENS = 1
const MAX_TENS_RODS = 10
const PLACE_GRID_COLUMNS = '44px 40px minmax(82px, 1fr) 42px minmax(82px, 1fr)'
const placeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: PLACE_GRID_COLUMNS,
  gap: 4,
  alignItems: 'stretch',
}
const TENS_COUNTER_COLUMNS = '2 / 4'
const DIGIT_STEPPER_WIDTH = 30
const DIGIT_STEPPER_HEIGHT = 40
const DIGIT_FONT_SIZE = 54
const ANSWER_DIGIT_FONT_SIZE = 50
const TEN_COUNTER_SIZE = 10
const ONE_COUNTER_SIZE = 24

const { mathCounterGap: DOT_GAP } = uiTokens.activityTokens

const OPERATION_OPTIONS: SegmentedChoiceOption<OperationMode>[] = [
  { value: 'addition', label: 'Addition only', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction only', symbol: '−' },
  { value: 'both', label: 'Addition and subtraction', symbol: '+ / −' },
]

const DIFFICULTY_OPTIONS: CrownDifficultyOption<LargeNumbersDifficulty>[] = [
  { value: 'easy', label: 'Easy', crowns: 1 },
  { value: 'hard', label: 'Hard', crowns: 2 },
  { value: 'three-crowns', label: 'Three crowns: 1–9,999', crowns: 3 },
  { value: 'four-crowns', label: 'Four crowns: 1–999,999', crowns: 4 },
]

const EMPTY_PROBLEM: LargeNumbersProblem = { a: 0, b: 0, operation: '+' }
const EMPTY_VALUES: PlaceValues = {
  hundredThousands: 0,
  tenThousands: 0,
  thousands: 0,
  hundreds: 0,
  tens: 0,
  ones: 0,
}

type OnesAnswerState = {
  ones: number
  onesTens: number
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
  const step = delta > 0 ? 1 : -1
  const regroupedOnes = onesTens * 10 + ones + step
  if (
    regroupedOnes < 0 ||
    regroupedOnes > MAX_ONES_TENS * 10 + 9 ||
    (step > 0 && currentAnswer >= MAX_SUM)
  )
    return null

  return { ones: regroupedOnes % 10, onesTens: Math.floor(regroupedOnes / 10) }
}

const LargeNumbersTester = (props: ActivityChoreProps) => {
  const { theme, isRunning, totalProblems } = props
  const [operationMode, setOperationMode] = useState<OperationMode>('addition')
  const [difficulty, setDifficulty] = useState<LargeNumbersDifficulty>('hard')
  const [values, setValues] = useState<PlaceValues>(EMPTY_VALUES)
  const expandedDifficulty =
    difficulty === 'three-crowns' || difficulty === 'four-crowns'
      ? difficulty
      : null
  const [{ a: operandA, b: operandB, operation }, setProblem] =
    useState(EMPTY_PROBLEM)
  const [userTensRods, setUserTensRods] = useState(0)
  const [onesState, setOnesState] = useState({ ones: 0, onesTens: 0 })
  const { ones: userOnes, onesTens: userOnesTens } = onesState
  const { isSeen, markSeen, clearHistory } = useProblemHistory([
    difficulty,
    operationMode,
  ])

  const expectedAnswer =
    operation === '+' ? operandA + operandB : operandA - operandB
  const firstDigits = getDigits(operandA)
  const secondDigits = getDigits(operandB)
  const currentAnswer = expandedDifficulty
    ? getPlaceValueTotal(values)
    : (userTensRods + userOnesTens) * 10 + userOnes
  const answerDigits = getDigits(currentAnswer)

  const nextProblem = useCallback(
    (nextIndex: number) => {
      const problem = pickUnseenProblem(
        () =>
          generateLargeNumbersProblem(
            operationMode,
            difficulty,
            nextIndex,
            totalProblems
          ),
        (candidate) => isSeen(getProblemKey(candidate))
      )
      markSeen(getProblemKey(problem))

      setProblem(problem)
      setUserTensRods(0)
      setOnesState({ ones: 0, onesTens: 0 })
      setValues(EMPTY_VALUES)
    },
    [isSeen, markSeen, operationMode, difficulty, totalProblems]
  )

  const resetProblem = useCallback(() => {
    clearHistory()
    setProblem(EMPTY_PROBLEM)
    setUserTensRods(0)
    setOnesState({ ones: 0, onesTens: 0 })
    setValues(EMPTY_VALUES)
  }, [clearHistory])

  const {
    retryCount,
    resultHistory,
    isSetup,
    isFinished,
    isSuccessState,
    persistence,
    isCorrect,
    isWrong,
  } = useCheckedActivityChallenge({
    ...props,
    canStart: operandA === 0,
    onStart: () => nextProblem(0),
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
      <NumberStepper
        theme={theme}
        value={value}
        disabled={isCorrect}
        decrease={{
          onClick: onPrev,
          disabled: disablePrev,
          ariaLabel: `Remove one ${label.toLowerCase()}`,
        }}
        increase={{
          onClick: onNext,
          disabled: disableNext,
          ariaLabel: `Add one ${label.toLowerCase()}`,
        }}
        style={{ justifyContent: 'center', gap: 4 }}
        buttonStyle={stepperStyle}
        valueStyle={{
          width: 24,
          fontSize: 26,
          fontWeight: 900,
          color,
          lineHeight: 1,
        }}
      />
      {counters}
    </div>
  )

  return (
    <MathActivityShell
      persistence={persistence}
      {...props}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      isSetup={isSetup}
      animationStyles={
        getActivityFeedbackAnimationStyles('large-numbers') +
        getActivityFeedbackAnimationStyles('pv')
      }
      difficultyControl={
        <>
          <CrownDifficultyControl
            theme={theme}
            value={difficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={(nextDifficulty) => {
              if (nextDifficulty === difficulty) return
              resetProblem()
              setDifficulty(nextDifficulty)
            }}
            ariaLabel="Large numbers difficulty"
            crownSize={16}
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
          resultBarStyle={expandedDifficulty ? { height: 24 } : undefined}
        >
          {expandedDifficulty ? (
            <LargeNumbersExpandedAnswer
              theme={theme}
              problem={{ a: operandA, b: operandB, operation }}
              difficulty={expandedDifficulty}
              values={values}
              isCorrect={isCorrect}
              onChange={(kind, value) =>
                setValues((current) => ({ ...current, [kind]: value }))
              }
            />
          ) : (
            <>
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
                <div style={placeGridStyle}>
                  {[
                    { digits: firstDigits, symbol: '' },
                    {
                      digits: secondDigits,
                      symbol: operation === '+' ? '+' : '−',
                    },
                  ].map(({ digits, symbol }, index) => (
                    <Fragment key={index}>
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
                        {symbol}
                      </div>

                      <div />
                      <div
                        style={digitCellStyle(`${theme.colors.secondary}24`)}
                      >
                        {digits.tens}
                      </div>
                      <div />
                      <div style={digitCellStyle(`${theme.colors.primary}24`)}>
                        {digits.ones}
                      </div>
                    </Fragment>
                  ))}
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

                <div style={placeGridStyle}>
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
            </>
          )}
        </MathActivityPlayArea>
      )}
    </MathActivityShell>
  )
}

export default LargeNumbersTester
