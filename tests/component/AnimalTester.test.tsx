import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import { getAnimalAbilityImage } from '../../src/data/animalAbilityAssets'
import { getGenericAnimalAbilityImage } from '../../src/data/genericAnimalAbilityAssets'
import { ANIMAL_ASSETS } from '../../src/data/animalAssets'
import { ANIMAL_FOOD_IMAGE_BY_NAME } from '../../src/data/animalFoodAssets'
import { ANIMAL_HABITAT_IMAGE_BY_NAME } from '../../src/data/animalHabitatAssets'
import { ANIMAL_KNOWLEDGE } from '../../src/data/animalKnowledge'
import {
  ANIMAL_LOCATION_IMAGE_BY_NAME,
  ANIMAL_LOCATIONS,
} from '../../src/data/animalLocationAssets'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const createProps = () => ({
  theme: themes.nature,
  totalProblems: 1,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onExit: vi.fn(),
})

describe('AnimalTester', () => {
  it('keeps shared region captions and maps together despite different animal facts', () => {
    render(<AnimalTester {...createProps()} isRunning />)
    const expected = {
      Bat: 'Worldwide',
      Chimpanzee: 'Central & West Africa',
      Crocodile: 'Warm regions',
      Deer: 'Five continents',
      Eagle: 'Worldwide',
      Flamingo: 'Five continents',
      Gorilla: 'Central Africa',
      'Green Tree Python': 'New Guinea & N. Australia',
      Hedgehog: 'Afro-Eurasia',
      Kiwi: 'New Zealand',
      Koala: 'Eastern Australia',
      Lion: 'Africa & India',
      Monkey: 'Africa, Asia & Americas',
      Otter: 'Five continents',
    } as const
    const seen = new Set<string>()
    for (let index = 0; index < ANIMAL_KNOWLEDGE.length; index++) {
      for (const [name, category] of Object.entries(expected)) {
        if (!screen.queryByAltText(name)) continue
        const location = screen.getByLabelText(/^LOCATION:/)
        const { label, image } = ANIMAL_LOCATIONS[category]
        expect(
          location.querySelector('[data-animal-fact-word]')?.textContent
        ).toBe(label)
        expect(location.querySelector('img')).toHaveAttribute('src', image)
        seen.add(name)
      }
      if (seen.size === Object.keys(expected).length) break
      fireEvent.click(screen.getByRole('button', { name: 'Next animal' }))
    }
    expect([...seen].sort()).toEqual(Object.keys(expected).sort())
    const maps = Object.values(ANIMAL_LOCATIONS).map(({ image }) => image)
    expect(new Set(maps).size).toBe(maps.length)
  })

  it('connects every animal to complete facts and visual assets', () => {
    const assetNames = ANIMAL_ASSETS.map(({ name }) => name).sort()
    const knowledgeNames = ANIMAL_KNOWLEDGE.map(({ name }) => name).sort()

    expect(new Set(assetNames).size).toBe(assetNames.length)
    expect(new Set(knowledgeNames).size).toBe(knowledgeNames.length)
    expect(assetNames).toEqual(knowledgeNames)

    const incompleteAnimals = ANIMAL_KNOWLEDGE.flatMap((animal) => {
      const requiredFacts = [
        animal.habitat[0],
        animal.habitat[1],
        animal.food[1],
        animal.abilities[0],
      ]
      const hasCompleteFacts = requiredFacts.every(
        (fact) => fact?.label && fact.text
      )
      const hasAllImages = Boolean(
        ANIMAL_LOCATION_IMAGE_BY_NAME[animal.locationCategory] &&
        ANIMAL_HABITAT_IMAGE_BY_NAME[animal.habitatCategory] &&
        ANIMAL_FOOD_IMAGE_BY_NAME[animal.foodCategory] &&
        getAnimalAbilityImage(animal.name) &&
        getGenericAnimalAbilityImage(
          'princess',
          animal.abilities[0]?.label ?? ''
        )
      )

      return hasCompleteFacts && hasAllImages ? [] : [animal.name]
    })

    expect(incompleteAnimals).toEqual([])
  })

  it('offers teaching, one-player, and two-player modes', () => {
    render(<AnimalTester {...createProps()} />)

    const modePicker = screen.getByRole('radiogroup', {
      name: 'Animal game mode',
    })
    const modeOptions = within(modePicker).getAllByRole('radio')
    expect(modeOptions).toHaveLength(3)
    expect(modeOptions.every((option) => option.querySelector('img'))).toBe(
      true
    )
    expect(modePicker).toHaveTextContent('')
    expect(screen.getByRole('radio', { name: 'Learn' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('radio', { name: '1 Player' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '2 Players' })).toBeInTheDocument()
    expect(
      screen.queryByRole('radiogroup', { name: 'Animal difficulty' })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
    const difficultyPicker = screen.getByRole('radiogroup', {
      name: 'Animal difficulty',
    })
    const easyOption = within(difficultyPicker).getByRole('radio', {
      name: 'Easy',
    })
    const hardOption = within(difficultyPicker).getByRole('radio', {
      name: 'Hard',
    })
    expect(easyOption).toHaveAttribute('aria-checked', 'true')
    expect(easyOption.querySelectorAll('img')).toHaveLength(1)
    expect(hardOption.querySelectorAll('img')).toHaveLength(2)
  })

  it('teaches the complete ordered animal list regardless of the item limit', () => {
    const props = { ...createProps(), totalProblems: 2 }
    const { rerender } = render(<AnimalTester {...props} />)

    rerender(<AnimalTester {...props} isRunning />)

    expect(
      screen.queryByRole('heading', { name: 'Learn' })
    ).not.toBeInTheDocument()
    expect(
      document.querySelector('[data-activity-result-bar]')
    ).not.toBeInTheDocument()
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
    const teachingCards = screen.getAllByLabelText(
      /^(LOCATION|ENVIRONMENT|FOOD|ABILITY):/
    )
    expect(teachingCards).toHaveLength(4)
    expect(teachingCards.every((card) => card.querySelector('img'))).toBe(true)
    expect(teachingCards[0]).toHaveTextContent(/^Andes$/)
    expect(teachingCards[0]).toHaveAttribute(
      'aria-label',
      'LOCATION: The Andes of South America'
    )
    expect(teachingCards[0]).not.toHaveTextContent(/^(Earth|Worldwide)$/)
    const abilityCard = screen.getByRole('button', { name: /^ABILITY:/ })
    expect(abilityCard).toHaveAttribute('aria-pressed', 'false')
    expect(abilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getAnimalAbilityImage('alpaca')
    )

    fireEvent.click(abilityCard)
    expect(abilityCard).toHaveAttribute('aria-pressed', 'true')
    expect(abilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getGenericAnimalAbilityImage('nature', 'WOOL')
    )

    fireEvent.click(abilityCard)
    expect(abilityCard).toHaveAttribute('aria-pressed', 'false')
    expect(abilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getAnimalAbilityImage('alpaca')
    )

    fireEvent.click(abilityCard)
    expect(abilityCard).toHaveAttribute('aria-pressed', 'true')

    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    const previousButton = screen.getByRole('button', {
      name: 'Previous animal',
    })
    const nextButton = screen.getByRole('button', { name: 'Next animal' })
    expect(previousButton).toBeDisabled()

    fireEvent.click(nextButton)
    expect(props.onComplete).not.toHaveBeenCalled()
    expect(screen.getByAltText('Armadillo')).toBeInTheDocument()
    expect(screen.getByLabelText(/^LOCATION:/)).toHaveTextContent('Americas')
    const antAbilityCard = screen.getByRole('button', { name: /^ABILITY:/ })
    expect(antAbilityCard).toHaveAttribute('aria-pressed', 'false')
    expect(antAbilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getAnimalAbilityImage('armadillo')
    )
    expect(previousButton).toBeEnabled()

    fireEvent.click(previousButton)
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }))
    expect(screen.getByAltText('Armadillo')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }))
    expect(screen.getByAltText('Bat')).toBeInTheDocument()
    expect(props.onExit).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }))
    expect(screen.getByAltText('Bear')).toBeInTheDocument()
    expect(screen.getByLabelText(/^LOCATION:/)).toHaveTextContent(
      'N. Am. & Eurasia'
    )
    expect(screen.getByLabelText(/^LOCATION:/)).not.toHaveTextContent(
      /^(Earth|Worldwide)$/
    )

    expect(props.onComplete).not.toHaveBeenCalled()
  })

  it('removes wrong choices and advances after the correct solo choice', () => {
    vi.useFakeTimers()
    try {
      const props = createProps()
      const { rerender } = render(<AnimalTester {...props} />)

      fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
      rerender(<AnimalTester {...props} isRunning />)

      expect(
        document.querySelector('[data-activity-result-bar]')
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('heading', { name: 'Guess' })
      ).not.toBeInTheDocument()
      expect(screen.getByLabelText(/^LOCATION:/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^ENVIRONMENT:/)).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByLabelText(/^ENVIRONMENT:/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^FOOD:/)).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByLabelText(/^FOOD:/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^ABILITY:/)).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByLabelText(/^ABILITY:/)).toBeInTheDocument()

      const choices = within(
        screen.getByLabelText('Animal choices')
      ).getAllByRole('button')
      expect(choices).toHaveLength(3)
      expect(choices.every((choice) => choice.querySelector('img'))).toBe(true)

      const factText = (category: string) =>
        screen
          .getByLabelText(new RegExp(`^${category}:`))
          .getAttribute('aria-label')
          ?.replace(`${category}: `, '')
      const currentAnimal = ANIMAL_KNOWLEDGE.find(
        (animal) =>
          animal.habitat[0].text === factText('LOCATION') &&
          animal.habitat[1].text === factText('ENVIRONMENT') &&
          animal.food[1].text === factText('FOOD') &&
          animal.abilities[0].text === factText('ABILITY')
      )
      expect(currentAnimal).toBeDefined()
      if (!currentAnimal)
        throw new Error('Expected the displayed animal in catalog')

      expect(
        screen.getByLabelText(/^ABILITY:/).querySelector('img')
      ).toHaveAttribute('src', getAnimalAbilityImage(currentAnimal.name))

      const answerName = currentAnimal.name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
      const wrongChoice = choices.find(
        (choice) => choice.getAttribute('aria-label') !== answerName
      )
      expect(wrongChoice).toBeDefined()

      fireEvent.click(wrongChoice!)
      expect(wrongChoice).toHaveStyle({
        animation: 'animal-choice-fly-away 0.65s ease-in forwards',
      })
      act(() => vi.advanceTimersByTime(650))
      expect(wrongChoice).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: answerName }))
      expect(
        screen.queryByRole('button', { name: /^(Next|Finish)$/ })
      ).not.toBeInTheDocument()

      act(() => vi.advanceTimersByTime(650))
      expect(props.onComplete).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses the generic ability card in hard one-player mode', () => {
    vi.useFakeTimers()
    try {
      const props = createProps()
      const { rerender } = render(<AnimalTester {...props} />)

      fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
      fireEvent.click(screen.getByRole('radio', { name: 'Hard' }))
      expect(screen.getByRole('radio', { name: 'Hard' })).toHaveAttribute(
        'aria-checked',
        'true'
      )

      rerender(<AnimalTester {...props} isRunning />)
      act(() => vi.advanceTimersByTime(9000))

      const abilityCard = screen.getByLabelText(/^ABILITY:/)
      const abilityText = abilityCard
        .getAttribute('aria-label')
        ?.replace('ABILITY: ', '')
      const currentAnimal = ANIMAL_KNOWLEDGE.find(
        (animal) => animal.abilities[0].text === abilityText
      )
      expect(currentAnimal).toBeDefined()
      if (!currentAnimal)
        throw new Error('Expected the displayed animal in catalog')

      expect(abilityCard.querySelector('img')).toHaveAttribute(
        'src',
        getGenericAnimalAbilityImage(
          props.theme.id,
          currentAnimal.abilities[0].label
        )
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows one read-aloud screen and advances the two-player game directly', () => {
    const props = { ...createProps(), totalProblems: 2 }
    const { rerender } = render(<AnimalTester {...props} />)

    fireEvent.click(screen.getByRole('radio', { name: '2 Players' }))
    rerender(<AnimalTester {...props} isRunning />)

    expect(
      document.querySelector('[data-activity-result-bar]')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /^(Secret|Guess|Answer)$/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Hide' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reveal' })
    ).not.toBeInTheDocument()

    const teachingCards = screen.getAllByLabelText(
      /^(LOCATION|ENVIRONMENT|FOOD|ABILITY):/
    )
    expect(teachingCards).toHaveLength(4)
    expect(teachingCards.every((card) => card.querySelector('img'))).toBe(true)
    expect(
      screen
        .getAllByRole('img')
        .some((image) => Boolean(image.getAttribute('alt')))
    ).toBe(true)

    const hideAnimalButton = screen.getByRole('button', {
      name: 'Hide animal',
    })
    const animalPortrait = within(hideAnimalButton).getByRole('img')
    const animalName = animalPortrait.getAttribute('alt')
    expect(animalName).toBeTruthy()
    const currentAsset = ANIMAL_ASSETS.find(
      (animal) => animal.image === animalPortrait.getAttribute('src')
    )
    const currentAnimal = ANIMAL_KNOWLEDGE.find(
      (animal) => animal.name === currentAsset?.name
    )
    expect(currentAnimal).toBeDefined()
    const abilityCard = screen.getByLabelText(/^ABILITY:/)
    expect(abilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getAnimalAbilityImage(currentAnimal!.name)
    )

    fireEvent.click(hideAnimalButton)
    const showAnimalButton = screen.getByRole('button', {
      name: 'Show animal',
    })
    expect(showAnimalButton).toHaveAttribute('aria-pressed', 'true')
    expect(showAnimalButton.querySelector('img')).not.toHaveAttribute(
      'src',
      getGenericAnimalAbilityImage(
        props.theme.id,
        currentAnimal!.abilities[0].label
      )
    )
    expect(abilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getGenericAnimalAbilityImage(
        props.theme.id,
        currentAnimal!.abilities[0].label
      )
    )
    expect(screen.queryByAltText(animalName!)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show animal' }))
    expect(screen.getByAltText(animalName!)).toBeInTheDocument()
    expect(abilityCard.querySelector('img')).toHaveAttribute(
      'src',
      getAnimalAbilityImage(currentAnimal!.name)
    )

    const nextButton = screen.getByRole('button', { name: 'Next animal' })
    fireEvent.click(nextButton)
    expect(props.onComplete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Hide animal' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Finish game' }))
    expect(props.onExit).toHaveBeenCalledOnce()
    expect(props.onComplete).not.toHaveBeenCalled()
  })
})
