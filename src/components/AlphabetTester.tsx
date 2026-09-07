import { getThemeAsset } from '../ui/themeAssets'
import { useState, useEffect, useCallback, useRef } from 'react'
import { celebrateSuccess } from '../lib/celebrate'
import {
  getActivityMistakeUpdate,
  getActivityOutcome,
  getVisibleActivityResults,
} from '../lib/activityOutcome'
import { preloadImage } from '../lib/imageLoading'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
  type ActivityResult,
} from './ui/ActivityControls'
import LetterCaseControl, { type LetterCase } from './ui/LetterCaseControl'

import { createAssetCatalog } from '../data/assetCatalog'

/* ------------------------------------------------------------------ */
/*  Constants & Assets                                                 */
/* ------------------------------------------------------------------ */

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 9
const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const FAILURE_TRANSITION_DELAY_MS = 3000

const ALPHABET_ASSET_MODULES = import.meta.glob(
  '../assets/alphabet/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
) as Record<string, string>

const alphabetAssetsByLetter = new Map<string, string[]>()
for (const { name, image } of createAssetCatalog(ALPHABET_ASSET_MODULES)
  .assets) {
  const letter = name.charAt(0).toUpperCase()
  alphabetAssetsByLetter.set(letter, [
    ...(alphabetAssetsByLetter.get(letter) ?? []),
    image,
  ])
}

const ALPHABET_ASSETS = Array.from(
  alphabetAssetsByLetter,
  ([letter, files]) => ({ letter, files })
)

const ALL_LETTERS = ALPHABET_ASSETS.map((asset) => asset.letter)

