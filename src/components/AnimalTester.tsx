import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import abilityImage from '../assets/animal-facts/ability.webp'
import foodImage from '../assets/animal-facts/food.webp'
import habitatCoverImage from '../assets/animal-facts/habitat-cover.webp'
import habitatPlaceImage from '../assets/animal-facts/habitat-place.webp'
import learnModeImage from '../assets/animal-mode-icons/learn.webp'
import onePlayerModeImage from '../assets/animal-mode-icons/one-player.webp'
import twoPlayersModeImage from '../assets/animal-mode-icons/two-players.webp'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { getAnimalAbilityImage } from '../data/animalAbilityAssets'
import { ANIMAL_ASSET_BY_NAME } from '../data/animalAssets'
import { getAnimalFoodImage, getAnimalFoodName } from '../data/animalFoodAssets'
import {
  getAnimalHabitatImage,
  getAnimalHabitatName,
} from '../data/animalHabitatAssets'
import {
  getAnimalLocationImage,
  getAnimalLocationName,
} from '../data/animalLocationAssets'
import {
  ANIMAL_KNOWLEDGE,
  type AnimalFact,
  type AnimalKnowledge,
} from '../data/animalKnowledge'
import { celebrateSuccess } from '../lib/celebrate'
import {
  getActivityOutcome,
  getVisibleActivityResults,
} from '../lib/activityOutcome'
import { uiTokens } from '../tokens'
import ActionButton from './ui/ActionButton'
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
const MAX_PROBLEMS = 9
const LEARN_AUTO_ADVANCE_MS = 6500
const CHOICE_ANIMATION_MS = 650
const CLUE_REVEAL_INTERVAL_MS = 3000

type AnimalMode = 'learn' | 'solo' | 'together'
type TogetherPhase = 'keeper' | 'questions' | 'answer'

type CatalogAnimal = AnimalKnowledge & {
  image: string
}

const MODE_OPTIONS = [
  {
    value: 'learn' as const,
    label: 'Learn',
    icon: learnModeImage,
  },
  {
    value: 'solo' as const,
    label: '1 Player',
    icon: onePlayerModeImage,
  },
  {
    value: 'together' as const,
    label: '2 Players',
    icon: twoPlayersModeImage,
  },
]

const QUESTION_PROMPTS = [
  [habitatPlaceImage, 'Location'],
  [habitatCoverImage, 'Environment'],
  [foodImage, 'Food'],
  [abilityImage, 'Ability'],
] as const

const formatAnimalName = (name: string) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const shuffle = <T,>(items: readonly T[]) =>
  [...items].sort(() => Math.random() - 0.5)

const ANIMAL_CATALOG: CatalogAnimal[] = ANIMAL_KNOWLEDGE.flatMap((animal) => {
  const image = ANIMAL_ASSET_BY_NAME.get(animal.name)
  return image ? [{ ...animal, image }] : []
})

type VisualFact = AnimalFact & {
  illustration?: string
  word?: string
}

const getLabelWord = (label: string) => {
  const words = label.toLowerCase().split(/\s+/)
  const word = words.at(-1) ?? label
  return word.charAt(0).toUpperCase() + word.slice(1)
}

const getTeachingFacts = (animal: CatalogAnimal): VisualFact[] => [
  {
    ...animal.habitat[0],
    label: 'LOCATION',
    illustration: getAnimalLocationImage(animal.habitat[0].text),
    word: getAnimalLocationName(animal.habitat[0].text),
  },
  {
    ...animal.habitat[1],
    label: 'ENVIRONMENT',
    illustration: getAnimalHabitatImage(animal.habitat[1].text),
    word: getAnimalHabitatName(animal.habitat[1].text),
  },
  {
    ...animal.food[1],
    label: 'FOOD',
    illustration: getAnimalFoodImage(animal.food[1].text),
    word: getAnimalFoodName(animal.food[1].text),
  },
  {
    ...animal.abilities[0],
    label: 'ABILITY',
    illustration: getAnimalAbilityImage(animal.name) ?? abilityImage,
    word: getLabelWord(animal.abilities[0].label),
  },
]

