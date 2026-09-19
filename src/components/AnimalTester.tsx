import { useState, type CSSProperties } from 'react'
import PicturePortrait from './animalTester/PicturePortrait'
import { usePictureGestures } from './animalTester/usePictureGestures'
import {
  useAnimalSession,
  type AnimalMode,
  type AnimalDifficulty,
} from './animalTester/useAnimalSession'
import {
  CREATURE_MODE_IMAGES,
  CREATURE_COLLECTIONS,
  creatureLabel,
  creatureDisplayName,
  formatAnimalName,
} from './animalTester/modeArtwork'
import LearningNavigation from './animalTester/LearningNavigation'
import TrainingPhotoPortrait from './animalTester/TrainingPhotoPortrait'
import { getAnimalCardLabel } from '../data/animalCardLabels'
import { TEENIEPING_COLLECTION_AVAILABLE } from '../data/creatureCollections/availability'
import type {
  CatalogAnimal,
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
import SegmentedChoiceControl, {
  type SegmentedChoiceOption,
} from './ui/SegmentedChoiceControl'
import { getChoiceFeedbackAnimationStyles } from './ui/activityAnimationStyles'

const MIN_PROBLEMS = 1
const MAX_PROBLEMS = 9
const MODE_OPTIONS: SegmentedChoiceOption<AnimalMode>[] = [
  {
    value: 'learn',
    label: 'Learn',
  },
  {
    value: 'solo',
    label: '1 Player',
  },
  {
    value: 'together',
    label: '2 Players',
  },
]

const ANIMAL_DIFFICULTIES: CrownDifficultyOption<AnimalDifficulty>[] = [
  { value: 'easy', label: 'Easy', crowns: 1 },
  { value: 'hard', label: 'Hard', crowns: 2 },
]

const FactCard = ({
  fact,
  onClick,
  isPressed = false,
  expanded,
  onToggleZoom,
}: {
  fact: VisualFact
  onClick?: () => void
  isPressed?: boolean
  expanded: boolean
  onToggleZoom: () => void
}) => {
  const gestures = usePictureGestures({
    onActivate: onClick,
    onToggleZoom,
    expanded,
  })
  return (
    <button
      type="button"
      {...gestures}
      className="animal-fact-card"
      aria-pressed={onClick ? isPressed : undefined}
      aria-label={`${fact.label}: ${fact.text}`}
    >
      {fact.illustration ? (
        <img
          data-animal-fact-image
          src={fact.illustration}
          decoding="async"
          alt=""
          style={{
            objectFit: fact.illustrationFit ?? 'cover',
            ...(fact.detailPosition && {
              objectPosition: fact.detailPosition,
              transform: `scale(${fact.detailScale ?? 2.1})`,
              transformOrigin: fact.detailPosition,
            }),
          }}
        />
      ) : (
        <span className="animal-fact-symbol" aria-hidden="true">
          {fact.visual}
        </span>
      )}
      {fact.word && (
        <strong data-animal-fact-word data-wrap={fact.wrapCaption}>
          {getAnimalCardLabel(fact.word)}
        </strong>
      )}
    </button>
  )
}

const FactGrid = ({
  facts,
  onAbilityClick,
  isGenericAbilityShown = false,
  creatureKey,
}: {
  facts: VisualFact[]
  onAbilityClick?: () => void
  isGenericAbilityShown?: boolean
  creatureKey?: string
}) => {
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null)
  return (
    <div data-animal-fact-grid className="animal-fact-grid">
      {facts.map((fact) => (
        <div
          key={fact.label}
          style={{
            visibility:
              expandedLabel !== null && expandedLabel !== fact.label
                ? 'hidden'
                : undefined,
          }}
        >
          <FactCard
            // Cancel pending clicks on navigation without resetting the grid's zoom.
            key={creatureKey}
            fact={fact}
            expanded={expandedLabel === fact.label}
            onToggleZoom={() =>
              setExpandedLabel((previous) =>
                previous === fact.label ? null : fact.label
              )
            }
            onClick={fact.isAbility ? onAbilityClick : undefined}
            isPressed={Boolean(fact.isAbility && isGenericAbilityShown)}
          />
        </div>
      ))}
    </div>
  )
}

const AnimalPortrait = ({
  animal,
  photo,
  hiddenImage,
}: {
  animal: CatalogAnimal
  photo?: { src: string; alt: string; onError: () => void }
  hiddenImage?: string
}) => (
  <div className="animal-portrait">
    <img
      src={hiddenImage ?? photo?.src ?? animal.image}
      decoding="async"
      alt={hiddenImage ? '' : (photo?.alt ?? creatureDisplayName(animal))}
      onError={photo?.onError}
    />
    {!hiddenImage && <strong>{creatureDisplayName(animal)}</strong>}
  </div>
)