const pickRandomItem = <T,>(items: readonly T[]): T => {
  const item = items[Math.floor(Math.random() * items.length)]
  if (item === undefined) throw new Error('Cannot choose from an empty list')
  return item
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateAlphabetProblem(): {
  letter: string
  image: string
  choices: string[]
} {
  const targetData = pickRandomItem(ALPHABET_ASSETS)
  const image = pickRandomItem(targetData.files)
  const letter = targetData.letter

  const choices = [letter]
  const others = ALL_LETTERS.filter((l) => l !== letter)
  while (choices.length < 3) {
    const rand = pickRandomItem(others)
    if (!choices.includes(rand)) choices.push(rand)
  }
  choices.sort(() => Math.random() - 0.5)

  return { letter, image, choices }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export type AlphabetTesterProps = ActivityChoreProps

const AlphabetTester = ({
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
  completionImage,
  failureImage,
  failureModeEnabled = true,
}: AlphabetTesterProps) => {
  const [letterCase, setLetterCase] = useState<LetterCase>('lower')
  const [problemIndex, setProblemIndex] = useState(0)
  const [currentTarget, setCurrentTarget] = useState('')
  const [currentImage, setCurrentImage] = useState('')
  const [currentChoices, setCurrentChoices] = useState<string[]>([])
  const { isSeen, markSeen, clearHistory } = useProblemHistory([letterCase])
  const [resultHistory, setResultHistory] = useState<ActivityResult[]>([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongChoice, setWrongChoice] = useState<string | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queuedProblem = useRef<ReturnType<
    typeof generateAlphabetProblem
  > | null>(null)

  const isSetup = !isRunning && !isCompleted
  const { isSuccessState, isFinished } = getActivityOutcome({
    isCompleted,
    isFailed,
    failureModeEnabled,
    results: resultHistory,
  })

  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  const nextProblem = useCallback(() => {
    const generateCurrent = () => {
      const problem = queuedProblem.current ?? generateAlphabetProblem()
      queuedProblem.current = null
      return problem
    }
    const p = pickUnseenProblem(generateCurrent, (problem) =>
      isSeen(problem.letter)
    )
    markSeen(p.letter)
    setCurrentTarget(p.letter)
    setCurrentImage(p.image)
    setCurrentChoices(p.choices)
    setFeedback('idle')
    setWrongChoice(null)

    const next = pickUnseenProblem(
      generateAlphabetProblem,
      (problem) => problem.letter === p.letter || isSeen(problem.letter)
    )
    queuedProblem.current = next
    preloadImage(next.image)
  }, [isSeen, markSeen])

  useEffect(() => {
    if (
      isRunning &&
      problemIndex === 0 &&
      feedback === 'idle' &&
      !currentTarget
    ) {
      const frame = requestAnimationFrame(nextProblem)
      return () => cancelAnimationFrame(frame)
    }
  }, [isRunning, problemIndex, feedback, currentTarget, nextProblem])

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [])

  const handleChoice = (selectedLetter: string) => {
    if (feedback !== 'idle' || isFailurePending) return

    if (selectedLetter === currentTarget) {
      setFeedback('correct')
      celebrateSuccess()
      window.setTimeout(() => {
        setResultHistory((prev) => [...prev, 'correct'])
      }, 120)
      feedbackTimer.current = setTimeout(() => {
        if (problemIndex + 1 >= totalProblems) {
          onComplete()
        } else {
          setProblemIndex((i) => i + 1)
          nextProblem()
        }
      }, CELEBRATION_DELAY_MS)
    } else {
      setFeedback('wrong')
      setWrongChoice(selectedLetter)
      const mistake = getActivityMistakeUpdate(
        resultHistory,
        failureModeEnabled
      )
      setResultHistory(mistake.nextResults)

      if (mistake.shouldFail) {
        setIsFailurePending(true)
        feedbackTimer.current = setTimeout(() => {
          onFail?.()
        }, FAILURE_TRANSITION_DELAY_MS)
        return
      }

      feedbackTimer.current = setTimeout(() => {
        setFeedback('idle')
        setWrongChoice(null)
      }, SHAKE_DURATION_MS)
    }
  }

  useEffect(() => {
    if (!isRunning && !isCompleted) {
      const frame = requestAnimationFrame(() => {
        clearHistory()
        setProblemIndex(0)
        setCurrentTarget('')
        setCurrentImage('')
        setCurrentChoices([])
        setResultHistory([])
        setIsFailurePending(false)
        setFeedback('idle')
        setWrongChoice(null)
        queuedProblem.current = null
      })
      return () => cancelAnimationFrame(frame)
    }
  }, [isRunning, isCompleted, clearHistory])

  return (
    <ActivityOutcomeShell
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      successAlt="Great job!"
      failureAlt="Keep trying!"
      className="flex w-full flex-col items-center"
    >
      <ActivitySetupControls
        isSetup={isSetup}
        theme={theme}
        totalProblems={totalProblems}
        min={MIN_PROBLEMS}
        max={MAX_PROBLEMS}
        onAdjustProblems={onAdjustProblems}
        starReward={starReward}
        onStarsChange={onStarsChange}
        previousAriaLabel="Fewer problems"
        nextAriaLabel="More problems"
        beforeProblemControl={
          <LetterCaseControl
            theme={theme}
            value={letterCase}
            onChange={setLetterCase}
          />
        }
        isEditable={isEditable}
        starMax={10}
      />

      {isRunning && currentTarget && (
        <ActivityPlayArea
          theme={theme}
          results={getVisibleActivityResults(resultHistory, failureModeEnabled)}
          correctIcon={getThemeAsset(theme.id, 'quizCorrectImage')}
          incorrectIcon={getThemeAsset(theme.id, 'quizIncorrectImage')}
          hideAlt
        >
          {/* Prompt Image */}
          <div
            className="relative flex aspect-square w-full items-center justify-center overflow-hidden"
            style={{
              background: theme.colors.surface,
              borderRadius: 24,
              border: `4px solid ${theme.colors.accent}44`,
              padding: 12,
              boxSizing: 'border-box',
              animation: isCorrect ? 'pop-in 0.4s ease' : undefined,
            }}
          >
            <img
              src={currentImage}
              alt="Identify the first letter"
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-contain"
            />
          </div>

          {/* Choice Buttons */}
          <div
            className="flex w-full justify-center"
            style={{ gap: 12, marginTop: 8 }}
          >
            {currentChoices.map((letter) => {
              const isChoiceCorrect = isCorrect && letter === currentTarget
              const isChoiceWrong = isWrong && letter === wrongChoice

              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleChoice(letter)}
                  disabled={isCorrect || isFailurePending}
                  className="flex aspect-square flex-1 items-center justify-center"
                  style={{
                    maxWidth: 100,
                    background: isChoiceCorrect
                      ? '#4ADE80'
                      : isChoiceWrong
                        ? '#F87171'
                        : theme.colors.surface,
                    borderRadius: 24,
                    border: `4px solid ${isChoiceCorrect || isChoiceWrong ? 'transparent' : theme.colors.accent}`,
                    fontFamily: theme.fonts.heading,
                    fontSize: '2rem',
                    fontWeight: 900,
                    color:
                      isChoiceCorrect || isChoiceWrong
                        ? 'white'
                        : theme.colors.primary,
                    boxShadow: `0 6px 0 ${isChoiceCorrect ? '#16A34A' : isChoiceWrong ? '#DC2626' : theme.colors.accent + '88'}`,
                    transition: 'all 0.1s ease',
                    animation: isChoiceWrong ? 'shake 0.4s ease' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  {letterCase === 'upper' ? letter : letter.toLowerCase()}
                </button>
              )
            })}
          </div>
        </ActivityPlayArea>
      )}

      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0.9); opacity: 0.5; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </ActivityOutcomeShell>
  )
}

export default AlphabetTester
