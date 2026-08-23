import { useState, useEffect, useCallback } from 'react'
import StepperButton from './ui/StepperButton'
import { uiTokens } from '../tokens'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import mathsCounterIcon from '../assets/themes/princess/maths-counter.svg'
import { useProblemHistory } from '../lib/useProblemHistory'
import {
  generateProgressivePositionalNotationProblem,
  MAX_ONE_CROWN_TENS,
  MAX_TWO_CROWN_DIGIT,
  type PositionalNotationDifficulty,
} from '../lib/positionalNotationProblems'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
} from './ui/ActivityControls'
import {
  EmptyCounterHint,
  MathCounter,
  TenRod,
} from './ui/ActivityMathCounters'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const MAX_POSITIONAL_NOTATION_ONES = 9
const PLACE_VALUE_PANEL_GAP = 2
const PLACE_VALUE_PLUS_SIZE = 42
const PLACE_VALUE_TENS_STEPPER_WIDTH = 40
const PLACE_VALUE_ONES_STEPPER_WIDTH = 30
const PLACE_VALUE_STEPPER_HEIGHT = 44
const PLACE_VALUE_TENS_COLUMNS = 6
const PLACE_VALUE_TENS_PANEL_SPLIT = '1.7fr 1.3fr'
const PLACE_VALUE_PLUS_LEFT = '56.66%'

const POSITIONAL_NOTATION_DIFFICULTIES: PositionalNotationDifficulty[] = [
  'one-crown',
  'two-crowns',
]

