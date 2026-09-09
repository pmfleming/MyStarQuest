import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import animalCollection from '../../data/creatureCollections/animals'
import type {
  CatalogAnimal,
  CreatureCollection,
} from '../../data/creatureCollections/types'
import {
  getActivityMistakeUpdate,
  getActivityOutcome,
  type ActivityResult,
} from '../../lib/activityOutcome'
import { celebrateSuccess } from '../../lib/celebrate'
import { preloadImage } from '../../lib/imageLoading'
import type { ActivityChoreProps } from '../ui/ActivityControls'
import { useCreatureCollection } from './useCreatureCollection'

export type AnimalMode = 'learn' | 'solo' | 'together'
export type AnimalDifficulty = 'easy' | 'hard'
const CHOICE_ANIMATION_MS = 650
const CLUE_REVEAL_INTERVAL_MS = 3000
const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 9
const shuffle = <T>(items: readonly T[]) =>
  [...items].sort(() => Math.random() - 0.5)
const getActiveAnimalOrder = (
  mode: AnimalMode,
  catalog: CatalogAnimal[],
  shuffledOrder: CatalogAnimal[],
  itemLimit: number
) => (mode === 'learn' ? catalog : shuffledOrder.slice(0, itemLimit))

type RoundState = {
  animalIndex: number
  leavingChoice: string | null
  dismissedChoices: string[]
  answeredCorrectly: boolean
  visibleSoloClues: number
  isTogetherAnimalHidden: boolean
  isGenericLearnAbilityShown: boolean
}
const EMPTY_ROUND: RoundState = {
  animalIndex: 0,
  leavingChoice: null,
  dismissedChoices: [],
  answeredCorrectly: false,
  visibleSoloClues: 1,
  isTogetherAnimalHidden: false,
  isGenericLearnAbilityShown: false,
}

