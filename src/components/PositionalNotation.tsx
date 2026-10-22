import { useCallback, useState } from 'react'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import {
  generateProgressivePositionalNotationProblem,
  getPlaceValueTotal,
  MAX_ONE_CROWN_TENS,
  MAX_TWO_CROWN_DIGIT,
  type PositionalNotationDifficulty,
  type PlaceValueKind,
  type PlaceValues,
} from '../lib/positionalNotationProblems'
import { type ActivityChoreProps } from './ui/ActivityControls'
import CrownDifficultyControl, {
  type CrownDifficultyOption,
} from './ui/CrownDifficultyControl'
import PositionalNotationPlayArea from './ui/PositionalNotationPlayArea'
import MathActivityShell from './ui/MathActivityShell'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'

const EMPTY_VALUES: PlaceValues = {
  hundredThousands: 0,
  tenThousands: 0,
  thousands: 0,
  hundreds: 0,
  tens: 0,
  ones: 0,
}
const POSITIONAL_NOTATION_DIFFICULTIES: CrownDifficultyOption<PositionalNotationDifficulty>[] =
  [
    { value: 'one-crown', label: 'One crown', crowns: 1 },
    { value: 'two-crowns', label: 'Two crowns', crowns: 2 },
    { value: 'three-crowns', label: 'Three crowns: 1–9,999', crowns: 3 },
    { value: 'four-crowns', label: 'Four crowns: 1–999,999', crowns: 4 },
  ]

const PositionalNotation = (props: ActivityChoreProps) => {
  const { theme, isRunning, totalProblems } = props
  const [difficulty, setDifficulty] =
    useState<PositionalNotationDifficulty>('one-crown')
  const [targetNumber, setTargetNumber] = useState(0)
  const [values, setValues] = useState<PlaceValues>(EMPTY_VALUES)
  const { isSeen, markSeen, clearHistory } = useProblemHistory([difficulty])

  const nextProblem = useCallback(
    (nextIndex: number) => {
      const generate = () =>
        generateProgressivePositionalNotationProblem(
          nextIndex,
          totalProblems,
          difficulty
        )
      const problem = pickUnseenProblem(generate, (candidate) =>
        isSeen(candidate.target.toString())
      )
      markSeen(problem.target.toString())
      setTargetNumber(problem.target)
      setValues(EMPTY_VALUES)
    },
    [difficulty, isSeen, markSeen, totalProblems]
  )

  const resetProblem = useCallback(() => {
    clearHistory()
    setTargetNumber(0)
    setValues(EMPTY_VALUES)
  }, [clearHistory])

  const handleDifficultyChange = useCallback(
    (nextDifficulty: PositionalNotationDifficulty) => {
      if (nextDifficulty === difficulty) return
      resetProblem()
      setDifficulty(nextDifficulty)
    },
    [difficulty, resetProblem]
  )

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
    canStart: targetNumber === 0,
    onStart: () => nextProblem(0),
    onReset: resetProblem,
    isAnswerCorrect: getPlaceValueTotal(values) === targetNumber,
    onNextProblem: nextProblem,
  })

  const setPlaceValue = useCallback((kind: PlaceValueKind, value: number) => {
    setValues((current) => ({ ...current, [kind]: value }))
  }, [])

  return (
    <MathActivityShell
      persistence={persistence}
      {...props}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      isSetup={isSetup}
      animationStyles={getActivityFeedbackAnimationStyles('pv')}
      difficultyControl={
        <CrownDifficultyControl
          theme={theme}
          value={difficulty}
          options={POSITIONAL_NOTATION_DIFFICULTIES}
          onChange={handleDifficultyChange}
          ariaLabel="Positional notation difficulty"
          crownSize={16}
        />
      }
    >
      {isRunning && (
        <PositionalNotationPlayArea
          theme={theme}
          targetNumber={targetNumber}
          values={values}
          maxTens={
            difficulty === 'one-crown'
              ? MAX_ONE_CROWN_TENS
              : MAX_TWO_CROWN_DIGIT
          }
          difficulty={difficulty}
          isCorrect={isCorrect}
          isWrong={isWrong}
          retryCount={retryCount}
          results={resultHistory}
          onChange={setPlaceValue}
        />
      )}
    </MathActivityShell>
  )
}

export default PositionalNotation
