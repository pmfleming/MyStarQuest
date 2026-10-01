import { useCallback, useState, type CSSProperties } from 'react'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import {
  DEFAULT_FRACTION_MAX,
  normalizeFractionMax,
  getFractionChoices,
  simplifyFraction,
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
import {
  getActivityFeedbackAnimationStyles,
  getChoiceFeedbackAnimationStyles,
} from './ui/activityAnimationStyles'
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

const fractionKey = ({ numerator, denominator }: Fraction) =>
  `${numerator}/${denominator}`

type FractionAnswer = {
  dismissedChoices: string[]
  choice: Fraction | null
  replay: number
  missesBeforeProblem: number
}
const EMPTY_ANSWER: FractionAnswer = {
  dismissedChoices: [],
  choice: null,
  replay: 0,
  missesBeforeProblem: 0,
}

function FractionResponse({
  problem,
  choices,
  choice,
  dismissedChoices,
  isCorrect,
  isWrong,
  onChoice,
}: {
  problem: FractionProblem
  choices: Fraction[]
  choice: Fraction | null
  dismissedChoices: string[]
  isCorrect: boolean
  isWrong: boolean
  onChoice: (choice: Fraction) => void
}) {
  return (
    <div
      className="fraction-choices"
      role="group"
      aria-label={
        problem.mode === 'simplify'
          ? 'Choose the simplified fraction'
          : 'Choose the matching fraction'
      }
    >
      {choices
        .filter(
          (fraction) =>
            !dismissedChoices.includes(fractionKey(fraction)) ||
            (isWrong &&
              choice !== null &&
              fractionKey(fraction) === fractionKey(choice))
        )
        .map((fraction) => (
          <button
            type="button"
            key={fractionKey(fraction)}
            className={`fraction-choice ${choice !== null && fractionKey(fraction) === fractionKey(choice) ? (isWrong ? 'is-leaving' : isCorrect ? 'is-correct' : '') : ''}`}
            aria-label={fractionLabel(fraction)}
            aria-pressed={
              choice?.numerator === fraction.numerator &&
              choice?.denominator === fraction.denominator
            }
            disabled={isCorrect || isWrong}
            onClick={() => onChoice(fraction)}
          >
            <FractionSymbol {...fraction} />
          </button>
        ))}
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
  return (
    <div
      className="fraction-target"
      role="group"
      aria-label="Match the shaded fraction"
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
        {showHint && (
          <FractionSymbol
            {...(problem.mode === 'simplify'
              ? simplifyFraction(problem)
              : problem)}
          />
        )}
        <FractionFood
          asset={food}
          denominator={problem.denominator}
          selected={Array.from(
            { length: problem.numerator },
            (_, index) => index
          )}
          animate={showHint}
          label={`Example: ${fractionLabel(problem)}`}
        />
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
  const [difficulty, setDifficulty] = useState<FractionDifficulty>('advanced')
  const [started, setStarted] = useState(false)
  const [answer, setAnswer] = useState(EMPTY_ANSWER)
  const { choice, dismissedChoices, replay, missesBeforeProblem } = answer
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
    submitAnswer,
    resetFeedback,
  } = challenge
  const problem = getFractionProblem(problemIndex, difficulty, roundMaximum)
  const food = getFractionFood(theme.id, problemIndex, true)
  const showHint = replay > 0 || retryCount - missesBeforeProblem >= 2

  const advance = useCallback(() => {
    setAnswer({ ...EMPTY_ANSWER, missesBeforeProblem: retryCount })
    resetFeedback()
  }, [retryCount, resetFeedback])

  const handleChoice = (fraction: Fraction) => {
    if (
      !isRunning ||
      isFinished ||
      isCorrect ||
      isWrong ||
      dismissedChoices.includes(fractionKey(fraction))
    )
      return
    const correct =
      fraction.numerator * problem.denominator ===
      problem.numerator * fraction.denominator
    updateAnswer({
      choice: fraction,
      dismissedChoices: correct
        ? dismissedChoices
        : [...dismissedChoices, fractionKey(fraction)],
    })
    submitAnswer(correct, advance)
  }

  const style: CSSProperties & Record<`--fraction-${string}`, string> = {
    '--fraction-ink': theme.colors.text,
    '--fraction-colour': theme.colors.primary,
    '--fraction-paper': theme.colors.surface,
    '--fraction-accent': theme.colors.accent,
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
        animationStyles={
          getActivityFeedbackAnimationStyles('fractions') +
          getChoiceFeedbackAnimationStyles('fractions')
        }
        difficultyControl={
          <>
            <CrownDifficultyControl
              theme={theme}
              value={difficulty}
              options={[
                {
                  value: 'advanced',
                  label: 'Fractions with several pieces',
                  crowns: 1,
                },
                {
                  value: 'simplify',
                  label: 'Simplify fractions',
                  crowns: 2,
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
              choices={getFractionChoices(problem)}
              choice={choice}
              dismissedChoices={dismissedChoices}
              isCorrect={isCorrect}
              isWrong={isWrong}
              onChoice={handleChoice}
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
