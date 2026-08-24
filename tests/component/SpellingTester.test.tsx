import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SpellingTester from '../../src/components/SpellingTester'
import { themes } from '../../src/contexts/ThemeContext'

const teenieAssetModules = import.meta.glob(
  '../../src/assets/teenie/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

const pokemonAssetModules = import.meta.glob(
  '../../src/assets/pokemon/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

const animalAssetModules = import.meta.glob(
  '../../src/assets/spelling/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

const getAssetNames = (assetModules: Record<string, unknown>) =>
  Object.keys(assetModules)
    .map(
      (path) =>
        path
          .split('/')
          .pop()
          ?.replace(/\.[^.]+$/, '') ?? path
    )
    .sort()

const animalNames = getAssetNames(animalAssetModules)
const addedAnimalNames = [
  'bear',
  'butterfly',
  'chicken',
  'cow',
  'crocodile',
  'deer',
  'dolphin',
  'duck',
  'elephant',
  'frog',
  'giraffe',
  'horse',
  'kangaroo',
  'monkey',
  'panda',
  'penguin',
  'sheep',
  'snake',
  'turtle',
  'wolf',
]
const teenieNames = getAssetNames(teenieAssetModules)

const pokemonNames = getAssetNames(pokemonAssetModules)
  .map((name) => name.replace(/^grrowlithe$/i, 'growlithe'))
  .sort()

const defaultProps = {
  theme: themes.princess,
  totalProblems: 5,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
}

describe('SpellingTester', () => {
  it('offers the expanded animal set from spelling assets', async () => {
    expect(animalNames).toHaveLength(42)
    expect(animalNames).toEqual(expect.arrayContaining(addedAnimalNames))

    render(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const image = screen.getByRole('img', {
        name: new RegExp(`^(${animalNames.join('|')})$`),
      })

      expect(animalNames).toContain(image.getAttribute('alt'))
    })
  })

  it('lets setup choose teenie words from teenie asset filenames', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SpellingTester {...defaultProps} />)

    expect(screen.getByRole('radio', { name: 'Animals' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    await user.click(screen.getByRole('radio', { name: 'Teenie' }))

    expect(screen.getByRole('radio', { name: 'Teenie' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    rerender(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const image = screen.getByRole('img', {
        name: new RegExp(`^(${teenieNames.join('|')})$`),
      })

      expect(teenieNames).toContain(image.getAttribute('alt'))
    })
  })

  it('offers pokemon as a third word set and uses its asset filenames', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SpellingTester {...defaultProps} />)

    const options = within(
      screen.getByRole('radiogroup', { name: 'Spelling pictures' })
    ).getAllByRole('radio')
    expect(options).toHaveLength(3)
    expect(options[2]).toHaveAccessibleName('Pokémon')

    await user.click(screen.getByRole('radio', { name: 'Pokémon' }))

    expect(screen.getByRole('radio', { name: 'Pokémon' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    rerender(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const image = screen.getByRole('img', {
        name: new RegExp(`^(${pokemonNames.join('|')})$`),
      })

      expect(pokemonNames).toContain(image.getAttribute('alt'))
    })
  })

  it('uses lowercase letters when lowercase is selected', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SpellingTester {...defaultProps} />)

    expect(screen.getByRole('radio', { name: 'ABC' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    await user.click(screen.getByRole('radio', { name: 'abc' }))
    rerender(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const choices = screen.getAllByRole('button')
      expect(choices).toHaveLength(3)
      expect(
        choices.every((choice) => /^[a-z]$/.test(choice.textContent ?? ''))
      ).toBe(true)
    })
  })
})
