import { useCallback, useRef, useState } from 'react'
import { useActivityChallenge } from '../hooks/useActivityChallenge'
import { preloadImage } from '../lib/imageLoading'
import { pickUnseenProblem, useProblemHistory } from '../lib/useProblemHistory'
import { getThemeAsset } from '../ui/themeAssets'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
} from './ui/ActivityControls'
import LetterCaseControl, { type LetterCase } from './ui/LetterCaseControl'

import { createAssetCatalog } from '../data/assetCatalog'

/* ------------------------------------------------------------------ */
/*  Constants & Assets                                                 */
/* ------------------------------------------------------------------ */

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 9

const ALPHABET_ASSET_MODULES = import.meta.glob<string>(
  '../assets/alphabet/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

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

const EMPTY_PROBLEM: ReturnType<typeof generateAlphabetProblem> = {
  letter: '',
  image: '',
  choices: [],
}

const AlphabetTester = (props: ActivityChoreProps) => {
  const {
    theme,
    totalProblems,
    isRunning,
    isCompleted = false,
    isFailed = false,
    onComplete,
    onFail,
    failureModeEnabled = true,
  } = props
  const [letterCase, setLetterCase] = useState<LetterCase>('lower')
  const [
    { letter: currentTarget, image: currentImage, choices: currentChoices },
    setProblem,
  ] = useState(EMPTY_PROBLEM)
  const { isSeen, markSeen, clearHistory } = useProblemHistory([letterCase])
  const [wrongChoice, setWrongChoice] = useState<string | null>(null)
  const queuedProblem = useRef<ReturnType<
    typeof generateAlphabetProblem
  > | null>(null)

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
    setProblem(p)
    setWrongChoice(null)

    const next = pickUnseenProblem(
      generateAlphabetProblem,
      (problem) => problem.letter === p.letter || isSeen(problem.letter)
    )
    queuedProblem.current = next
    preloadImage(next.image)
  }, [isSeen, markSeen])

  const resetProblem = useCallback(() => {
    clearHistory()
    setProblem(EMPTY_PROBLEM)
    setWrongChoice(null)
    queuedProblem.current = null
  }, [clearHistory])

  const {
    resultHistory,
    isSetup,
    isSuccessState,
    persistence,
    isFinished,
    isCorrect,
    isWrong,
    isFailurePending,
    submitAnswer,
    resetFeedback,
  } = useActivityChallenge({
    isRunning,
    isCompleted,
    isFailed: failureModeEnabled && isFailed,
    totalProblems,
    onComplete,
    onFail,
    failureModeEnabled,
    canStart: !currentTarget,
    onStart: nextProblem,
    onReset: resetProblem,
  })

  const handleChoice = (selectedLetter: string) => {
    if (isCorrect || isWrong || isFailurePending) return
    setWrongChoice(selectedLetter)
    submitAnswer(selectedLetter === currentTarget, () => {
      resetFeedback()
      nextProblem()
    })
  }

  return (
    <ActivityOutcomeShell
      persistence={persistence}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={props.completionImage}
      failureImage={props.failureImage}
      successAlt="Great job!"
      failureAlt="Keep trying!"
      className="flex w-full flex-col items-center"
    >
      <ActivitySetupControls
        {...props}
        isSetup={isSetup}
        min={MIN_PROBLEMS}
        max={MAX_PROBLEMS}
        previousAriaLabel="Fewer problems"
        nextAriaLabel="More problems"
        beforeProblemControl={
          <LetterCaseControl
            theme={theme}
            value={letterCase}
            onChange={setLetterCase}
          />
        }
        starMax={10}
      />

      {isRunning && currentTarget && (
        <ActivityPlayArea
          theme={theme}
          results={resultHistory}
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
