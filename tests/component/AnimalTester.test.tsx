import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester, { ANIMAL_CATALOG } from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import {
  ANIMAL_ABILITY_ASSETS,
  getAnimalAbilityImage,
} from '../../src/data/animalAbilityAssets'
import { ANIMAL_ASSETS } from '../../src/data/animalAssets'
import {
  ANIMAL_FOOD_IMAGE_BY_NAME,
  ANIMAL_FOOD_NAMES,
  getAnimalFoodImage,
} from '../../src/data/animalFoodAssets'
import {
  ANIMAL_HABITAT_IMAGE_BY_NAME,
  ANIMAL_HABITAT_NAMES,
  getAnimalHabitatImage,
} from '../../src/data/animalHabitatAssets'
import { ANIMAL_KNOWLEDGE } from '../../src/data/animalKnowledge'
import {
  ANIMAL_LOCATION_IMAGE_BY_NAME,
  ANIMAL_LOCATION_NAMES,
  getAnimalLocationImage,
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
})

describe('AnimalTester', () => {
  it('has 75 specific animals with matching images and learning profiles', () => {
    const assetNames = ANIMAL_ASSETS.map((animal) => animal.name)
    const knowledgeNames = ANIMAL_KNOWLEDGE.map((animal) => animal.name)

    expect(assetNames).toHaveLength(75)
    expect(knowledgeNames).toHaveLength(75)
    expect(ANIMAL_CATALOG).toHaveLength(75)
    expect(knowledgeNames).toEqual(assetNames)
    expect(assetNames).not.toEqual(
      expect.arrayContaining([
        'bird',
        'lizard',
        'snake',
        'spider',
        'turtle',
        'whale',
      ])
    )
    expect(assetNames).toEqual(
      expect.arrayContaining([
        'bluebird',
        'gecko',
        'green-tree-python',
        'tarantula',
        'tortoise',
        'blue-whale',
        'polar-bear',
        'octopus',
      ])
    )
  })

  it('assigns a unique project-style image to every habitat', () => {
    const habitatImages = Object.values(ANIMAL_HABITAT_IMAGE_BY_NAME)

    expect(ANIMAL_HABITAT_NAMES).toHaveLength(15)
    expect(new Set(habitatImages).size).toBe(15)
    expect(
      ANIMAL_CATALOG.every(
        (animal) => getAnimalHabitatImage(animal.habitat[1].text).length > 0
      )
    ).toBe(true)
  })

  it('assigns a unique image to every location and food category', () => {
    const locationImages = Object.values(ANIMAL_LOCATION_IMAGE_BY_NAME)
    const foodImages = Object.values(ANIMAL_FOOD_IMAGE_BY_NAME)

    expect(ANIMAL_LOCATION_NAMES).toHaveLength(10)
    expect(new Set(locationImages).size).toBe(10)
    expect(ANIMAL_FOOD_NAMES).toHaveLength(10)
    expect(new Set(foodImages).size).toBe(10)
    expect(
      ANIMAL_CATALOG.every(
        (animal) => getAnimalLocationImage(animal.habitat[0].text).length > 0
      )
    ).toBe(true)
    expect(
      ANIMAL_CATALOG.every(
        (animal) => getAnimalFoodImage(animal.food[1].text).length > 0
      )
    ).toBe(true)
  })

  it('assigns a unique special-ability image to every animal', () => {
    const abilityImages = ANIMAL_ABILITY_ASSETS.map((ability) => ability.image)

    expect(ANIMAL_ABILITY_ASSETS).toHaveLength(75)
    expect(new Set(abilityImages).size).toBe(75)
    expect(
      ANIMAL_CATALOG.every(
        (animal) => (getAnimalAbilityImage(animal.name)?.length ?? 0) > 0
      )
    ).toBe(true)
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
  })

  it('teaches location, environment, food, and ability on one visual page', async () => {
    const user = userEvent.setup()
    const props = createProps()
    const { rerender } = render(<AnimalTester {...props} />)

    rerender(<AnimalTester {...props} isRunning />)

    expect(
      screen.queryByRole('heading', { name: 'Learn' })
    ).not.toBeInTheDocument()
    const teachingCards = screen.getAllByRole('button', {
      name: /Tap to hear it/i,
    })
    expect(teachingCards).toHaveLength(4)
    expect(teachingCards.every((card) => card.querySelector('img'))).toBe(true)
    expect(
      teachingCards.every(
        (card) => (card.textContent?.trim().split(/\s+/).length ?? 0) <= 1
      )
    ).toBe(true)
    expect(teachingCards.map((card) => card.textContent?.trim())).not.toEqual([
      'Location',
      'Environment',
      'Food',
      'Ability',
    ])
    expect(
      teachingCards.every((card) => {
        const category = card
          .getAttribute('aria-label')
          ?.split(':', 1)[0]
          .toLowerCase()
        return card.textContent?.trim().toLowerCase() !== category
      })
    ).toBe(true)
    expect(
      teachingCards.map((card) => card.getAttribute('aria-label'))
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^LOCATION:/),
        expect.stringMatching(/^ENVIRONMENT:/),
        expect.stringMatching(/^FOOD:/),
        expect.stringMatching(/^ABILITY:/),
      ])
    )
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Next' })
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Finish' }))
    expect(props.onComplete).toHaveBeenCalledOnce()
  })

  it('uses three picture choices in the one-player guessing mode', async () => {
    const user = userEvent.setup()
    const props = createProps()
    const { rerender } = render(<AnimalTester {...props} />)

    await user.click(screen.getByRole('radio', { name: '1 Player' }))
    rerender(<AnimalTester {...props} isRunning />)

    expect(screen.getByRole('heading', { name: 'Guess' })).toBeInTheDocument()
    const choices = within(
      screen.getByLabelText('Animal choices')
    ).getAllByRole('button')
    expect(choices).toHaveLength(3)
    expect(choices.every((choice) => choice.querySelector('img'))).toBe(true)

    for (const choice of choices) {
      await user.click(choice)
      if (screen.queryByRole('button', { name: 'Finish' })) break
    }

    await user.click(screen.getByRole('button', { name: 'Finish' }))
    expect(props.onComplete).toHaveBeenCalledOnce()
  })

  it('protects the answer during the two-player question phase', async () => {
    const user = userEvent.setup()
    const props = createProps()
    const { rerender } = render(<AnimalTester {...props} />)

    await user.click(screen.getByRole('radio', { name: '2 Players' }))
    rerender(<AnimalTester {...props} isRunning />)

    expect(screen.getByRole('heading', { name: 'Secret' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hide' }))

    expect(screen.getByRole('heading', { name: 'Guess' })).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Ability')).toBeInTheDocument()
    expect(
      screen.queryByAltText(/^(?!Mystery animal).+/)
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reveal' }))
    expect(screen.getByRole('heading', { name: 'Answer' })).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})
