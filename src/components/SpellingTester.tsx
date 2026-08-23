import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { uiTokens } from '../tokens'
import animalsSetIcon from '../assets/global/cat-camel-cow.webp'
import teenieSetIcon from '../assets/global/teenieping.webp'
import pokemonSetIcon from '../assets/pokemon/pikachu.png'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import antImage from '../assets/spelling/ant.webp'
import batImage from '../assets/spelling/bat.webp'
import catImage from '../assets/spelling/cat.webp'
import dogImage from '../assets/spelling/dog.webp'
import eagleImage from '../assets/spelling/eagle.webp'
import foxImage from '../assets/spelling/fox.webp'
import goatImage from '../assets/spelling/goat.webp'
import hippoImage from '../assets/spelling/hippo.webp'
import ibisImage from '../assets/spelling/ibis.webp'
import jackalImage from '../assets/spelling/jackal.webp'
import kiwiImage from '../assets/spelling/kiwi.webp'
import lionImage from '../assets/spelling/lion.webp'
import mouseImage from '../assets/spelling/mouse.webp'
import newtImage from '../assets/spelling/newt.webp'
import owlImage from '../assets/spelling/owl.webp'
import pigImage from '../assets/spelling/pig.webp'
import rabbitImage from '../assets/spelling/rabbit.webp'
import swanImage from '../assets/spelling/swan.webp'
import tigerImage from '../assets/spelling/tiger.webp'
import voleImage from '../assets/spelling/vole.webp'
import yakImage from '../assets/spelling/yak.webp'
import zebraImage from '../assets/spelling/zebra.webp'
import { celebrateSuccess } from '../lib/celebrate'
import { useProblemHistory } from '../lib/useProblemHistory'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  MAX_ACTIVITY_MISTAKES,
  type ActivityChoreProps,
  type ActivityResult,
} from './ui/ActivityControls'
import SegmentedChoiceControl from './ui/SegmentedChoiceControl'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const NEXT_LETTER_DELAY_MS = 450
const NEXT_WORD_DELAY_MS = 1100
const FLY_AWAY_DURATION_MS = 650
const FAILURE_TRANSITION_DELAY_MS = 1400

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

type SpellingAnimal = {
  name: string
  image: string
}

type SpellingWordSetId = 'animals' | 'teenie' | 'pokemon'

type LetterChoice = {
  id: string
  letter: string
  state: 'idle' | 'correct' | 'leaving'
}

const SPELLING_ANIMALS: SpellingAnimal[] = [
  { name: 'ant', image: antImage },
  { name: 'bat', image: batImage },
  { name: 'cat', image: catImage },
  { name: 'dog', image: dogImage },
  { name: 'eagle', image: eagleImage },
  { name: 'fox', image: foxImage },
  { name: 'goat', image: goatImage },
  { name: 'hippo', image: hippoImage },
  { name: 'ibis', image: ibisImage },
  { name: 'jackal', image: jackalImage },
  { name: 'kiwi', image: kiwiImage },
  { name: 'lion', image: lionImage },
  { name: 'mouse', image: mouseImage },
  { name: 'newt', image: newtImage },
  { name: 'owl', image: owlImage },
  { name: 'pig', image: pigImage },
  { name: 'rabbit', image: rabbitImage },
  { name: 'swan', image: swanImage },
  { name: 'tiger', image: tigerImage },
  { name: 'vole', image: voleImage },
  { name: 'yak', image: yakImage },
  { name: 'zebra', image: zebraImage },
]

const TEENIE_ASSET_MODULES = import.meta.glob(
  '../assets/teenie/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
) as Record<string, string>

const POKEMON_ASSET_MODULES = import.meta.glob(
  '../assets/pokemon/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
) as Record<string, string>

const getAssetName = (path: string) =>
  path
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '') ?? path

