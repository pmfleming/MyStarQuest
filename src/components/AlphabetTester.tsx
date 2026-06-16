import { useState, useEffect, useCallback, useRef } from 'react'
import { uiTokens } from '../tokens'
import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { celebrateSuccess } from '../lib/celebrate'
import { useProblemHistory } from '../lib/useProblemHistory'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
  MAX_ACTIVITY_MISTAKES,
  type ActivityResult,
} from './ui/ActivityControls'

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
const FAILURE_TRANSITION_DELAY_MS = 3000

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
  const [problemIndex, setProblemIndex] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [currentTarget, setCurrentTarget] = useState('')
  const [currentImage, setCurrentImage] = useState('')
  const [currentChoices, setCurrentChoices] = useState<string[]>([])
  const { isSeen, markSeen, clearHistory } = useProblemHistory()
  const [resultHistory, setResultHistory] = useState<ActivityResult[]>([])
  const [isFailurePending, setIsFailurePending] = useState(false)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [wrongChoice, setWrongChoice] = useState<string | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSetup = !isRunning && !isCompleted
  const incorrectCount = resultHistory.filter((r) => r === 'incorrect').length
  const hasFailedByHistory =
    failureModeEnabled && incorrectCount >= MAX_ACTIVITY_MISTAKES
  const isFailedState =
    failureModeEnabled && isCompleted && (isFailed || hasFailedByHistory)
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
      if (failureModeEnabled) {
        setResultHistory((prev) => [...prev, 'incorrect'])
      }
      const nextRetryCount = retryCount + 1
      setRetryCount(nextRetryCount)

      if (failureModeEnabled && nextRetryCount >= MAX_ACTIVITY_MISTAKES) {
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
    <ActivityOutcomeShell
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      successAlt="Great job!"
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
        previousAriaLabel="Fewer problems"
        nextAriaLabel="More problems"
        isEditable={isEditable}
        starMax={10}
        starStyle={{ marginTop: uiTokens.singleVerticalSpace }}
      />

      {isRunning && (
        <ActivityPlayArea
          theme={theme}
          results={
            failureModeEnabled
              ? resultHistory
              : resultHistory.filter((result) => result === 'correct')
          }
          correctIcon={quizCorrectIcon}
          incorrectIcon={quizIncorrectIcon}
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
                  {letter}
                  {letter.toLowerCase()}
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
