import {
  useAnimalSession,
  type AnimalMode,
  type AnimalDifficulty,
} from './animalTester/useAnimalSession'
import { CREATURE_MODE_IMAGES } from './animalTester/modeArtwork'
import insectCollectionImage from '../assets/animals/butterfly.webp'
import animalCollectionImage from '../assets/animals/lion.webp'
import teeniepingCollectionImage from '../assets/teenie/heart.webp'
import { getAnimalCardLabel } from '../data/animalCardLabels'
import { TEENIEPING_COLLECTION_AVAILABLE } from '../data/creatureCollections/availability'
import type {
  CatalogAnimal,
  CreatureCollectionData,
  VisualFact,
} from '../data/creatureCollections/types'
import { getVisibleActivityResults } from '../lib/activityOutcome'
import { uiTokens } from '../tokens'
import { getThemeAsset } from '../ui/themeAssets'
import './AnimalTester.css'
import ActionButton from './ui/ActionButton'
import {
  ActivityOutcomeShell,
  ActivityPlayArea,
  ActivitySetupControls,
  type ActivityChoreProps,
} from './ui/ActivityControls'
import CrownDifficultyControl, {
  type CrownDifficultyOption,
} from './ui/CrownDifficultyControl'
import { usePrimaryActionImage } from './ui/PrimaryActionImageContext'
import ResourceLoadingIcon from './ui/ResourceLoadingIcon'
import SegmentedChoiceControl from './ui/SegmentedChoiceControl'
import { getChoiceFeedbackAnimationStyles } from './ui/activityAnimationStyles'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 9
const COLLECTION_LABELS = {
  animals: 'Animal',
  insects: 'Insect',
  teeniepings: 'Teenieping',
}

const MODE_OPTIONS = [
  {
    value: 'learn' as const,
    label: 'Learn',
  },
  {
    value: 'solo' as const,
    label: '1 Player',
  },
  {
    value: 'together' as const,
    label: '2 Players',
  },
]

const ANIMAL_DIFFICULTIES: CrownDifficultyOption<AnimalDifficulty>[] = [
  { value: 'easy', label: 'Easy', crowns: 1 },
  { value: 'hard', label: 'Hard', crowns: 2 },
]

const formatAnimalName = (name: string) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const FactCard = ({
  fact,
  theme,
  onClick,
  isPressed = false,
}: {
  fact: VisualFact
  theme: ActivityChoreProps['theme']
  onClick?: () => void
  isPressed?: boolean
}) => {
  const CardElement = onClick ? 'button' : 'div'

  return (
    <CardElement
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? isPressed : undefined}
      aria-label={`${fact.label}: ${fact.text}`}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        padding: 0,
        borderRadius: 22,
        border: `3px solid ${theme.colors.accent}`,
        background: theme.colors.surface,
        color: theme.colors.text,
        boxShadow: `0 5px 0 ${theme.colors.accent}66`,
        fontFamily: theme.fonts.body,
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        textAlign: 'center',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      {fact.illustration ? (
        <img
          data-animal-fact-image
          src={fact.illustration}
          decoding="async"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: fact.wrapCaption
              ? 'cover'
              : (fact.illustrationFit ?? 'cover'),
            ...(fact.detailPosition
              ? {
                  objectPosition: fact.detailPosition,
                  transform: `scale(${fact.detailScale ?? 2.1})`,
                  transformOrigin: fact.detailPosition,
                }
              : {}),
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 'clamp(5rem, 30vw, 9rem)',
            lineHeight: 1,
          }}
        >
          {fact.visual}
        </span>
      )}
      {fact.word && (
        <strong
          data-animal-fact-word
          style={{
            position: 'absolute',
            zIndex: 1,
            left: 0,
            bottom: 0,
            width: '100%',
            boxSizing: 'border-box',
            padding: '5px 8px',
            border: `2px solid ${theme.colors.surface}`,
            borderRadius: 999,
            background: `${theme.colors.surface}80`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.28)',
            fontFamily: theme.fonts.heading,
            fontSize: 'clamp(0.72rem, 2.6vw, 1rem)',
            color: theme.colors.text,
            lineHeight: 1.1,
            overflow: 'hidden',
            whiteSpace: fact.wrapCaption ? 'normal' : 'nowrap',
            ...(fact.wrapCaption
              ? {
                  fontSize: 'clamp(0.66rem, 2.4vw, 0.9rem)',
                }
              : {}),
          }}
        >
          {getAnimalCardLabel(fact.word)}
        </strong>
      )}
    </CardElement>
  )
}

