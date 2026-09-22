import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import { getAnimalAbilityImage } from '../../src/data/animalAbilityAssets'
import { getGenericAnimalAbilityImage } from '../../src/data/genericAnimalAbilityAssets'
import { ANIMAL_ASSETS } from '../../src/data/animalAssets'
import { ANIMAL_KNOWLEDGE } from '../../src/data/animalKnowledge'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const createProps = () => ({
  theme: themes.princess,
  totalProblems: 1,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onExit: vi.fn(),
})

describe('AnimalTester', () => {
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
