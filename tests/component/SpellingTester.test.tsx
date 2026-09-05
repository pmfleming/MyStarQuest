import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SpellingTester from '../../src/components/SpellingTester'
import { themes } from '../../src/contexts/ThemeContext'
import { ANIMAL_ASSETS } from '../../src/data/animalAssets'

const teenieAssetModules = import.meta.glob(
  '../../src/assets/teenie/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

const pokemonAssetModules = import.meta.glob(
  '../../src/assets/pokemon/*.{png,jpg,jpeg,webp,svg}',
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

const teenieNames = getAssetNames(teenieAssetModules)
const newTeenieNames = [
  'blank',
  'chacha',
  'charm',
  'dada',
  'ego',
  'gogo',
  'kiki',
  'lala',
  'mimic',
  'mosey',
  'narr',
  'romi',
  'spook',
  'tutu',
]

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
  it('offers teenie, animal, and Pokémon image sets', async () => {
    const user = userEvent.setup()
    expect(teenieNames).toEqual(expect.arrayContaining(newTeenieNames))

    const { rerender: rerenderTeenie } = render(
      <SpellingTester {...defaultProps} />
    )

    expect(screen.getByRole('radio', { name: 'Teenie' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('radio', { name: 'Animals' })).toBeInTheDocument()

    rerenderTeenie(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const image = screen.getByRole('img', {
        name: new RegExp(`^(${teenieNames.join('|')})$`),
      })

      expect(teenieNames).toContain(image.getAttribute('alt'))
    })

    cleanup()
    const { rerender: rerenderAnimals } = render(
      <SpellingTester {...defaultProps} />
    )

    await user.click(screen.getByRole('radio', { name: 'Animals' }))
    expect(screen.getByRole('radio', { name: 'Animals' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    rerenderAnimals(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const image = screen.getByRole('img')
      const animal = ANIMAL_ASSETS.find(
        ({ name }) => name === image.getAttribute('alt')
      )

      expect(animal?.image).toBe(image.getAttribute('src'))
    })

    cleanup()
    const { rerender: rerenderPokemon } = render(
      <SpellingTester {...defaultProps} />
    )

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

    rerenderPokemon(<SpellingTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const image = screen.getByRole('img', {
        name: new RegExp(`^(${pokemonNames.join('|')})$`),
      })

      expect(pokemonNames).toContain(image.getAttribute('alt'))
    })
  })
})