const FactGrid = ({
  facts,
  theme,
  onAbilityClick,
  isGenericAbilityShown = false,
}: {
  facts: VisualFact[]
  theme: ActivityChoreProps['theme']
  onAbilityClick?: () => void
  isGenericAbilityShown?: boolean
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
      <FactCard
        key={`${fact.label}-${fact.text}`}
        fact={fact}
        theme={theme}
        onClick={fact.isAbility ? onAbilityClick : undefined}
        isPressed={Boolean(fact.isAbility && isGenericAbilityShown)}
      />
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
      decoding="async"
      alt={showName ? formatAnimalName(animal.name) : `Mystery ${animal.kind}`}
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

const HideableAnimalPortrait = ({
  animal,
  theme,
  hiddenImage,
  hidden,
  onToggle,
}: {
  animal: CatalogAnimal
  theme: ActivityChoreProps['theme']
  hiddenImage: string
  hidden: boolean
  onToggle: () => void
}) => {
  return (
    <button
      type="button"
      aria-label={`${hidden ? 'Show' : 'Hide'} ${animal.kind}`}
      aria-pressed={hidden}
      onClick={onToggle}
      style={{
        width: '100%',
        padding: 0,
        border: 0,
        borderRadius: 26,
        background: 'transparent',
        cursor: 'pointer',
      }}
    >
      {hidden ? (
        <div
          style={{
            width: '100%',
            minHeight: 170,
            borderRadius: 26,
            background: `${theme.colors.surface}dd`,
            border: `3px solid ${theme.colors.secondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 8,
            boxSizing: 'border-box',
          }}
        >
          <img
            src={hiddenImage}
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: 132, objectFit: 'contain' }}
          />
        </div>
      ) : (
        <AnimalPortrait animal={animal} theme={theme} compact />
      )}
    </button>
  )
}

const NavigationArrow = ({ direction }: { direction: 'previous' | 'next' }) => (
  <svg
    viewBox="0 0 48 48"
    width="38"
    height="38"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d={direction === 'previous' ? 'M30 10 16 24l14 14' : 'm18 10 14 14-14 14'}
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const LearningNavigation = ({
  creatureName,
  theme,
  canGoPrevious,
  isLastAnimal,
  onPrevious,
  onNext,
}: {
  creatureName: string
  theme: ActivityChoreProps['theme']
  canGoPrevious: boolean
  isLastAnimal: boolean
  onPrevious: () => void
  onNext: () => void
}) => (
  <div
    className="activity-inline-action-row"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: uiTokens.actionRowGap,
      width: '100%',
      height: uiTokens.listActionHeight,
    }}
  >
    <ActionButton
      label={`Previous ${creatureName}`}
      icon={null}
      theme={theme}
      color={theme.colors.primary}
      onClick={onPrevious}
      disabled={!canGoPrevious}
      hideArrow
      content={<NavigationArrow direction="previous" />}
      styleOverride={{
        minHeight: uiTokens.listActionHeight,
        height: uiTokens.listActionHeight,
        margin: 0,
        padding: 0,
        justifyContent: 'center',
      }}
    />
    <ActionButton
      label={isLastAnimal ? 'Finish learning' : `Next ${creatureName}`}
      icon={null}
      theme={theme}
      color={theme.colors.primary}
      onClick={onNext}
      hideArrow
      content={<NavigationArrow direction="next" />}
      styleOverride={{
        minHeight: uiTokens.listActionHeight,
        height: uiTokens.listActionHeight,
        margin: 0,
        padding: 0,
        justifyContent: 'center',
      }}
    />
  </div>
)

const TwoPlayerProgressButton = ({
  creatureName,
  image,
  theme,
  isLastAnimal,
  onClick,
}: {
  creatureName: string
  image: string
  theme: ActivityChoreProps['theme']
  isLastAnimal: boolean
  onClick: () => void
}) => (
  <ActionButton
    label={isLastAnimal ? 'Finish game' : `Next ${creatureName}`}
    icon={null}
    theme={theme}
    color={theme.colors.primary}
    onClick={onClick}
    hideArrow
    className="activity-inline-action"
    content={
      <img
        src={image}
        alt=""
        aria-hidden="true"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    }
    styleOverride={{
      minHeight: uiTokens.listActionHeight,
      height: uiTokens.listActionHeight,
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      justifyContent: 'center',
    }}
  />
)

type AnimalPlayContentProps = {
  twoPlayersImage: string
  getTeachingFacts: CreatureCollectionData['getTeachingFacts']
  mode: AnimalMode
  difficulty: AnimalDifficulty
  isGenericLearnAbilityShown: boolean
  animal: CatalogAnimal
  animalIndex: number
  isLastAnimal: boolean
  visibleSoloClues: number
  answerChoices: CatalogAnimal[]
  dismissedChoices: string[]
  leavingChoice: string | null
  answeredCorrectly: boolean
  isTogetherAnimalHidden: boolean
  theme: ActivityChoreProps['theme']
  onPrevious: () => void
  onNext: () => void
  onSoloChoice: (choice: CatalogAnimal) => void
  onToggleAnimal: () => void
  onToggleLearnAbility: () => void
}

const AnimalPlayContent = ({
  twoPlayersImage,
  getTeachingFacts,
  mode,
  difficulty,
  isGenericLearnAbilityShown,
  animal,
  animalIndex,
  isLastAnimal,
  visibleSoloClues,
  answerChoices,
  dismissedChoices,
  leavingChoice,
  answeredCorrectly,
  isTogetherAnimalHidden,
  theme,
  onPrevious,
  onNext,
  onSoloChoice,
  onToggleAnimal,
  onToggleLearnAbility,
}: AnimalPlayContentProps) => {
  const teachingFacts = getTeachingFacts(
    animal,
    theme.id,
    difficulty === 'hard' || (mode === 'solo' && theme.id === 'teenie')
  )
  // Keep the appearance detail until last, so it does not reveal the answer first.
  const soloFacts =
    animal.kind === 'teenieping'
      ? ['THEME', 'PROP', 'MAGIC', 'LOOKS'].flatMap((label) =>
          teachingFacts.filter((fact) => fact.label === label)
        )
      : teachingFacts
  if (mode === 'learn') {
    return (
      <>
        <AnimalPortrait animal={animal} theme={theme} compact />
        <FactGrid
          facts={getTeachingFacts(animal, theme.id, isGenericLearnAbilityShown)}
          theme={theme}
          onAbilityClick={onToggleLearnAbility}
          isGenericAbilityShown={isGenericLearnAbilityShown}
        />
        <LearningNavigation
          creatureName={animal.kind}
          theme={theme}
          canGoPrevious={animalIndex > 0}
          isLastAnimal={isLastAnimal}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      </>
    )
  }

  if (mode === 'together') {
    return (
      <>
        <HideableAnimalPortrait
          animal={animal}
          theme={theme}
          hiddenImage={twoPlayersImage}
          hidden={isTogetherAnimalHidden}
          onToggle={onToggleAnimal}
        />
        <FactGrid
          facts={getTeachingFacts(animal, theme.id, isTogetherAnimalHidden)}
          theme={theme}
        />
        <TwoPlayerProgressButton
          creatureName={animal.kind}
          image={twoPlayersImage}
          theme={theme}
          isLastAnimal={isLastAnimal}
          onClick={onNext}
        />
      </>
    )
  }

  return (
    <>
      <FactGrid facts={soloFacts.slice(0, visibleSoloClues)} theme={theme} />
      <div
        aria-label={`${formatAnimalName(animal.kind)} choices`}
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
            const isCorrect = answeredCorrectly && choice.name === animal.name
            const borderColor = isCorrect
              ? theme.colors.primary
              : isWrong
                ? theme.colors.secondary
                : theme.colors.accent
            const animation = isWrong
              ? 'animal-choice-fly-away 0.65s ease-in forwards'
              : isCorrect
                ? 'animal-choice-pop 0.32s ease both'
                : undefined

            return (
              <button
                key={choice.name}
                type="button"
                onClick={() => onSoloChoice(choice)}
                disabled={Boolean(leavingChoice) || answeredCorrectly}
                aria-label={formatAnimalName(choice.name)}
                style={{
                  minHeight: 126,
                  padding: 5,
                  borderRadius: 20,
                  border: `4px solid ${borderColor}`,
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.heading,
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  animation,
                }}
              >
                <img
                  src={choice.image}
                  decoding="async"
                  alt=""
                  style={{ width: '100%', height: 84, objectFit: 'contain' }}
                />
                {formatAnimalName(choice.name)}
                {isCorrect ? ' âœ“' : isWrong ? ' âœ•' : ''}
              </button>
            )
          })}
      </div>
    </>
  )
}

export type AnimalTesterProps = ActivityChoreProps

const AnimalTester = (props: AnimalTesterProps) => {
  const {
    theme,
    totalProblems,
    starReward,
    isRunning,
    isEditable = true,
    onAdjustProblems,
    onStarsChange,
    completionImage,
    failureImage,
    failureModeEnabled = true,
  } = props
  const {
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
    playProps,
  } = useAnimalSession(props)
  const collectionLabel = COLLECTION_LABELS[collection]
  const modeImages = CREATURE_MODE_IMAGES[collection]
  usePrimaryActionImage(
    collection === 'teeniepings'
      ? teeniepingCollectionImage
      : collection === 'insects'
        ? insectCollectionImage
        : null
  )
  const gameModeControls = (
    <div style={{ width: uiTokens.controlRowWidth, maxWidth: '100%' }}>
      <SegmentedChoiceControl
        theme={theme}
        value={mode}
        options={MODE_OPTIONS.map((option) => ({
          ...option,
          icon: modeImages[option.value],
        }))}
        onChange={setMode}
        ariaLabel={`${collectionLabel} game mode`}
      />
      <div
        className="animal-difficulty-reveal"
        data-expanded={mode === 'solo'}
        aria-hidden={mode !== 'solo'}
        inert={mode !== 'solo'}
      >
        <div>
          <div style={{ paddingTop: uiTokens.panelStackGap }}>
            <CrownDifficultyControl
              theme={theme}
              value={difficulty}
              options={ANIMAL_DIFFICULTIES}
              onChange={setDifficulty}
              ariaLabel={`${collectionLabel} difficulty`}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ActivityOutcomeShell
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      successAlt={`Amazing ${collectionLabel.toLowerCase()} explorer!`}
      failureAlt={`Let's learn some more ${collection}!`}
      className="flex w-full flex-col items-center"
    >
      {!collectionLocked && (
        <SegmentedChoiceControl
          theme={theme}
          value={collection}
          ariaLabel="Creature collection"
          onChange={changeCollection}
          style={{
            width: uiTokens.controlRowWidth,
            maxWidth: '100%',
          }}
          options={[
            {
              value: 'animals',
              label: 'Animals',
              icon: animalCollectionImage,
            },
            {
              value: 'insects',
              label: 'Insects',
              icon: insectCollectionImage,
              loading: collection === 'insects' && isCollectionLoading,
            },
            {
              value: 'teeniepings',
              label: 'Teeniepings',
              icon: teeniepingCollectionImage,
              loading: collection === 'teeniepings' && isCollectionLoading,
              disabled: !TEENIEPING_COLLECTION_AVAILABLE,
            },
          ]}
        />
      )}
      {collectionLocked && isCollectionLoading && (
        <ResourceLoadingIcon
          src={
            collection === 'teeniepings'
              ? teeniepingCollectionImage
              : insectCollectionImage
          }
          loading
          label={`Loading ${collectionLabel} pictures`}
        />
      )}
      {collectionError && (
        <div role="alert">
          <p>{collectionError}</p>
          <ActionButton
            theme={theme}
            label="Try again"
            icon={null}
            color={theme.colors.primary}
            onClick={() => changeCollection(collection)}
          />
        </div>
      )}
      {isSetup && !isEditable && gameModeControls}
      <ActivitySetupControls
        isSetup={isSetup}
        theme={theme}
        totalProblems={totalProblems}
        min={MIN_PROBLEMS}
        max={MAX_PROBLEMS}
        onAdjustProblems={onAdjustProblems}
        starReward={starReward}
        onStarsChange={onStarsChange}
        previousAriaLabel={`Fewer ${collection}`}
        nextAriaLabel={`More ${collection}`}
        isEditable={isEditable}
        starMax={10}
        beforeProblemControl={gameModeControls}
      />

      {isRunning && animal && (
        <ActivityPlayArea
          theme={theme}
          results={getVisibleActivityResults(results, failureModeEnabled)}
          correctIcon={getThemeAsset(theme.id, 'quizCorrectImage')}
          incorrectIcon={getThemeAsset(theme.id, 'quizIncorrectImage')}
          hideAlt
          showResultBar={mode === 'solo'}
        >
          <AnimalPlayContent
            {...playProps}
            animal={animal}
            theme={theme}
            twoPlayersImage={modeImages.together}
          />
        </ActivityPlayArea>
      )}
      <style>{getChoiceFeedbackAnimationStyles('animal-choice')}</style>
    </ActivityOutcomeShell>
  )
}

export default AnimalTester
