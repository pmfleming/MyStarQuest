import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { DINOSAUR_KNOWLEDGE } from '../../src/data/dinosaurKnowledge'
import { themes } from '../../src/contexts/ThemeContext'
import { getGenericDinosaurAbilityImage } from '../../src/data/dinosaurAbilityAssets'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const props = () => ({
  theme: themes.princess,
  totalProblems: 1,
  starReward: 3,
  isRunning: true,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onExit: vi.fn(),
})

const selectDinosaurs = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Dinosaurs' }))
  })
  await waitFor(() =>
    expect(
      screen.getByRole('radio', { name: 'Dinosaurs' })
    ).not.toHaveAttribute('aria-busy')
  )
}

describe('Who am I dinosaur collection', () => {
  it('teaches the complete requested collection, switches pictures and finishes learning without scoring', async () => {
    const p = props()
    render(<AnimalTester {...p} />)
    await selectDinosaurs()
    expect(DINOSAUR_KNOWLEDGE).toHaveLength(15)
    expect(DINOSAUR_KNOWLEDGE.map((creature) => creature.name)).toEqual(
      expect.arrayContaining([
        'allosaurus',
        'baculites',
        'dimetrodon',
        'otodus-megalodon',
        'tetrapodophis',
      ])
    )
    expect(
      DINOSAUR_KNOWLEDGE.some((creature) => creature.name === 'donnie')
    ).toBe(false)
    expect(
      DINOSAUR_KNOWLEDGE.filter((d) => d.group === 'Dinosaur')
    ).toHaveLength(9)
    expect(screen.getByAltText('Ankylosaurus')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Cartoon', exact: true })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Realistic', exact: true })
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'View realistic reconstruction of Ankylosaurus',
        exact: true,
      })
    )
    for (const creature of DINOSAUR_KNOWLEDGE) {
      for (const themeId of ['princess', 'teenie'] as const) {
        expect(
          getGenericDinosaurAbilityImage(themeId, creature.genericAbility)
        ).toBeTruthy()
        expect(
          getGenericDinosaurAbilityImage(themeId, creature.genericAbility)
        ).not.toBe(creature.abilityImage)
      }
      expect(
        screen.getByText(creature.displayName, { exact: true })
      ).toBeVisible()
      expect(
        screen.getByAltText(`${creature.displayName} reconstruction`)
      ).toHaveAttribute('src', creature.realisticImage)
      for (const [label, description, image, caption] of [
        ['FOOD', creature.food, creature.foodImage, creature.foodWord],
        [
          'HABITAT',
          creature.habitatText,
          creature.habitatImage,
          creature.habitatWord,
        ],
        [
          'ABILITY',
          creature.abilityText,
          creature.abilityImage,
          creature.ability,
        ],
        [
          'GEOLOGICAL PERIOD',
          `I lived in the ${creature.period}, millions of years ago.`,
          creature.periodImage,
          creature.period,
        ],
      ]) {
        const card = screen.getByRole('button', {
          name: `${label}: ${description}`,
        })
        expect(card.querySelector('img')).toHaveAttribute('src', image)
        expect(within(card).getByText(caption)).toBeVisible()
      }
      if (creature.group !== 'Dinosaur') {
        expect(
          screen.getByRole('button', {
            name: `View cartoon of ${creature.displayName}`,
          })
        ).toHaveAttribute(
          'aria-description',
          expect.stringContaining(creature.family)
        )
      }
      fireEvent.click(
        screen.getByRole('button', {
          name:
            creature.name === 'velociraptor'
              ? 'Finish learning'
              : 'Next creature',
        })
      )
    }
    expect(p.onExit).toHaveBeenCalledOnce()
    expect(p.onComplete).not.toHaveBeenCalled()
    expect(p.onStarsChange).not.toHaveBeenCalled()
  }, 15000)

  it('uses realistic choices in hard mode and still advances a correct answer', async () => {
    const p = props()
    const { rerender } = render(<AnimalTester {...p} isRunning={false} />)
    await selectDinosaurs()
    fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Hard' }))
    vi.useFakeTimers()
    try {
      rerender(<AnimalTester {...p} />)
      const clue = screen.getByRole('button', { name: /^FOOD:/ })
      const correct = DINOSAUR_KNOWLEDGE.find(
        (d) => clue.getAttribute('aria-label') === `FOOD: ${d.food}`
      )!
      expect(clue.querySelector('img')).toHaveAttribute(
        'src',
        correct.foodImage
      )
      const choices = within(
        screen.getByLabelText('Creature choices')
      ).getAllByRole('button')
      expect(choices).toHaveLength(3)
      for (const choice of choices) {
        const creature = DINOSAUR_KNOWLEDGE.find(
          (d) => d.displayName === choice.getAttribute('aria-label')
        )!
        expect(choice.querySelector('img')).toHaveAttribute(
          'src',
          creature.realisticImage
        )
      }
      expect(
        screen.queryByRole('radiogroup', { name: 'Creature collection' })
      ).not.toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: correct.displayName, exact: true })
      )
      await act(async () => {
        vi.advanceTimersByTime(650)
      })
      expect(p.onComplete).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it.each(['teenie'] as const)(
    'uses the %s generic ability when a two-player answer is hidden',
    async (themeId) => {
      const p = { ...props(), theme: themes[themeId] }
      const { rerender } = render(<AnimalTester {...p} isRunning={false} />)
      await selectDinosaurs()
      fireEvent.click(screen.getByRole('radio', { name: '2 Players' }))
      rerender(<AnimalTester {...p} />)
      const card = screen.getByRole('button', { name: /^ABILITY:/ })
      const creature = DINOSAUR_KNOWLEDGE.find(
        (d) => card.getAttribute('aria-label') === `ABILITY: ${d.abilityText}`
      )!
      expect(card.querySelector('img')).toHaveAttribute(
        'src',
        creature.abilityImage
      )
      fireEvent.click(screen.getByRole('button', { name: 'Hide creature' }))
      expect(card.querySelector('img')).toHaveAttribute(
        'src',
        getGenericDinosaurAbilityImage(themeId, creature.genericAbility)
      )
      expect(
        screen.queryByAltText(creature.displayName)
      ).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Show creature' }))
      expect(card.querySelector('img')).toHaveAttribute(
        'src',
        creature.abilityImage
      )
    }
  )
})
