import { useState, useEffect, useCallback, useRef } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import StepperButton from './ui/StepperButton'
import StarDisplay from './ui/StarDisplay'
import ChoreOutcomeView from './ChoreOutcomeView'
import { uiTokens } from '../tokens'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { celebrateSuccess } from '../lib/celebrate'
import { useProblemHistory } from '../lib/useProblemHistory'

// Import all alphabet SVGs
import antAardvarkAntelope from '../assets/alphabet/ant-aardvark-antelope.svg'
import appleAvocadoAsparagus from '../assets/alphabet/apple-avocado-asparagus.svg'
import bananaBlueberryBrocolli from '../assets/alphabet/banana-blueberry-brocolli.svg'
import batBeaverButterfly from '../assets/alphabet/bat-bever-butterfly.svg'
import carrotCornCucumber from '../assets/alphabet/carrot-corn-cucumber.svg'
import catCamelCow from '../assets/alphabet/cat-camel-cow.svg'
import datesDandelionsDumplings from '../assets/alphabet/dates-dandelions-dumplings.svg'
import dogDolphinDuckling from '../assets/alphabet/dog-dophin-duckling.svg'
import eggrollsEclairsEggs from '../assets/alphabet/eggrolls-eclairs-eggs.svg'
import elephantEagleEchidna from '../assets/alphabet/elephant-eagle-echidna.svg'
import fennelFigFish from '../assets/alphabet/fennel-fig-fish.svg'
import foxFrogFlamingo from '../assets/alphabet/fox-frog-flamingo.svg'
import geckoGuineaPigGoat from '../assets/alphabet/gecko-guinea pig,-goat.svg'
import gelatoGnocchiGrapes from '../assets/alphabet/gelato-gnocci-grapes.svg'
import hippopotamusHamsterHummingBird from '../assets/alphabet/hippopotamus-hamster-humming bird.svg'
import honeyHazelnutsHamburger from '../assets/alphabet/honey-hazelnuts-hamburger.svg'
import ibisIguanaImpala from '../assets/alphabet/Ibis-iguana-impala.svg'
import icePopInstantNoodlesIceCream from '../assets/alphabet/ice pop-instant noodles-ice cream.svg'
import jackfruitJamJalapeno from '../assets/alphabet/Jackfruit-jam-Jalapeño.svg'
import jaguarJellyFishJackal from '../assets/alphabet/jaguar-jelly fish-jackal.svg'
import kangarooKoalaKiwi from '../assets/alphabet/kangaroo-koala-kiwi.svg'
import kiwiKaleKetchup from '../assets/alphabet/kiwi-kale-ketchup.svg'
import lasagneLollipopLemonade from '../assets/alphabet/lasagne-lollipop-lemonade.svg'
import lemonlimeLycheeLettuce from '../assets/alphabet/lemonlime-lychee-lettuce.svg'
import lionLlamaLemur from '../assets/alphabet/lion-llama-lemur.svg'
import lobsterLadybugLeopard from '../assets/alphabet/lobster-ladybug-leopard.svg'
import mangoMelonMuffin from '../assets/alphabet/mango-melon-muffin.svg'
import mouseMeerkatManatee from '../assets/alphabet/mouse-meerkat-manatee.svg'
import mushroomMeatballsMacaroni from '../assets/alphabet/mushroom-meatballs-macaroni.svg'
import narwhalNewtNautilus from '../assets/alphabet/narwhal-newt-nautilus.svg'
import noodlesNachosNougat from '../assets/alphabet/noodles-nachos-nougat.svg'
import oatsOliveOilOnigiri from '../assets/alphabet/oats-olive oil-onigiri.svg'
import omeletteOystersOliveOil from '../assets/alphabet/omelette-oysters-olive oil.svg'
import orangeOliveOnion from '../assets/alphabet/orange-olive-onion.svg'
import orangutanOtterOwl from '../assets/alphabet/orangutan-otter-owl.svg'
import owlOstrichOctopus from '../assets/alphabet/owl-ostrich-octopus.svg'
import pancakesPopcornPeanutButter from '../assets/alphabet/pancakes-popcorn-peanut butter.svg'
import passionFruitPapayaPlum from '../assets/alphabet/passion fruit-papaya-plum.svg'
import peachPearPineapple from '../assets/alphabet/peach-pear-pineapple.svg'
import peacockPlatypusPorcupine from '../assets/alphabet/peacock-platypus-porcupine.svg'
import pestoProsciuttoParmesan from '../assets/alphabet/pesto-prosciutto-parmesan.svg'
import pigPenguinPanda from '../assets/alphabet/pig-penguin-panda.svg'
import potatoParsnipPumpkin from '../assets/alphabet/potato-parsnip-pumpkin.svg'
import quinoaQuicheQuesadilla from '../assets/alphabet/quinoa-quiche-quesadilla.svg'
import radishRhubarbRocket from '../assets/alphabet/radish-rhubarb-rocket.svg'
import ramenRavioliRisotto from '../assets/alphabet/ramen-ravioli-risotto.svg'
import sandwichSausageSoup from '../assets/alphabet/sandwich-sausage-soup.svg'
import sashimiSushiSeaweed from '../assets/alphabet/sashimi-sushi-seaweed.svg'
import seaweedSpinachSweetPotato from '../assets/alphabet/seaweed-spinach-sweet potato.svg'
import tartToffeeToast from '../assets/alphabet/tart-toffee-toast.svg'
import tomatoTurnipTruffle from '../assets/alphabet/tomato-turnip-truffle.svg'
import wafflesWontonSoupWrap from '../assets/alphabet/waffles-wonton soup-wrap.svg'
import yogurtYorkshirePudding from '../assets/alphabet/yogurt-yorkshire pudding.svg'
import rabbitRacoonReindeer from '../assets/alphabet/rabbit-racoon-reindeer.svg'
import rhinocerosRayRedPanda from '../assets/alphabet/rhinoceros-ray-red panda.svg'
import seaHorseSquidStarFish from '../assets/alphabet/sea horse-squid-star fish.svg'
import sealSharkSalmon from '../assets/alphabet/seal-shark-salmon.svg'
import sheepSkunkSquirrel from '../assets/alphabet/sheep-skunk-squirrel.svg'
import swanSpiderSloth from '../assets/alphabet/swan-spider-sloth.svg'
import tigerTortoiseTurtleTapir from '../assets/alphabet/tiger,tortoise turtle,tapir.svg'
import unicornUrialUromastyx from '../assets/alphabet/unicorn-urial-uromastyx.svg'
import viperVoleVulture from '../assets/alphabet/viper-vole-vulture.svg'
import walrusWhaleWorm from '../assets/alphabet/walrus-whale-worm.svg'
import waspWeaselWoodpecker from '../assets/alphabet/wasp-weasel-woodpecker.svg'
import wolfWeaselWarthog from '../assets/alphabet/wolf-weasel-warthog.svg'
import yakYeti from '../assets/alphabet/yak-yeti.svg'
import zebra from '../assets/alphabet/zebra.svg'

