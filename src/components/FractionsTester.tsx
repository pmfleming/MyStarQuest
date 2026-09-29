import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import {
  DEFAULT_FRACTION_MAX,
  normalizeFractionMax,
  getFractionChoices,
  fractionLabel,
  getFractionProblem,
  type Fraction,
  type FractionDifficulty,
  type FractionProblem,
} from '../lib/fractionProblems'
import type { ActivityChoreProps } from './ui/ActivityControls'
import StarDisplay from './ui/StarDisplay'
import { getThemeAsset } from '../ui/themeAssets'
import CrownDifficultyControl from './ui/CrownDifficultyControl'
import MathActivityShell from './ui/MathActivityShell'
import MathActivityPlayArea from './ui/MathActivityPlayArea'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'
import FractionFood from './FractionFood'
import {
  getFractionFood,
  type FractionFoodAsset,
} from '../ui/fractionFoodAssets'
import './FractionsTester.css'

function FractionSymbol({ numerator, denominator }: Fraction) {
  return (
    <span
      className="fraction-symbol"
      role="img"
      aria-label={fractionLabel({ numerator, denominator })}
    >
      <span className="fraction-numerator" aria-hidden="true">
        {numerator}
      </span>
      <span className="fraction-denominator" aria-hidden="true">
        {denominator}
      </span>
    </span>
  )
}

type FractionAnswer = {
  selected: number[]
  choice: Fraction | null
  replay: number
  missesBeforeProblem: number
}
const EMPTY_ANSWER: FractionAnswer = {
  selected: [],
  choice: null,
  replay: 0,
  missesBeforeProblem: 0,
}

function FractionResponse({
  problem,
  problemIndex,
  food,
  choices,
  answer: { selected, choice },
  isCorrect,
  isWrong,
  updateAnswer,
}: {
  problem: FractionProblem
  problemIndex: number
  food: FractionFoodAsset
  choices: Fraction[]
  answer: FractionAnswer
  isCorrect: boolean
  isWrong: boolean
  updateAnswer: (patch: Partial<FractionAnswer>) => void
}) {
  const recognising = problem.mode === 'recognise'
  return (
    <div
      className={recognising ? 'fraction-choices' : 'fraction-answer'}
      style={{ animation: isWrong ? 'fractions-shake 0.5s ease' : undefined }}
      role="group"
      aria-label={
        recognising ? 'Choose the matching fraction' : 'Your fraction'
      }
    >
      {recognising ? (
        <>
          {choices.map((fraction) => (
            <button
              type="button"
              key={`${fraction.numerator}/${fraction.denominator}`}
              className="fraction-choice"
              aria-label={fractionLabel(fraction)}
              aria-pressed={
                choice?.numerator === fraction.numerator &&
                choice?.denominator === fraction.denominator
              }
              disabled={isCorrect}
              onClick={() => updateAnswer({ choice: fraction })}
            >
              <FractionSymbol {...fraction} />
            </button>
          ))}
        </>
      ) : (
        <>
          <FractionFood
            key={problemIndex}
            asset={food}
            denominator={problem.denominator}
            selected={selected}
            disabled={isCorrect}
            onToggle={(index) =>
              updateAnswer({
                selected: selected.includes(index)
                  ? selected.filter((piece) => piece !== index)
                  : [...selected, index],
              })
            }
          />
          <div aria-live="polite" aria-atomic="true">
            <FractionSymbol
              numerator={selected.length}
              denominator={problem.denominator}
            />
          </div>
        </>
      )}
    </div>
  )
}

function FractionExample({
  problem,
  food,
  showHint,
  animationKey,
  disabled,
  onReplay,
}: {
  problem: FractionProblem
  food: FractionFoodAsset
  showHint: boolean
  animationKey: string
  disabled: boolean
  onReplay: () => void
}) {
  const recognising = problem.mode === 'recognise'
  const showExample = problem.mode === 'copy' || recognising || showHint
  const showSymbol = !recognising || showHint
  return (
    <div
      className="fraction-target"
      role="group"
      aria-label={
        recognising
          ? 'Match the shaded fraction'
          : `Build ${fractionLabel(problem)}`
      }
    >
      <button
        type="button"
        className="fraction-replay"
        onClick={onReplay}
        disabled={disabled}
        aria-label="Replay fraction example"
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />
        </svg>
      </button>
      <div className="fraction-demonstration" key={animationKey}>
        {showSymbol && (
          <div
            className={
              showExample && !recognising ? 'fraction-demo-symbol' : ''
            }
          >
            <FractionSymbol {...problem} />
          </div>
        )}
        {showExample && (
          <FractionFood
            asset={food}
            denominator={problem.denominator}
            selected={Array.from(
              { length: problem.numerator },
              (_, index) => index
            )}
            foodOnly={!recognising}
            animate={!recognising || showHint}
            label={`Example: ${fractionLabel(problem)}`}
          />
        )}
      </div>
    </div>
  )
}

export type FractionsTesterProps = ActivityChoreProps & {
  maxDenominator?: number
  onMaxDenominatorChange?: (value: number) => void | Promise<void>
}

