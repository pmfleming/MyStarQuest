import { useCallback, useState } from 'react'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import {
  generateProgressivePositionalNotationProblem,
  MAX_ONE_CROWN_TENS,
  MAX_TWO_CROWN_DIGIT,
  type PositionalNotationDifficulty,
} from '../lib/positionalNotationProblems'
import { type ActivityChoreProps } from './ui/ActivityControls'
import CrownDifficultyControl, {
  type CrownDifficultyOption,
} from './ui/CrownDifficultyControl'
import PositionalNotationPlayArea, {
  type PlaceValueKind,
  type PlaceValues,
} from './ui/PositionalNotationPlayArea'
import MathActivityShell from './ui/MathActivityShell'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'

const EMPTY_VALUES: PlaceValues = { hundreds: 0, tens: 0, ones: 0 }
const POSITIONAL_NOTATION_DIFFICULTIES: CrownDifficultyOption<PositionalNotationDifficulty>[] =
  [
    { value: 'one-crown', label: 'One crown', crowns: 1 },
    { value: 'two-crowns', label: 'Two crowns', crowns: 2 },
  ]

const getTotal = ({ hundreds, tens, ones }: PlaceValues) =>
  hundreds * 100 + tens * 10 + ones

export type PositionalNotationProps = ActivityChoreProps

const PositionalNotation = ({
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
}: PositionalNotationProps) => {
  const [difficulty, setDifficulty] =
    useState<PositionalNotationDifficulty>('one-crown')
  const [targetNumber, setTargetNumber] = useState(0)
  const [values, setValues] = useState<PlaceValues>(EMPTY_VALUES)
  const { isSeen, markSeen, clearHistory } = useProblemHistory([difficulty])
  const isTwoCrown = difficulty === 'two-crowns'

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
    isCorrect,
    isWrong,
  } = useCheckedActivityChallenge({
    isRunning,
    isCompleted,
    isFailed,
    totalProblems,
    checkTrigger,
    canStart: targetNumber === 0,
    onStart: () => nextProblem(0),
    onReset: resetProblem,
    onComplete,
    onFail,
    failureModeEnabled,
    isAnswerCorrect: getTotal(values) === targetNumber,
    onNextProblem: nextProblem,
  })

  const setPlaceValue = useCallback((kind: PlaceValueKind, value: number) => {
    setValues((current) => ({ ...current, [kind]: value }))
  }, [])

  return (
    <MathActivityShell
      theme={theme}
      totalProblems={totalProblems}
      starReward={starReward}
      isEditable={isEditable}
      onAdjustProblems={onAdjustProblems}
      onStarsChange={onStarsChange}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      isSetup={isSetup}
      animationStyles={getActivityFeedbackAnimationStyles('pv')}
      difficultyControl={
        <CrownDifficultyControl
          theme={theme}
          value={difficulty}
          options={POSITIONAL_NOTATION_DIFFICULTIES}
          onChange={handleDifficultyChange}
          ariaLabel="Positional notation difficulty"
        />
      }
    >
      {isRunning && (
        <PositionalNotationPlayArea
          theme={theme}
          targetNumber={targetNumber}
          values={values}
          maxTens={isTwoCrown ? MAX_TWO_CROWN_DIGIT : MAX_ONE_CROWN_TENS}
          isTwoCrown={isTwoCrown}
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