const SPELLING_TEENIE: SpellingAnimal[] = Object.entries(TEENIE_ASSET_MODULES)
  .map(([path, image]) => ({
    name: getAssetName(path),
    image,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const SPELLING_POKEMON: SpellingAnimal[] = Object.entries(POKEMON_ASSET_MODULES)
  .map(([path, image]) => ({
    name: getAssetName(path).replace(/^grrowlithe$/i, 'growlithe'),
    image,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const SPELLING_WORD_SETS: Record<SpellingWordSetId, SpellingAnimal[]> = {
  animals: SPELLING_ANIMALS,
  teenie: SPELLING_TEENIE,
  pokemon: SPELLING_POKEMON,
}

const SPELLING_SET_OPTIONS: {
  id: SpellingWordSetId
  label: string
  icon: string
}[] = [
  { id: 'animals', label: 'Animals', icon: animalsSetIcon },
  { id: 'teenie', label: 'Teenie', icon: teenieSetIcon },
  { id: 'pokemon', label: 'Pokémon', icon: pokemonSetIcon },
]

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const makeChoiceId = (letter: string, index: number) =>
  `${letter}-${index}-${Math.random().toString(36).slice(2)}`

const generateChoices = (targetLetter: string): LetterChoice[] => {
  const choices = [targetLetter]
  const distractors = LETTERS.filter((letter) => letter !== targetLetter)

  while (choices.length < 3) {
    const next = distractors[Math.floor(Math.random() * distractors.length)]
    if (!choices.includes(next)) choices.push(next)
  }

  return shuffle(choices).map((letter, index) => ({
    id: makeChoiceId(letter, index),
    letter,
    state: 'idle',
  }))
}

const getAnimalLetters = (animal: SpellingAnimal) =>
  animal.name.toUpperCase().split('')

export type SpellingTesterProps = ActivityChoreProps

type SpellingTheme = ActivityChoreProps['theme']

const getVisibleResults = (
  failureModeEnabled: boolean,
  resultHistory: ActivityResult[]
) =>
  failureModeEnabled
    ? resultHistory
    : resultHistory.filter((result) => result === 'correct')

const updateChoiceState = (
  choices: LetterChoice[],
  choiceId: string,
  state: LetterChoice['state']
) => choices.map((item) => (item.id === choiceId ? { ...item, state } : item))

const getChoiceButtonStyle = (
  choice: LetterChoice,
  theme: SpellingTheme
): CSSProperties => {
  const isIdle = choice.state === 'idle'
  const stateColor =
    choice.state === 'correct'
      ? { background: '#4ADE80', shadow: '#16A34A' }
      : choice.state === 'leaving'
        ? { background: '#F87171', shadow: '#DC2626' }
        : null

  return {
    maxWidth: 92,
    background: stateColor?.background ?? theme.colors.surface,
    borderRadius: 24,
    border: `4px solid ${isIdle ? theme.colors.accent : 'transparent'}`,
    color: isIdle ? theme.colors.primary : 'white',
    fontFamily: theme.fonts.heading,
    fontSize: '2.1rem',
    fontWeight: 900,
    boxShadow: `0 6px 0 ${stateColor?.shadow ?? theme.colors.accent + '88'}`,
    animation:
      choice.state === 'leaving'
        ? 'spelling-fly-away 0.65s ease-in forwards'
        : choice.state === 'correct'
          ? 'spelling-pop 0.32s ease both'
          : undefined,
    cursor: isIdle ? 'pointer' : 'default',
  }
}

type SpellingPictureProps = {
  animal: SpellingAnimal
  theme: SpellingTheme
}

const SpellingPicture = ({ animal, theme }: SpellingPictureProps) => (
  <div
    className="relative flex w-full items-center justify-center overflow-hidden"
    style={{
      aspectRatio: '4 / 3',
      background: theme.colors.surface,
      borderRadius: 24,
      border: `4px solid ${theme.colors.accent}44`,
      padding: 12,
      boxSizing: 'border-box',
    }}
  >
    <img
      src={animal.image}
      alt={animal.name}
      className="h-full w-full object-contain"
    />
  </div>
)

type SpellingWordTilesProps = {
  animalName: string
  letters: string[]
  spelledCount: number
  choices: LetterChoice[]
  theme: SpellingTheme
}

const SpellingWordTiles = ({
  animalName,
  letters,
  spelledCount,
  choices,
  theme,
}: SpellingWordTilesProps) => (
  <div
    className="flex w-full items-center justify-center"
    style={{ gap: 8, minHeight: 54 }}
    aria-label={animalName}
  >
    {letters.map((letter, index) => {
      const isRevealed = index < spelledCount
      const isCurrent =
        index === spelledCount &&
        choices.some(
          (choice) => choice.letter === letter && choice.state === 'correct'
        )

      return (
        <div
          key={`${animalName}-${index}`}
          className="flex items-center justify-center"
          style={{
            width: 44,
            height: 52,
            borderRadius: 16,
            border: `3px solid ${theme.colors.accent}`,
            background:
              isRevealed || isCurrent
                ? `${theme.colors.primary}18`
                : theme.colors.surface,
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
            fontSize: 30,
            fontWeight: 900,
            boxShadow: `0 4px 0 ${theme.colors.accent}66`,
            transition: 'transform 0.18s ease',
            transform: isCurrent ? 'scale(1.08)' : undefined,
          }}
        >
          {isRevealed || isCurrent ? letter : ''}
        </div>
      )
    })}
  </div>
)

type SpellingChoiceButtonsProps = {
  choices: LetterChoice[]
  isFailurePending: boolean
  theme: SpellingTheme
  onChoice: (choice: LetterChoice) => void
}

const SpellingChoiceButtons = ({
  choices,
  isFailurePending,
  theme,
  onChoice,
}: SpellingChoiceButtonsProps) => (
  <div
    className="flex w-full justify-center"
    style={{ gap: 12, marginTop: 8, minHeight: 88 }}
  >
    {choices.map((choice) => (
      <button
        key={choice.id}
        type="button"
        onClick={() => onChoice(choice)}
        disabled={choice.state !== 'idle' || isFailurePending}
        className="flex aspect-square flex-1 items-center justify-center"
        style={getChoiceButtonStyle(choice, theme)}
      >
        {choice.letter}
      </button>
    ))}
  </div>
)

const SpellingTester = ({
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
}: SpellingTesterProps) => {
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [currentAnimal, setCurrentAnimal] = useState<SpellingAnimal | null>(
    null
  )
  const [spelledCount, setSpelledCount] = useState(0)
  const [choices, setChoices] = useState<LetterChoice[]>([])
  const [resultHistory, setResultHistory] = useState<ActivityResult[]>([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [spellingSet, setSpellingSet] = useState<SpellingWordSetId>('animals')
  const spellingWords = SPELLING_WORD_SETS[spellingSet]
  const { isSeen, markSeen, clearHistory } = useProblemHistory([spellingSet])
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter((r) => r === 'incorrect').length
  const hasFailedByHistory =
    failureModeEnabled && incorrectCount >= MAX_ACTIVITY_MISTAKES
  const isFailedState =
    failureModeEnabled && isCompleted && (isFailed || hasFailedByHistory)
  const isSuccessState = isCompleted && !isFailedState
  const isFinished = isSuccessState || isFailedState

  const animalLetters = currentAnimal ? getAnimalLetters(currentAnimal) : []
  const targetLetter = animalLetters[spelledCount]

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current)
      feedbackTimer.current = null
    }
  }, [])

  const resetRoundState = useCallback(() => {
    clearFeedbackTimer()
    clearHistory()
    setProblemIndex(0)
    setSuccessCount(0)
    setRetryCount(0)
    setCurrentAnimal(null)
    setSpelledCount(0)
    setChoices([])
    setResultHistory([])
    setIsFailurePending(false)
  }, [clearFeedbackTimer, clearHistory])

  const handleSpellingSetChange = useCallback(
    (nextSet: SpellingWordSetId) => {
      if (nextSet === spellingSet) return

      resetRoundState()
      setSpellingSet(nextSet)
    },
    [resetRoundState, spellingSet]
  )

  const nextAnimal = useCallback(() => {
    let animal = spellingWords[Math.floor(Math.random() * spellingWords.length)]
    let attempts = 0

    while (isSeen(`${spellingSet}-${animal.name}`) && attempts < 20) {
      animal = spellingWords[Math.floor(Math.random() * spellingWords.length)]
      attempts++
    }

    markSeen(`${spellingSet}-${animal.name}`)
    setCurrentAnimal(animal)
    setSpelledCount(0)
    setChoices(generateChoices(getAnimalLetters(animal)[0]))
    setIsFailurePending(false)
  }, [isSeen, markSeen, spellingSet, spellingWords])

  useEffect(() => {
    if (isRunning && !currentAnimal) {
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      setResultHistory([])
      nextAnimal()
    }
  }, [currentAnimal, isRunning, nextAnimal])

  useEffect(() => clearFeedbackTimer, [clearFeedbackTimer])

  useEffect(() => {
    if (!isRunning && !isCompleted) {
      resetRoundState()
    }
  }, [isCompleted, isRunning, resetRoundState])

  const handleChoice = (choice: LetterChoice) => {
    if (!currentAnimal || !targetLetter || isFailurePending) return
    if (choices.some((item) => item.state !== 'idle')) return

    if (choice.letter === targetLetter) {
      const nextSpelledCount = spelledCount + 1
      setChoices((previous) =>
        updateChoiceState(previous, choice.id, 'correct')
      )

      feedbackTimer.current = setTimeout(() => {
        setSpelledCount(nextSpelledCount)

        if (nextSpelledCount >= animalLetters.length) {
          const nextSuccessCount = successCount + 1
          setSuccessCount(nextSuccessCount)
          setResultHistory((previous) => [...previous, 'correct'])
          celebrateSuccess()

          feedbackTimer.current = setTimeout(() => {
            if (problemIndex + 1 >= totalProblems) {
              onComplete()
            } else {
              setProblemIndex((index) => index + 1)
              nextAnimal()
            }
          }, NEXT_WORD_DELAY_MS)
          return
        }

        setChoices(generateChoices(animalLetters[nextSpelledCount]))
      }, NEXT_LETTER_DELAY_MS)
      return
    }

    if (failureModeEnabled) {
      setResultHistory((previous) => [...previous, 'incorrect'])
    }
    const nextRetryCount = retryCount + 1
    setRetryCount(nextRetryCount)
    setChoices((previous) => updateChoiceState(previous, choice.id, 'leaving'))

    if (failureModeEnabled && nextRetryCount >= MAX_ACTIVITY_MISTAKES) {
      setIsFailurePending(true)
      feedbackTimer.current = setTimeout(() => {
        onFail?.()
      }, FAILURE_TRANSITION_DELAY_MS)
      return
    }

    feedbackTimer.current = setTimeout(() => {
      setChoices((previous) => previous.filter((item) => item.id !== choice.id))
    }, FLY_AWAY_DURATION_MS)
  }

  return (
    <ActivityOutcomeShell
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      successAlt="Great spelling!"
      failureAlt="Keep trying!"
      className="flex w-full flex-col items-center"
      style={{ gap: uiTokens.sectionGap }}
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
        previousAriaLabel="Fewer words"
        nextAriaLabel="More words"
        beforeProblemControl={
          <SegmentedChoiceControl
            theme={theme}
            value={spellingSet}
            options={SPELLING_SET_OPTIONS.map((option) => ({
              value: option.id,
              label: option.label,
              icon: option.icon,
            }))}
            onChange={handleSpellingSetChange}
            ariaLabel="Spelling pictures"
          />
        }
        isEditable={isEditable}
        starMax={10}
        starStyle={{ marginTop: uiTokens.singleVerticalSpace }}
      />

      {isRunning && currentAnimal && (
        <ActivityPlayArea
          theme={theme}
          results={getVisibleResults(failureModeEnabled, resultHistory)}
          correctIcon={quizCorrectIcon}
          incorrectIcon={quizIncorrectIcon}
          hideAlt
        >
          <SpellingPicture animal={currentAnimal} theme={theme} />
          <SpellingWordTiles
            animalName={currentAnimal.name}
            letters={animalLetters}
            spelledCount={spelledCount}
            choices={choices}
            theme={theme}
          />
          <SpellingChoiceButtons
            choices={choices}
            isFailurePending={isFailurePending}
            theme={theme}
            onChoice={handleChoice}
          />
        </ActivityPlayArea>
      )}

      <style>{`
        @keyframes spelling-pop {
          0% { transform: scale(0.88); }
          70% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes spelling-fly-away {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          70% { transform: translateY(-44px) rotate(18deg) scale(0.8); opacity: 0.7; }
          100% { transform: translateY(-84px) rotate(28deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </ActivityOutcomeShell>
  )
}

export default SpellingTester