const FactCard = ({
  fact,
  theme,
}: {
  fact: VisualFact
  theme: ActivityChoreProps['theme']
}) => (
  <div
    aria-label={`${fact.label}: ${fact.text}`}
    style={{
      minHeight: 174,
      padding: '8px',
      borderRadius: 22,
      border: `3px solid ${theme.colors.accent}`,
      background: theme.colors.surface,
      color: theme.colors.text,
      boxShadow: `0 5px 0 ${theme.colors.accent}66`,
      fontFamily: theme.fonts.body,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      textAlign: 'center',
    }}
  >
    {fact.illustration ? (
      <img
        src={fact.illustration}
        alt=""
        style={{ width: '100%', height: 132, objectFit: 'contain' }}
      />
    ) : (
      <span aria-hidden="true" style={{ fontSize: '5rem', lineHeight: 1 }}>
        {fact.visual}
      </span>
    )}
    {fact.word && (
      <strong
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: '1rem',
          color: theme.colors.primary,
          lineHeight: 1,
        }}
      >
        {fact.word}
      </strong>
    )}
  </div>
)

const FactGrid = ({
  facts,
  theme,
}: {
  facts: VisualFact[]
  theme: ActivityChoreProps['theme']
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 10,
      width: '100%',
    }}
  >
    {facts.map((fact) => (
      <FactCard key={`${fact.label}-${fact.text}`} fact={fact} theme={theme} />
    ))}
  </div>
)