const { mathCounterSize: ONE_COUNTER_SIZE, mathCounterGap: DOT_GAP } =
  uiTokens.activityTokens

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
  const [userHundreds, setUserHundreds] = useState(0)
  const [userTens, setUserTens] = useState(0)
  const [userOnes, setUserOnes] = useState(0)
  const { isSeen, markSeen, clearHistory } = useProblemHistory([difficulty])
  const isTwoCrown = difficulty === 'two-crowns'
  const maxTens = isTwoCrown ? MAX_TWO_CROWN_DIGIT : MAX_ONE_CROWN_TENS
  const currentTotal = userHundreds * 100 + userTens * 10 + userOnes

  const nextProblem = useCallback(
    (nextIndex: number) => {
      let problem = generateProgressivePositionalNotationProblem(
        nextIndex,
        totalProblems,
        difficulty
      )
      let attempts = 0
      while (isSeen(problem.target.toString()) && attempts < 10) {
        problem = generateProgressivePositionalNotationProblem(
          nextIndex,
          totalProblems,
          difficulty
        )
        attempts++
      }
      markSeen(problem.target.toString())

      setTargetNumber(problem.target)
      setUserHundreds(0)
      setUserTens(0)
      setUserOnes(0)
    },
    [difficulty, totalProblems, isSeen, markSeen]
  )

  const resetProblem = useCallback(() => {
    clearHistory()
    setTargetNumber(0)
    setUserHundreds(0)
    setUserTens(0)
    setUserOnes(0)
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
    consumeCheckTrigger,
    resetFeedback,
  } = useActivityChallenge({
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
  })

  const handleNextProblem = useCallback(
    (nextIndex: number) => {
      resetFeedback()
      nextProblem(nextIndex)
    },
    [nextProblem, resetFeedback]
  )

  useEffect(() => {
    consumeCheckTrigger(currentTotal === targetNumber, handleNextProblem)
  }, [consumeCheckTrigger, currentTotal, handleNextProblem, targetNumber])

  const TEN_COUNTER_SIZE = isTwoCrown ? 5 : 12
  const ONE_CROWN_SIZE = isTwoCrown ? 24 : Math.max(ONE_COUNTER_SIZE + 12, 30)
  const playAnimation = isWrong
    ? 'pv-shake 0.5s ease'
    : isCorrect
      ? 'pv-pop-in 0.4s ease'
      : undefined

  const difficultyControl = (
    <div
      role="radiogroup"
      aria-label="Positional notation difficulty"
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
      {POSITIONAL_NOTATION_DIFFICULTIES.map((value) => {
        const crownCount = value === 'one-crown' ? 1 : 2
        const isSelected = difficulty === value

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-label={value === 'one-crown' ? 'One crown' : 'Two crowns'}
            aria-checked={isSelected}
            onClick={() => handleDifficultyChange(value)}
            style={{
              flex: 1,
              padding: 0,
              borderRadius:
                uiTokens.listActionRadius - uiTokens.controlInset / 2,
              border: 'none',
              cursor: 'pointer',
              background: isSelected ? theme.colors.primary : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: DOT_GAP,
                width: '100%',
              }}
            >
              {Array.from({ length: crownCount }).map((_, index) => (
                <img
                  key={`${value}-${index}`}
                  src={mathsCounterIcon}
                  alt=""
                  style={{
                    width: ONE_COUNTER_SIZE,
                    height: ONE_COUNTER_SIZE,
                    objectFit: 'contain',
                  }}
                />
              ))}
            </span>
          </button>
        )
      })}
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
        @keyframes pv-pop-in {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes pv-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pv-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes pv-slide-in-right {
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
        beforeProblemControl={difficultyControl}
      />

      {isRunning && (
        <ActivityPlayArea
          theme={theme}
          results={resultHistory}
          correctIcon={quizCorrectIcon}
          incorrectIcon={quizIncorrectIcon}
          slideAnimationName="pv-slide-in-right"
          animation={playAnimation}
          shakeKey={isWrong ? `shake-${retryCount}` : undefined}
        >
          {/* Target Number */}
          <div
            style={{
              background: `${theme.colors.surface}`,
              border: `3px dashed ${theme.colors.primary}33`,
              borderRadius: 16,
              padding: '8px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 48,
                fontWeight: 900,
                fontFamily: theme.fonts.heading,
                color: theme.colors.primary,
                lineHeight: 1,
              }}
            >
              {targetNumber}
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isTwoCrown
                  ? 'repeat(3, minmax(0, 1fr))'
                  : PLACE_VALUE_TENS_PANEL_SPLIT,
                gap: PLACE_VALUE_PANEL_GAP,
                width: '100%',
                alignItems: 'stretch',
              }}
            >
              {/* Hundreds Column */}
              {isTwoCrown && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: `${theme.colors.accent}12`,
                    borderRadius: 16,
                    padding: 4,
                    border: `2px solid ${theme.colors.accent}22`,
                    boxSizing: 'border-box',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 'bold',
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.accent,
                      marginBottom: 6,
                    }}
                  >
                    Hundreds
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      marginBottom: 8,
                      width: '100%',
                    }}
                  >
                    <StepperButton
                      theme={theme}
                      direction="prev"
                      onClick={() =>
                        setUserHundreds((value) => Math.max(0, value - 1))
                      }
                      disabled={userHundreds === 0 || isCorrect}
                      ariaLabel="Remove hundred"
                      style={{
                        width: 28,
                        minWidth: 28,
                        height: PLACE_VALUE_STEPPER_HEIGHT,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 19,
                        fontWeight: 'bold',
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.accent,
                        minWidth: 34,
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {userHundreds * 100}
                    </span>
                    <StepperButton
                      theme={theme}
                      direction="next"
                      onClick={() =>
                        setUserHundreds((value) =>
                          Math.min(MAX_TWO_CROWN_DIGIT, value + 1)
                        )
                      }
                      disabled={
                        userHundreds === MAX_TWO_CROWN_DIGIT || isCorrect
                      }
                      ariaLabel="Add hundred"
                      style={{
                        width: 28,
                        minWidth: 28,
                        height: PLACE_VALUE_STEPPER_HEIGHT,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, max-content)',
                      justifyContent: 'center',
                      alignContent: 'center',
                      gap: 2,
                      minHeight: 112,
                      width: '100%',
                    }}
                  >
                    {userHundreds === 0 ? (
                      <EmptyCounterHint
                        color={theme.colors.accent}
                        fontFamily={theme.fonts.body}
                      />
                    ) : (
                      Array.from({ length: userHundreds }).map((_, index) => (
                        <div
                          key={`hundred-${index}`}
                          aria-hidden="true"
                          style={{
                            width: 30,
                            height: 30,
                            border: `2px solid ${theme.colors.accent}`,
                            borderRadius: 4,
                            backgroundColor: `${theme.colors.accent}18`,
                            backgroundImage: `url("${mathsCounterIcon}")`,
                            backgroundRepeat: 'repeat',
                            backgroundSize: '10% 10%',
                            animation: `pv-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${index * 0.05}s both`,
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tens Column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: `${theme.colors.secondary}12`,
                  borderRadius: 16,
                  padding: isTwoCrown ? 4 : 8,
                  border: `2px solid ${theme.colors.secondary}22`,
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    fontSize: isTwoCrown ? 15 : 18,
                    fontWeight: 'bold',
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.secondary,
                    marginBottom: 6,
                  }}
                >
                  Tens
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    marginBottom: 8,
                    width: '100%',
                  }}
                >
                  <StepperButton
                    theme={theme}
                    direction="prev"
                    onClick={() =>
                      setUserTens((value) => Math.max(0, value - 1))
                    }
                    disabled={userTens === 0 || isCorrect}
                    ariaLabel="Remove ten"
                    style={{
                      width: isTwoCrown ? 28 : PLACE_VALUE_TENS_STEPPER_WIDTH,
                      minWidth: isTwoCrown
                        ? 28
                        : PLACE_VALUE_TENS_STEPPER_WIDTH,
                      height: PLACE_VALUE_STEPPER_HEIGHT,
                      fontSize: isTwoCrown ? '0.9rem' : '1.2rem',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: isTwoCrown ? 19 : 24,
                      fontWeight: 'bold',
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.secondary,
                      width: 42,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {userTens * 10}
                  </span>
                  <StepperButton
                    theme={theme}
                    direction="next"
                    onClick={() =>
                      setUserTens((value) => Math.min(maxTens, value + 1))
                    }
                    disabled={userTens === maxTens || isCorrect}
                    ariaLabel="Add ten"
                    style={{
                      width: isTwoCrown ? 28 : PLACE_VALUE_TENS_STEPPER_WIDTH,
                      minWidth: isTwoCrown
                        ? 28
                        : PLACE_VALUE_TENS_STEPPER_WIDTH,
                      height: PLACE_VALUE_STEPPER_HEIGHT,
                      fontSize: isTwoCrown ? '0.9rem' : '1.2rem',
                      flexShrink: 0,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${isTwoCrown ? 3 : PLACE_VALUE_TENS_COLUMNS}, max-content)`,
                    justifyContent: 'center',
                    columnGap: DOT_GAP,
                    rowGap: DOT_GAP,
                    minHeight: isTwoCrown ? 112 : 100,
                    alignItems: 'flex-end',
                    paddingBottom: 4,
                    width: '100%',
                  }}
                >
                  {userTens === 0 ? (
                    <EmptyCounterHint
                      color={theme.colors.secondary}
                      fontFamily={theme.fonts.body}
                    />
                  ) : (
                    Array.from({ length: userTens }).map((_, index) => (
                      <TenRod
                        key={`ten-${index}`}
                        src={mathsCounterIcon}
                        counterSize={TEN_COUNTER_SIZE}
                        delay={index * 0.05}
                        animationName="pv-pop-in"
                        borderColor={theme.colors.secondary}
                        gap={isTwoCrown ? 0 : 1}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Ones Column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: `${theme.colors.primary}12`,
                  borderRadius: 16,
                  padding: isTwoCrown ? 4 : 8,
                  border: `2px solid ${theme.colors.primary}22`,
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: 0,
                  justifySelf: 'stretch',
                }}
              >
                <span
                  style={{
                    fontSize: isTwoCrown ? 15 : 18,
                    fontWeight: 'bold',
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                    marginBottom: 6,
                  }}
                >
                  Ones
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    marginBottom: 8,
                    width: '100%',
                    paddingLeft: 4,
                    paddingRight: 4,
                    boxSizing: 'border-box',
                  }}
                >
                  <StepperButton
                    theme={theme}
                    direction="prev"
                    onClick={() =>
                      setUserOnes((value) => Math.max(0, value - 1))
                    }
                    disabled={userOnes === 0 || isCorrect}
                    ariaLabel="Remove one"
                    style={{
                      width: isTwoCrown ? 28 : PLACE_VALUE_ONES_STEPPER_WIDTH,
                      minWidth: isTwoCrown
                        ? 28
                        : PLACE_VALUE_ONES_STEPPER_WIDTH,
                      height: PLACE_VALUE_STEPPER_HEIGHT,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: isTwoCrown ? 19 : 24,
                      fontWeight: 'bold',
                      fontFamily: theme.fonts.heading,
                      color: theme.colors.primary,
                      width: 24,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {userOnes}
                  </span>
                  <StepperButton
                    theme={theme}
                    direction="next"
                    onClick={() =>
                      setUserOnes((value) =>
                        Math.min(MAX_POSITIONAL_NOTATION_ONES, value + 1)
                      )
                    }
                    disabled={
                      userOnes === MAX_POSITIONAL_NOTATION_ONES || isCorrect
                    }
                    ariaLabel="Add one"
                    style={{
                      width: isTwoCrown ? 28 : PLACE_VALUE_ONES_STEPPER_WIDTH,
                      minWidth: isTwoCrown
                        ? 28
                        : PLACE_VALUE_ONES_STEPPER_WIDTH,
                      height: PLACE_VALUE_STEPPER_HEIGHT,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    minHeight: isTwoCrown ? 112 : 100,
                    paddingBottom: 4,
                    width: '100%',
                    gap: DOT_GAP,
                    boxSizing: 'border-box',
                  }}
                >
                  {userOnes === 0 ? (
                    <EmptyCounterHint
                      color={theme.colors.primary}
                      fontFamily={theme.fonts.body}
                    />
                  ) : (
                    Array.from({ length: userOnes }).map((_, index) => (
                      <MathCounter
                        key={`one-${index}`}
                        src={mathsCounterIcon}
                        alt=""
                        size={ONE_CROWN_SIZE}
                        delay={index * 0.05}
                        animationName="pv-pop-in"
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Plus sign overlays */}
            {(isTwoCrown ? ['33.33%', '66.66%'] : [PLACE_VALUE_PLUS_LEFT]).map(
              (left) => (
                <div
                  key={left}
                  style={{
                    position: 'absolute',
                    left,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isTwoCrown ? 32 : PLACE_VALUE_PLUS_SIZE,
                    height: isTwoCrown ? 32 : PLACE_VALUE_PLUS_SIZE,
                    borderRadius: isTwoCrown ? 10 : 12,
                    background: theme.colors.surface,
                    border: `2px solid ${theme.colors.primary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: theme.fonts.heading,
                    fontSize: isTwoCrown ? 20 : 24,
                    fontWeight: 900,
                    color: theme.colors.primary,
                    boxShadow: `0 4px 10px ${theme.colors.primary}22`,
                    opacity: 0.92,
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                  aria-hidden="true"
                >
                  +
                </div>
              )
            )}
          </div>
        </ActivityPlayArea>
      )}
    </ActivityOutcomeShell>
  )
}

export default PositionalNotation
