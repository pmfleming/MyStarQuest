import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import {
  FRACTION_CHOICES,
  fractionLabel,
  getFractionProblem,
  type Fraction,
  type FractionDifficulty,
} from '../lib/fractionProblems'
import type { ActivityChoreProps } from './ui/ActivityControls'
import CrownDifficultyControl from './ui/CrownDifficultyControl'
import MathActivityShell from './ui/MathActivityShell'
import MathActivityPlayArea from './ui/MathActivityPlayArea'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'
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

function ExampleBar({
  numerator,
  denominator,
  animate,
}: Fraction & { animate: boolean }) {
  return (
    <div
      className={`fraction-bar fraction-example ${animate ? 'fraction-demo' : ''}`}
      role="img"
      aria-label={`Example: ${fractionLabel({ numerator, denominator })}`}
    >
      {Array.from({ length: denominator }, (_, index) => (
        <span className="fraction-piece" key={index}>
          {index < numerator && (
            <span className="fraction-fill">
              <span>✓</span>
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

export default function FractionsTester(props: ActivityChoreProps) {
  const { theme, isRunning } = props
  const [difficulty, setDifficulty] = useState<FractionDifficulty>('guided')
  const [started, setStarted] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [choice, setChoice] = useState<Fraction | null>(null)
  const [replay, setReplay] = useState(0)
  const [hintRequested, setHintRequested] = useState(false)
  const [missesBeforeProblem, setMissesBeforeProblem] = useState(0)

  const resetProblem = useCallback(() => {
    setStarted(false)
    setSelected([])
    setChoice(null)
    setReplay(0)
    setHintRequested(false)
    setMissesBeforeProblem(0)
  }, [])
  const start = useCallback(() => setStarted(true), [])
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
  const problem = getFractionProblem(problemIndex, difficulty)
  const recognising = problem.mode === 'recognise'
  const showHint = hintRequested || retryCount - missesBeforeProblem >= 2
  const showExample = problem.mode === 'copy' || recognising || showHint
  const showSymbol = !recognising || showHint
  const correct = recognising
    ? choice !== null &&
      choice.numerator * problem.denominator ===
        problem.numerator * choice.denominator
    : selected.length === problem.numerator

  const advance = useCallback(() => {
    setSelected([])
    setChoice(null)
    setReplay(0)
    setHintRequested(false)
    setMissesBeforeProblem(retryCount)
    resetFeedback()
  }, [retryCount, resetFeedback])

  useEffect(() => {
    consumeCheckTrigger(correct, advance)
  }, [consumeCheckTrigger, correct, advance])

  const replayExample = () => {
    setHintRequested(true)
    setReplay((value) => value + 1)
  }
  const style = {
    '--fraction-ink': theme.colors.text,
    '--fraction-colour': theme.colors.primary,
    '--fraction-paper': theme.colors.surface,
    '--fraction-tint': `${theme.colors.primary}12`,
    fontFamily: theme.fonts.heading,
    width: '100%',
  } as CSSProperties

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
          <CrownDifficultyControl
            theme={theme}
            value={difficulty}
            options={[
              { value: 'guided', label: 'Build fractions', crowns: 1 },
              { value: 'recognise', label: 'Recognise fractions', crowns: 2 },
            ]}
            onChange={setDifficulty}
            ariaLabel="Fraction activity"
          />
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
                onClick={replayExample}
                disabled={isCorrect}
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
              <div
                className="fraction-demonstration"
                key={`${problemIndex}-${replay}-${showHint}`}
              >
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
                  <ExampleBar {...problem} animate={!recognising || showHint} />
                )}
              </div>
            </div>
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
            {recognising ? (
              <div
                className="fraction-choices"
                style={{
                  animation: isWrong ? 'fractions-shake 0.5s ease' : undefined,
                }}
                role="group"
                aria-label="Choose the matching fraction"
              >
                {FRACTION_CHOICES.map((fraction) => (
                  <button
                    type="button"
                    key={`${fraction.numerator}/${fraction.denominator}`}
                    className="fraction-choice"
                    aria-label={fractionLabel(fraction)}
                    aria-pressed={choice === fraction}
                    disabled={isCorrect}
                    onClick={() => setChoice(fraction)}
                  >
                    <FractionSymbol {...fraction} />
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="fraction-answer"
                style={{
                  animation: isWrong ? 'fractions-shake 0.5s ease' : undefined,
                }}
                role="group"
                aria-label="Your fraction"
              >
                <div
                  className="fraction-bar"
                  role="group"
                  aria-label={`${problem.denominator} equal pieces; tap to colour`}
                >
                  {Array.from({ length: problem.denominator }, (_, index) => (
                    <button
                      type="button"
                      className="fraction-piece"
                      key={`${problemIndex}-${index}`}
                      aria-label={`Piece ${index + 1} of ${problem.denominator}`}
                      aria-pressed={selected.includes(index)}
                      disabled={isCorrect}
                      onClick={() =>
                        setSelected((current) =>
                          current.includes(index)
                            ? current.filter((piece) => piece !== index)
                            : [...current, index]
                        )
                      }
                    >
                      {selected.includes(index) && (
                        <span className="fraction-fill">
                          <span aria-hidden="true">✓</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div aria-live="polite" aria-atomic="true">
                  <FractionSymbol
                    numerator={selected.length}
                    denominator={problem.denominator}
                  />
                </div>
              </div>
            )}
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