const AnimalPortrait = ({
  animal,
  theme,
  showName = true,
  compact = false,
}: {
  animal: CatalogAnimal
  theme: ActivityChoreProps['theme']
  showName?: boolean
  compact?: boolean
}) => (
  <div
    style={{
      width: '100%',
      minHeight: compact ? 170 : 215,
      borderRadius: 26,
      background: `${theme.colors.surface}dd`,
      border: `3px solid ${theme.colors.secondary}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: 8,
      boxSizing: 'border-box',
    }}
  >
    <img
      src={animal.image}
      alt={showName ? formatAnimalName(animal.name) : 'Mystery animal'}
      style={{
        width: '100%',
        height: compact ? 132 : 172,
        objectFit: 'contain',
      }}
    />
    {showName && (
      <strong
        style={{
          color: theme.colors.primary,
          fontFamily: theme.fonts.heading,
          fontSize: '1.45rem',
          lineHeight: 1.1,
        }}
      >
        {formatAnimalName(animal.name)}
      </strong>
    )}
  </div>
)

const SectionHeading = ({
  symbol,
  title,
  theme,
}: {
  symbol: string
  title: string
  theme: ActivityChoreProps['theme']
}) => (
  <div style={{ textAlign: 'center', color: theme.colors.text }}>
    <div aria-hidden="true" style={{ fontSize: '2rem' }}>
      {symbol}
    </div>
    <h3
      style={{
        margin: 0,
        color: theme.colors.primary,
        fontFamily: theme.fonts.heading,
        fontSize: '1.45rem',
      }}
    >
      {title}
    </h3>
  </div>
)

const PrimaryAction = ({
  label,
  icon,
  onClick,
  theme,
}: {
  label: string
  icon: string
  onClick: () => void
  theme: ActivityChoreProps['theme']
}) => (
  <ActionButton
    label={label}
    icon={icon}
    theme={theme}
    color={theme.colors.primary}
    onClick={onClick}
    styleOverride={{
      minHeight: 72,
      height: 72,
      fontSize: 22,
      marginTop: 6,
    }}
  />
)

export type AnimalTesterProps = ActivityChoreProps

const AnimalTester = ({
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
}: AnimalTesterProps) => {
  const [mode, setMode] = useState<AnimalMode>('learn')
  const [animalOrder, setAnimalOrder] = useState(() => shuffle(ANIMAL_CATALOG))
  const [animalIndex, setAnimalIndex] = useState(0)
  const [results, setResults] = useState<ActivityResult[]>([])
  const [leavingChoice, setLeavingChoice] = useState<string | null>(null)
  const [dismissedChoices, setDismissedChoices] = useState<string[]>([])
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false)
  const [visibleSoloClues, setVisibleSoloClues] = useState(1)
  const [togetherPhase, setTogetherPhase] = useState<TogetherPhase>('keeper')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSetup = !isRunning && !isCompleted
  const { isSuccessState, isFinished } = getActivityOutcome({
    isCompleted,
    isFailed,
    failureModeEnabled,
    results,
  })

  const animal = animalOrder[animalIndex % animalOrder.length]
  const answerChoices = useMemo(() => {
    if (!animal) return []
    const alternatives = shuffle(
      ANIMAL_CATALOG.filter((candidate) => candidate.name !== animal.name)
    ).slice(0, 2)
    return shuffle([animal, ...alternatives])
  }, [animal])

  const resetPlayState = useCallback(() => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    setAnimalOrder(shuffle(ANIMAL_CATALOG))
    setAnimalIndex(0)
    setResults([])
    setLeavingChoice(null)
    setDismissedChoices([])
    setAnsweredCorrectly(false)
    setVisibleSoloClues(1)
    setTogetherPhase('keeper')
  }, [])

  useEffect(() => {
    if (!isRunning && !isCompleted) resetPlayState()
  }, [isCompleted, isRunning, resetPlayState])

  const finishAnimal = useCallback(
    (result: ActivityResult = 'correct', shouldCelebrate = true) => {
      setResults((previous) => [...previous, result])
      if (animalIndex + 1 >= totalProblems) {
        if (result === 'correct' && shouldCelebrate) celebrateSuccess()
        onComplete()
        return
      }

      setAnimalIndex((index) => index + 1)
      setLeavingChoice(null)
      setDismissedChoices([])
      setAnsweredCorrectly(false)
      setVisibleSoloClues(1)
      setTogetherPhase('keeper')
    },
    [animalIndex, onComplete, totalProblems]
  )

  useEffect(() => {
    if (!isRunning || isFinished || mode !== 'learn' || !animal) return

    const timer = setTimeout(finishAnimal, LEARN_AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [animal, finishAnimal, isFinished, isRunning, mode])

  useEffect(() => {
    if (!isRunning || isFinished || mode !== 'solo' || !animal) return

    setVisibleSoloClues(1)
    let revealedClues = 1
    const clueCount = getTeachingFacts(animal).length
    const timer = setInterval(() => {
      revealedClues += 1
      setVisibleSoloClues(revealedClues)
      if (revealedClues >= clueCount) clearInterval(timer)
    }, CLUE_REVEAL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [animal, isFinished, isRunning, mode])

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    },
    []
  )

  const handleSoloChoice = (choice: CatalogAnimal) => {
    if (
      answeredCorrectly ||
      leavingChoice ||
      dismissedChoices.includes(choice.name)
    )
      return

    if (choice.name === animal.name) {
      setAnsweredCorrectly(true)
      celebrateSuccess()
      feedbackTimer.current = setTimeout(
        () => finishAnimal('correct', false),
        CHOICE_ANIMATION_MS
      )
      return
    }

    setLeavingChoice(choice.name)
    let shouldFail = false
    if (failureModeEnabled) {
      const nextResults: ActivityResult[] = [...results, 'incorrect']
      setResults(nextResults)
      const mistakes = nextResults.filter((result) => result === 'incorrect')
      shouldFail = mistakes.length >= MAX_ACTIVITY_MISTAKES
    }

    feedbackTimer.current = setTimeout(() => {
      setDismissedChoices((previous) => [...previous, choice.name])
      setLeavingChoice(null)
      if (shouldFail) onFail?.()
    }, CHOICE_ANIMATION_MS)
  }

  return (
    <ActivityOutcomeShell
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      successAlt="Amazing animal explorer!"
      failureAlt="Let's learn some more animals!"
      className="flex w-full flex-col items-center"
      style={{ gap: uiTokens.sectionGap }}
    >
      {isSetup && !isEditable && (
        <div style={{ width: uiTokens.controlRowWidth, maxWidth: '100%' }}>
          <SegmentedChoiceControl
            theme={theme}
            value={mode}
            options={MODE_OPTIONS}
            onChange={setMode}
            ariaLabel="Animal game mode"
          />
        </div>
      )}
      <ActivitySetupControls
        isSetup={isSetup}
        theme={theme}
        totalProblems={totalProblems}
        min={MIN_PROBLEMS}
        max={MAX_PROBLEMS}
        onAdjustProblems={onAdjustProblems}
        starReward={starReward}
        onStarsChange={onStarsChange}
        previousAriaLabel="Fewer animals"
        nextAriaLabel="More animals"
        isEditable={isEditable}
        starMax={10}
        beforeProblemControl={
          <SegmentedChoiceControl
            theme={theme}
            value={mode}
            options={MODE_OPTIONS}
            onChange={setMode}
            ariaLabel="Animal game mode"
          />
        }
      />

      {isRunning && animal && (
        <ActivityPlayArea
          theme={theme}
          results={getVisibleActivityResults(results, failureModeEnabled)}
          correctIcon={quizCorrectIcon}
          incorrectIcon={quizIncorrectIcon}
          hideAlt
        >
          {mode === 'learn' && (
            <>
              <AnimalPortrait animal={animal} theme={theme} compact />
              <FactGrid facts={getTeachingFacts(animal)} theme={theme} />
            </>
          )}

          {mode === 'solo' && (
            <>
              <FactGrid
                facts={getTeachingFacts(animal).slice(0, visibleSoloClues)}
                theme={theme}
              />
              <div
                aria-label="Animal choices"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 8,
                  width: '100%',
                }}
              >
                {answerChoices
                  .filter((choice) => !dismissedChoices.includes(choice.name))
                  .map((choice) => {
                    const isWrong = leavingChoice === choice.name
                    const isCorrect =
                      answeredCorrectly && choice.name === animal.name
                    return (
                      <button
                        key={choice.name}
                        type="button"
                        onClick={() => handleSoloChoice(choice)}
                        disabled={Boolean(leavingChoice) || answeredCorrectly}
                        aria-label={formatAnimalName(choice.name)}
                        style={{
                          minHeight: 126,
                          padding: 5,
                          borderRadius: 20,
                          border: `4px solid ${
                            isCorrect
                              ? theme.colors.primary
                              : isWrong
                                ? theme.colors.secondary
                                : theme.colors.accent
                          }`,
                          background: theme.colors.surface,
                          color: theme.colors.text,
                          fontFamily: theme.fonts.heading,
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          animation: isWrong
                            ? 'animal-choice-fly-away 0.65s ease-in forwards'
                            : isCorrect
                              ? 'animal-choice-pop 0.32s ease both'
                              : undefined,
                        }}
                      >
                        <img
                          src={choice.image}
                          alt=""
                          style={{
                            width: '100%',
                            height: 84,
                            objectFit: 'contain',
                          }}
                        />
                        {formatAnimalName(choice.name)}
                        {isCorrect ? ' ✓' : isWrong ? ' ✕' : ''}
                      </button>
                    )
                  })}
              </div>
            </>
          )}

          {mode === 'together' && togetherPhase === 'keeper' && (
            <>
              <SectionHeading symbol="🤫" title="Secret" theme={theme} />
              <AnimalPortrait animal={animal} theme={theme} compact />
              <FactGrid facts={getTeachingFacts(animal)} theme={theme} />
              <PrimaryAction
                label="Hide"
                icon="🙈"
                onClick={() => setTogetherPhase('questions')}
                theme={theme}
              />
            </>
          )}

          {mode === 'together' && togetherPhase === 'questions' && (
            <>
              <SectionHeading symbol="❓" title="Guess" theme={theme} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  width: '100%',
                }}
              >
                {QUESTION_PROMPTS.map(([illustration, prompt]) => (
                  <div
                    key={prompt}
                    style={{
                      minHeight: 104,
                      padding: 10,
                      borderRadius: 22,
                      border: `3px solid ${theme.colors.accent}`,
                      background: theme.colors.surface,
                      color: theme.colors.text,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      textAlign: 'center',
                      fontFamily: theme.fonts.body,
                      fontWeight: 800,
                      lineHeight: 1.18,
                    }}
                  >
                    <img
                      src={illustration}
                      alt=""
                      style={{
                        width: '100%',
                        height: 80,
                        objectFit: 'contain',
                      }}
                    />
                    {prompt}
                  </div>
                ))}
              </div>
              <PrimaryAction
                label="Reveal"
                icon="👀"
                onClick={() => setTogetherPhase('answer')}
                theme={theme}
              />
            </>
          )}

          {mode === 'together' && togetherPhase === 'answer' && (
            <>
              <SectionHeading symbol="🎉" title="Answer" theme={theme} />
              <AnimalPortrait animal={animal} theme={theme} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  width: '100%',
                }}
              >
                <ActionButton
                  label="Again"
                  icon="❓"
                  theme={theme}
                  color={theme.colors.secondary}
                  onClick={() => setTogetherPhase('questions')}
                  hideArrow
                  styleOverride={{
                    height: 72,
                    fontSize: 17,
                    padding: '0 12px',
                  }}
                />
                <ActionButton
                  label={animalIndex + 1 >= totalProblems ? 'Finish' : 'Next'}
                  icon="🐾"
                  theme={theme}
                  color={theme.colors.primary}
                  onClick={() => finishAnimal()}
                  hideArrow
                  styleOverride={{
                    height: 72,
                    fontSize: 17,
                    padding: '0 12px',
                  }}
                />
              </div>
            </>
          )}
        </ActivityPlayArea>
      )}
      <style>{`
        @keyframes animal-choice-pop {
          0% { transform: scale(0.88); }
          70% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        @keyframes animal-choice-fly-away {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          70% { transform: translateY(-44px) rotate(18deg) scale(0.8); opacity: 0.7; }
          100% { transform: translateY(-84px) rotate(28deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </ActivityOutcomeShell>
  )
}

export { ANIMAL_CATALOG }
export default AnimalTester