export function useAnimalSession({
  theme,
  totalProblems,
  isRunning,
  isCompleted = false,
  isFailed = false,
  onComplete,
  onExit,
  onFail,
  failureModeEnabled = true,
}: ActivityChoreProps) {
  const [mode, setMode] = useState<AnimalMode>('learn')
  const [difficulty, setDifficulty] = useState<AnimalDifficulty>('easy')
  const [animalOrder, setAnimalOrder] = useState(() =>
    shuffle(animalCollection.catalog)
  )
  const [results, setResults] = useState<ActivityResult[]>([])
  const [round, setRound] = useState(EMPTY_ROUND)
  const { animalIndex, leavingChoice, dismissedChoices, answeredCorrectly } =
    round
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetPlayState = useCallback((catalog: CatalogAnimal[]) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    setAnimalOrder(shuffle(catalog))
    setResults([])
    setRound(EMPTY_ROUND)
  }, [])
  const moveAnimal = useCallback((delta: number) => {
    setRound((previous) => ({
      ...EMPTY_ROUND,
      animalIndex: Math.max(0, previous.animalIndex + delta),
    }))
  }, [])
  const {
    collection,
    collectionError,
    isCollectionLoading,
    data: { catalog, getTeachingFacts },
    changeCollection: selectCollection,
  } = useCreatureCollection(resetPlayState)
  const isSetup = !isRunning && !isCompleted
  const { isSuccessState, isFinished } = getActivityOutcome({
    isCompleted,
    isFailed,
    failureModeEnabled,
    results,
  })

  const itemLimit = Math.min(
    Math.max(totalProblems, MIN_PROBLEMS),
    MAX_PROBLEMS,
    catalog.length
  )
  const activeAnimalOrder = getActiveAnimalOrder(
    mode,
    catalog,
    animalOrder,
    itemLimit
  )
  const animal = activeAnimalOrder[animalIndex]
  const nextAnimal = activeAnimalOrder[animalIndex + 1]
  const isLastAnimal = animalIndex + 1 >= activeAnimalOrder.length

  useEffect(() => {
    if (!isRunning || isFinished || !nextAnimal) return
    // Warm only the next round, with low fetch priority so current art wins.
    preloadImage(nextAnimal.image)
    for (const fact of getTeachingFacts(nextAnimal, theme.id)) {
      if (fact.illustration) preloadImage(fact.illustration)
    }
  }, [getTeachingFacts, isFinished, isRunning, nextAnimal, theme.id])

  const answerChoices = useMemo(() => {
    if (!animal) return []
    const alternatives = shuffle(
      catalog.filter(
        (candidate) =>
          candidate.name !== animal.name &&
          !(
            animal.kind === 'teenieping' &&
            candidate.kind === 'teenieping' &&
            candidate.identity === animal.identity
          )
      )
    ).slice(0, 2)
    return shuffle([animal, ...alternatives])
  }, [animal, catalog])

  const collectionLocked = isRunning && mode !== 'learn'
  const changeCollection = (next: CreatureCollection) => {
    if (!collectionLocked || next === collection) selectCollection(next)
  }

  useEffect(() => {
    if (!isRunning && !isCompleted) {
      const frame = requestAnimationFrame(() => resetPlayState(catalog))
      return () => cancelAnimationFrame(frame)
    }
  }, [catalog, isCompleted, isRunning, resetPlayState])

  const finishAnimal = () => {
    setResults((previous) => [...previous, 'correct'])
    if (isLastAnimal) onComplete()
    else moveAnimal(1)
  }

  const exitUnscoredMode = onExit ?? onComplete

  const showNextUnscoredAnimal = () => {
    if (isLastAnimal) {
      exitUnscoredMode()
      return
    }
    moveAnimal(1)
  }

  useEffect(() => {
    if (!isRunning || isFinished || mode !== 'solo' || !animal) return

    let revealedClues = 1
    const clueCount = getTeachingFacts(animal, theme.id).length
    const timer = setInterval(() => {
      revealedClues += 1
      setRound((previous) => ({ ...previous, visibleSoloClues: revealedClues }))
      if (revealedClues >= clueCount) clearInterval(timer)
    }, CLUE_REVEAL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [animal, getTeachingFacts, isFinished, isRunning, mode, theme.id])

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    },
    []
  )

  const handleSoloChoice = (choice: CatalogAnimal) => {
    if (!animal) return

    if (
      answeredCorrectly ||
      leavingChoice ||
      dismissedChoices.includes(choice.name)
    )
      return

    if (choice.name === animal.name) {
      setRound((previous) => ({ ...previous, answeredCorrectly: true }))
      celebrateSuccess()
      feedbackTimer.current = setTimeout(finishAnimal, CHOICE_ANIMATION_MS)
      return
    }

    setRound((previous) => ({ ...previous, leavingChoice: choice.name }))
    const mistake = getActivityMistakeUpdate(results, failureModeEnabled)
    setResults(mistake.nextResults)

    feedbackTimer.current = setTimeout(() => {
      setRound((previous) => ({
        ...previous,
        dismissedChoices: [...previous.dismissedChoices, choice.name],
        leavingChoice: null,
      }))
      if (mistake.shouldFail) onFail?.()
    }, CHOICE_ANIMATION_MS)
  }

  return {
    collection,
    collectionError,
    isCollectionLoading,
    collectionLocked,
    changeCollection,
    mode,
    setMode,
    difficulty,
    setDifficulty,
    results,
    isSetup,
    isSuccessState,
    isFinished,
    animal,
    playProps: {
      ...round,
      getTeachingFacts,
      mode,
      difficulty,
      animalIndex,
      isLastAnimal,
      answerChoices,
      onPrevious: () => moveAnimal(-1),
      onNext: showNextUnscoredAnimal,
      onSoloChoice: handleSoloChoice,
      onToggleAnimal: () =>
        setRound((previous) => ({
          ...previous,
          isTogetherAnimalHidden: !previous.isTogetherAnimalHidden,
        })),
      onToggleLearnAbility: () =>
        setRound((previous) => ({
          ...previous,
          isGenericLearnAbilityShown: !previous.isGenericLearnAbilityShown,
        })),
    },
  }
}