export default function FractionsTester(props: FractionsTesterProps) {
  const { theme, isRunning } = props
  const [localMaximum, setLocalMaximum] = useState(DEFAULT_FRACTION_MAX)
  const maximum = normalizeFractionMax(props.maxDenominator ?? localMaximum)
  const changeMaximum = (next: number) => {
    const value = normalizeFractionMax(next)
    if (props.onMaxDenominatorChange) return props.onMaxDenominatorChange(value)
    setLocalMaximum(value)
  }
  const [roundMaximum, setRoundMaximum] = useState(maximum)
  const [difficulty, setDifficulty] = useState<FractionDifficulty>('guided')
  const [started, setStarted] = useState(false)
  const [answer, setAnswer] = useState(EMPTY_ANSWER)
  const { selected, choice, replay, missesBeforeProblem } = answer
  const updateAnswer = (patch: Partial<FractionAnswer>) =>
    setAnswer((current) => ({ ...current, ...patch }))

  const resetProblem = useCallback(() => {
    setStarted(false)
    setAnswer(EMPTY_ANSWER)
  }, [])
  const start = useCallback(() => {
    setRoundMaximum(maximum)
    setStarted(true)
  }, [maximum])
  const challenge = useActivityChallenge({
    ...props,
    // This is a teaching activity: mistakes always lead to another attempt.
    failureModeEnabled: false,
    canStart: !started,
    onStart: start,
    onReset: resetProblem,
  })
  const {
    problemIndex,
    retryCount,
    resultHistory,
    isSetup,
    isFinished,
    isSuccessState,
    persistence,
    isCorrect,
    isWrong,
    consumeCheckTrigger,
    resetFeedback,
  } = challenge
  const problem = getFractionProblem(problemIndex, difficulty, roundMaximum)
  const recognising = problem.mode === 'recognise'
  const food = getFractionFood(theme.id, problemIndex, recognising)
  const showHint = replay > 0 || retryCount - missesBeforeProblem >= 2
  const correct = recognising
    ? choice !== null &&
      choice.numerator * problem.denominator ===
        problem.numerator * choice.denominator
    : selected.length === problem.numerator

  const advance = useCallback(() => {
    setAnswer({ ...EMPTY_ANSWER, missesBeforeProblem: retryCount })
    resetFeedback()
  }, [retryCount, resetFeedback])

  useEffect(() => {
    consumeCheckTrigger(correct, advance)
  }, [consumeCheckTrigger, correct, advance])

  const style: CSSProperties & Record<`--fraction-${string}`, string> = {
    '--fraction-ink': theme.colors.text,
    '--fraction-colour': theme.colors.primary,
    '--fraction-paper': theme.colors.surface,
    '--fraction-tint': `${theme.colors.primary}12`,
    fontFamily: theme.fonts.heading,
    width: '100%',
  }

  return (
    <div className="fractions-activity" style={style}>
      <MathActivityShell
        {...props}
        persistence={persistence}
        isFinished={isFinished}
        isSuccessState={isSuccessState}
        isSetup={isSetup}
        animationStyles={getActivityFeedbackAnimationStyles('fractions')}
        difficultyControl={
          <>
            <CrownDifficultyControl
              theme={theme}
              value={difficulty}
              options={[
                { value: 'guided', label: 'Build fractions', crowns: 1 },
                { value: 'recognise', label: 'Recognise fractions', crowns: 2 },
                {
                  value: 'advanced',
                  label: 'Fractions with several pieces',
                  crowns: 3,
                },
              ]}
              onChange={setDifficulty}
              ariaLabel="Fraction activity"
            />
            <div
              className="fraction-limit"
              role="group"
              aria-label="Maximum denominator"
            >
              <StarDisplay
                theme={theme}
                count={maximum}
                iconSrc={getThemeAsset(theme.id, 'difficultyIcon')}
                valueLabel={`Maximum denominator: ${maximum}`}
                decreaseLabel="Decrease maximum denominator"
                increaseLabel="Increase maximum denominator"
                editable={props.isEditable !== false}
                onChange={changeMaximum}
                min={2}
                max={9}
              />
            </div>
          </>
        }
      >
        {isRunning && (
          <MathActivityPlayArea
            theme={theme}
            results={resultHistory}
            animationPrefix="fractions"
            isCorrect={isCorrect}
            isWrong={false}
            retryCount={retryCount}
          >
            <FractionExample
              problem={problem}
              food={food}
              showHint={showHint}
              animationKey={`${problemIndex}-${replay}-${showHint}`}
              disabled={isCorrect}
              onReplay={() => updateAnswer({ replay: replay + 1 })}
            />
            <svg
              className="fraction-down"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M12 3v16m-6-6 6 6 6-6" />
            </svg>
            <FractionResponse
              problem={problem}
              problemIndex={problemIndex}
              food={food}
              choices={getFractionChoices(problem, roundMaximum)}
              answer={answer}
              isCorrect={isCorrect}
              isWrong={isWrong}
              updateAnswer={updateAnswer}
            />
            <span className="fraction-sr-only" role="status">
              {isCorrect
                ? 'Correct!'
                : isWrong
                  ? 'Try again. You can replay the example.'
                  : ''}
            </span>
          </MathActivityPlayArea>
        )}
      </MathActivityShell>
    </div>
  )
}