/* ------------------------------------------------------------------ */
/*  Constants & Assets                                                 */
/* ------------------------------------------------------------------ */

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 10
const CELEBRATION_DELAY_MS = 1500
const SHAKE_DURATION_MS = 600
const MAX_MISTAKES = 3
const FAILURE_TRANSITION_DELAY_MS = 3000

const {
  statusBarHeight: STATUS_BAR_HEIGHT,
  statusIconSize: STATUS_ICON_SIZE,
  statusIconGap: STATUS_ICON_GAP,
} = uiTokens.activityTokens

const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth
const STATUS_BAR_HORIZONTAL_PADDING = 12

const ALPHABET_ASSETS = [
  { letter: 'A', files: [antAardvarkAntelope, appleAvocadoAsparagus] },
  { letter: 'B', files: [bananaBlueberryBrocolli, batBeaverButterfly] },
  { letter: 'C', files: [carrotCornCucumber, catCamelCow] },
  { letter: 'D', files: [datesDandelionsDumplings, dogDolphinDuckling] },
  { letter: 'E', files: [eggrollsEclairsEggs, elephantEagleEchidna] },
  { letter: 'F', files: [fennelFigFish, foxFrogFlamingo] },
  { letter: 'G', files: [geckoGuineaPigGoat, gelatoGnocchiGrapes] },
  {
    letter: 'H',
    files: [hippopotamusHamsterHummingBird, honeyHazelnutsHamburger],
  },
  { letter: 'I', files: [ibisIguanaImpala, icePopInstantNoodlesIceCream] },
  { letter: 'J', files: [jackfruitJamJalapeno, jaguarJellyFishJackal] },
  { letter: 'K', files: [kangarooKoalaKiwi, kiwiKaleKetchup] },
  {
    letter: 'L',
    files: [
      lasagneLollipopLemonade,
      lemonlimeLycheeLettuce,
      lionLlamaLemur,
      lobsterLadybugLeopard,
    ],
  },
  {
    letter: 'M',
    files: [mangoMelonMuffin, mouseMeerkatManatee, mushroomMeatballsMacaroni],
  },
  { letter: 'N', files: [narwhalNewtNautilus, noodlesNachosNougat] },
  {
    letter: 'O',
    files: [
      oatsOliveOilOnigiri,
      omeletteOystersOliveOil,
      orangeOliveOnion,
      orangutanOtterOwl,
      owlOstrichOctopus,
    ],
  },
  {
    letter: 'P',
    files: [
      pancakesPopcornPeanutButter,
      passionFruitPapayaPlum,
      peachPearPineapple,
      peacockPlatypusPorcupine,
      pestoProsciuttoParmesan,
      pigPenguinPanda,
      potatoParsnipPumpkin,
    ],
  },
  { letter: 'Q', files: [quinoaQuicheQuesadilla] },
  {
    letter: 'R',
    files: [
      radishRhubarbRocket,
      ramenRavioliRisotto,
      rabbitRacoonReindeer,
      rhinocerosRayRedPanda,
    ],
  },
  {
    letter: 'S',
    files: [
      sandwichSausageSoup,
      sashimiSushiSeaweed,
      seaweedSpinachSweetPotato,
      seaHorseSquidStarFish,
      sealSharkSalmon,
      sheepSkunkSquirrel,
      swanSpiderSloth,
    ],
  },
  {
    letter: 'T',
    files: [tartToffeeToast, tomatoTurnipTruffle, tigerTortoiseTurtleTapir],
  },
  { letter: 'U', files: [unicornUrialUromastyx] },
  { letter: 'V', files: [viperVoleVulture] },
  {
    letter: 'W',
    files: [
      wafflesWontonSoupWrap,
      walrusWhaleWorm,
      waspWeaselWoodpecker,
      wolfWeaselWarthog,
    ],
  },
  { letter: 'Y', files: [yogurtYorkshirePudding, yakYeti] },
  { letter: 'Z', files: [zebra] },
]