const HideableAnimalPortrait = ({
  animal,
  hiddenImage,
  hidden,
  onToggle,
}: {
  animal: CatalogAnimal
  hiddenImage: string
  hidden: boolean
  onToggle: () => void
}) => (
  <PicturePortrait
    label={`${hidden ? 'Show' : 'Hide'} ${creatureLabel(animal)}`}
    pressed={hidden}
    onActivate={onToggle}
    creatureKey={animal.name}
  >
    <AnimalPortrait
      animal={animal}
      hiddenImage={hidden ? hiddenImage : undefined}
    />
  </PicturePortrait>
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

type AnimalPlayContentProps = ReturnType<
  typeof useAnimalSession
>['playProps'] & {
  twoPlayersImage: string
  animal: CatalogAnimal
  theme: ActivityChoreProps['theme']
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
  availableLetters,
  onSelectLetter,
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
      : animal.kind === 'prehistoric'
        ? ['FOOD', 'HABITAT', 'GEOLOGICAL PERIOD', 'ABILITY'].flatMap((label) =>
            teachingFacts.filter((fact) => fact.label === label)
          )
        : teachingFacts
  if (mode === 'learn') {
    return (
      <>
        <TrainingPhotoPortrait key={`portrait-${animal.kind}`} animal={animal}>
          {(photo) => <AnimalPortrait animal={animal} photo={photo} />}
        </TrainingPhotoPortrait>
        <FactGrid
          key={`${animal.kind}-${mode}`}
          creatureKey={animal.name}
          facts={getTeachingFacts(animal, theme.id, isGenericLearnAbilityShown)}
          onAbilityClick={onToggleLearnAbility}
          isGenericAbilityShown={isGenericLearnAbilityShown}
        />
        <LearningNavigation
          key={`navigation-${animal.kind}`}
          creatureName={creatureLabel(animal)}
          currentLetter={animal.name.charAt(0).toUpperCase()}
          availableLetters={availableLetters}
          onSelectLetter={onSelectLetter}
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
          hiddenImage={twoPlayersImage}
          hidden={isTogetherAnimalHidden}
          onToggle={onToggleAnimal}
        />
        <FactGrid
          key={`${animal.kind}-${animal.name}-${mode}`}
          facts={getTeachingFacts(animal, theme.id, isTogetherAnimalHidden)}
        />
        <TwoPlayerProgressButton
          creatureName={creatureLabel(animal)}
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
      <FactGrid
        key={`${animal.kind}-${animal.name}-${mode}`}
        facts={soloFacts.slice(0, visibleSoloClues)}
      />
      <div
        aria-label={`${formatAnimalName(creatureLabel(animal))} choices`}
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
                aria-label={creatureDisplayName(choice)}
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
                  overflowWrap: 'anywhere',
                  animation,
                }}
              >
                <img
                  src={
                    choice.kind === 'prehistoric' && difficulty === 'hard'
                      ? choice.realisticImage
                      : choice.image
                  }
                  decoding="async"
                  alt=""
                  style={{ width: '100%', height: 84, objectFit: 'contain' }}
                />
                {creatureDisplayName(choice)}
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
    persistence,
  } = useAnimalSession(props)
  const presentation = CREATURE_COLLECTIONS[collection]
  const collectionLabel = presentation.singular
  const modeImages = CREATURE_MODE_IMAGES[collection]
  usePrimaryActionImage(presentation.actionImage)
  const themeStyle: CSSProperties & Record<`--animal-${string}`, string> = {
    '--animal-primary': theme.colors.primary,
    '--animal-accent': theme.colors.accent,
    '--animal-secondary': theme.colors.secondary,
    '--animal-surface': theme.colors.surface,
    '--animal-text': theme.colors.text,
    '--animal-heading': theme.fonts.heading,
    '--animal-body': theme.fonts.body,
    '--animal-fact-shadow': `${theme.colors.accent}66`,
    '--animal-caption': `${theme.colors.surface}80`,
    '--animal-portrait-surface': `${theme.colors.surface}dd`,
  }
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
      persistence={persistence}
      isFinished={isFinished}
      isSuccessState={isSuccessState}
      completionImage={completionImage}
      failureImage={failureImage}
      successAlt={`Amazing ${collectionLabel.toLowerCase()} explorer!`}
      failureAlt={`Let's learn some more ${collection}!`}
      className="animal-tester flex w-full flex-col items-center"
      style={themeStyle}
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
          options={Object.values(CREATURE_COLLECTIONS).map(
            ({ value, label, icon }) => ({
              value,
              label,
              icon,
              loading: collection === value && isCollectionLoading,
              disabled:
                value === 'teeniepings' && !TEENIEPING_COLLECTION_AVAILABLE,
            })
          )}
        />
      )}
      {collectionLocked && isCollectionLoading && (
        <ResourceLoadingIcon
          src={presentation.icon}
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