const ALL_LETTERS = ALPHABET_ASSETS.map((asset) => asset.letter)
const SETUP_FIELD_GAP = uiTokens.singleVerticalSpace

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateAlphabetProblem(): {
  letter: string
  image: string
  choices: string[]
} {
  const targetIdx = Math.floor(Math.random() * ALPHABET_ASSETS.length)
  const targetData = ALPHABET_ASSETS[targetIdx]
  const fileIdx = Math.floor(Math.random() * targetData.files.length)
  const image = targetData.files[fileIdx]
  const letter = targetData.letter

  const choices = [letter]
  const others = ALL_LETTERS.filter((l) => l !== letter)
  while (choices.length < 3) {
    const rand = others[Math.floor(Math.random() * others.length)]
    if (!choices.includes(rand)) choices.push(rand)
  }
  choices.sort(() => Math.random() - 0.5)

  return { letter, image, choices }
}

function getStatusIconOverlap(iconCount: number): number {
  if (iconCount <= 1) return 0
  const availableWidth = CONTROL_ROW_WIDTH - STATUS_BAR_HORIZONTAL_PADDING
  const naturalWidth =
    iconCount * STATUS_ICON_SIZE + (iconCount - 1) * STATUS_ICON_GAP

  if (naturalWidth <= availableWidth) return 0

  const requiredOverlap =
    (naturalWidth - availableWidth) / Math.max(1, iconCount - 1)

  return Math.min(STATUS_ICON_SIZE * 0.72, Math.max(0, requiredOverlap))
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface AlphabetTesterProps {
  theme: Theme
  totalProblems: number
  starReward: number
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
}

const AlphabetTester = ({
  theme,
  totalProblems,
  starReward,
  isRunning,
  isCompleted = false,
  isFailed = false,
  onAdjustProblems,
  onStarsChange,
  onComplete,
  onFail,
  completionImage,
  failureImage,
}: AlphabetTesterProps) => {
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [currentTarget, setCurrentTarget] = useState('')
  const [currentImage, setCurrentImage] = useState('')
  const [currentChoices, setCurrentChoices] = useState<string[]>([])
  const { isSeen, markSeen, clearHistory } = useProblemHistory()
  const [resultHistory, setResultHistory] = useState<
    Array<'correct' | 'incorrect'>
  >([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongChoice, setWrongChoice] = useState<string | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter((r) => r === 'incorrect').length
  const hasFailedByHistory = incorrectCount >= MAX_MISTAKES
  const isFailedState = isCompleted && (isFailed || hasFailedByHistory)
  const isSuccessState = isCompleted && !isFailedState
  const isFinished = isSuccessState || isFailedState

  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  const nextProblem = useCallback(() => {
    let p = generateAlphabetProblem()
    let attempts = 0
    while (isSeen(p.letter) && attempts < 10) {
      p = generateAlphabetProblem()
      attempts++
    }
    markSeen(p.letter)
    setCurrentTarget(p.letter)
    setCurrentImage(p.image)
    setCurrentChoices(p.choices)
    setFeedback('idle')
    setWrongChoice(null)
  }, [isSeen, markSeen])

  useEffect(() => {
    if (
      isRunning &&
      problemIndex === 0 &&
      feedback === 'idle' &&
      !currentTarget
    ) {
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      nextProblem()
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
      const nextSuccess = successCount + 1
      setSuccessCount(nextSuccess)

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
      setResultHistory((prev) => [...prev, 'incorrect'])
      const nextRetryCount = retryCount + 1
      setRetryCount(nextRetryCount)

      if (nextRetryCount >= MAX_MISTAKES) {
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
      clearHistory()
      setProblemIndex(0)
      setSuccessCount(0)
      setRetryCount(0)
      setCurrentTarget('')
      setCurrentImage('')
      setCurrentChoices([])
      setResultHistory([])
      setIsFailurePending(false)
      setFeedback('idle')
      setWrongChoice(null)
    }
  }, [isRunning, isCompleted, clearHistory])

  return (
    <div
      className="flex w-full flex-col items-center"
      style={{ gap: uiTokens.sectionGap }}
    >
      {isFinished ? (
        <ChoreOutcomeView
          imageSrc={isSuccessState ? completionImage : failureImage}
          outcome={isSuccessState ? 'success' : 'failure'}
          successAlt="Great job!"
          failureAlt="Keep trying!"
        />
      ) : (
        <>
          {/* ---- SETUP UI ---- */}
          {isSetup && (
            <div
              className="flex flex-col items-center"
              style={{
                gap: SETUP_FIELD_GAP,
                width: CONTROL_ROW_WIDTH,
                maxWidth: '100%',
              }}
            >
              <div
                className="flex w-full flex-col items-center"
                style={{ gap: 0 }}
              >
                <div className="flex w-full items-center justify-center">
                  <StepperButton
                    theme={theme}
                    direction="prev"
                    onClick={() => onAdjustProblems(-1)}
                    disabled={totalProblems <= MIN_PROBLEMS}
                    ariaLabel="Fewer problems"
                  />
                  <div className="flex flex-1 flex-col items-center">
                    <span
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontWeight: 'bold',
                        fontSize: 42,
                        color: theme.colors.primary,
                        lineHeight: 1,
                      }}
                    >
                      {totalProblems}
                    </span>
                  </div>
                  <StepperButton
                    theme={theme}
                    direction="next"
                    onClick={() => onAdjustProblems(1)}
                    disabled={totalProblems >= MAX_PROBLEMS}
                    ariaLabel="More problems"
                  />
                </div>
              </div>
            </div>
          )}

          {isSetup && (
            <div
              className="flex flex-col items-center"
              style={{
                gap: 0,
                width: CONTROL_ROW_WIDTH,
                maxWidth: '100%',
                marginTop: uiTokens.singleVerticalSpace,
              }}
            >
              <StarDisplay
                theme={theme}
                count={starReward}
                editable
                onChange={onStarsChange}
                min={1}
                max={10}
              />
            </div>
          )}

          {/* ---- PLAY AREA ---- */}
          {isRunning && (
            <div
              className="flex flex-col items-center"
              style={{ gap: 8, width: CONTROL_ROW_WIDTH, maxWidth: '100%' }}
            >
              {/* Scoreboard */}
              <div
                className="flex w-full items-center justify-center"
                style={{
                  background: `${theme.colors.primary}12`,
                  height: STATUS_BAR_HEIGHT,
                  borderRadius: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  className="flex h-full w-full items-center justify-center overflow-hidden"
                  style={{ gap: STATUS_ICON_GAP }}
                >
                  {resultHistory.map((result, index) => {
                    const overlap = getStatusIconOverlap(resultHistory.length)
                    return (
                      <img
                        key={`result-${index}`}
                        src={
                          result === 'correct'
                            ? quizCorrectIcon
                            : quizIncorrectIcon
                        }
                        alt=""
                        style={{
                          width: STATUS_ICON_SIZE,
                          height: STATUS_ICON_SIZE,
                          marginLeft: index === 0 ? 0 : -overlap,
                          objectFit: 'contain',
                        }}
                      />
                    )
                  })}
                </div>
              </div>

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
                        animation: isChoiceWrong
                          ? 'shake 0.4s ease'
                          : undefined,
                        cursor: 'pointer',
                      }}
                    >
                      {letter}
                      {letter.toLowerCase()}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
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
    </div>
  )
}

export default AlphabetTester
