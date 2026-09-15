import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import {
  INSECT_KNOWLEDGE,
  INSECT_COLLECTION_NAMES,
  getInsectBearAbilityImage,
} from '../../src/data/insectKnowledge'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const props = () => ({
  theme: themes.princess,
  totalProblems: 2,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onExit: vi.fn(),
})
const name = (value: string) =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
const selectInsects = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Insects' }))
    await vi.dynamicImportSettled()
  })
}

describe('Insect collection', () => {
  it('has complete, individually illustrated creatures and matching bear abilities', async () => {
    const count = INSECT_KNOWLEDGE.length
    expect(count).toBeGreaterThan(0)
    expect(new Set(INSECT_KNOWLEDGE.map((item) => item.name)).size).toBe(count)
    expect(new Set(INSECT_KNOWLEDGE.map((item) => item.image)).size).toBe(count)
    expect(
      new Set(INSECT_KNOWLEDGE.map((item) => item.abilityImage)).size
    ).toBe(count)
    expect(INSECT_COLLECTION_NAMES.has('tarantula')).toBe(true)
    expect(INSECT_COLLECTION_NAMES).toEqual(
      new Set(
        INSECT_KNOWLEDGE.flatMap((insect) => [
          insect.name,
          ...(insect.existing ? [insect.existing] : []),
        ])
      )
    )
    for (const item of INSECT_KNOWLEDGE) {
      expect(item.homeImage).toBeTruthy()
      expect(item.foodIllustration).toBeTruthy()
      expect(item.looks).toBeTruthy()
      expect(item.species).toBeTruthy()
      expect(getInsectBearAbilityImage('princess', item.bear)).toBeTruthy()
      expect(getInsectBearAbilityImage('teenie', item.bear)).toBeTruthy()
    }
  })

  it('plays Hard solo rounds in teenie using only insect choices', async () => {
    const difficulty = 'Hard' as const
    const themeId = 'teenie' as const

    vi.useFakeTimers()
    try {
      const p = { ...props(), theme: themes[themeId], totalProblems: 1 }
      const { rerender } = render(<AnimalTester {...p} />)
      await selectInsects()
      fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
      fireEvent.click(screen.getByRole('radio', { name: difficulty }))
      rerender(<AnimalTester {...p} isRunning />)
      expect(
        screen.queryByRole('radiogroup', { name: 'Creature collection' })
      ).not.toBeInTheDocument()
      expect(screen.getByLabelText(/^HOME:/)).toBeInTheDocument()
      expect(screen.queryByLabelText(/^SPECIAL:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(9000))
      const ability = screen.getByLabelText(/^SPECIAL:/)
      const looks = screen.getByLabelText(/^LOOKS:/).getAttribute('aria-label')
      const current = INSECT_KNOWLEDGE.find(
        (item) => `LOOKS: ${item.looks}` === looks
      )!
      expect(current).toBeDefined()
      expect(ability.querySelector('img')).toHaveAttribute(
        'src',
        getInsectBearAbilityImage(themeId, current.bear)
      )
      const choices = within(
        screen.getByLabelText('Insect choices')
      ).getAllByRole('button')
      expect(choices).toHaveLength(3)
      expect(
        choices.every((choice) =>
          INSECT_KNOWLEDGE.some(
            (item) => name(item.name) === choice.getAttribute('aria-label')
          )
        )
      ).toBe(true)
      const wrong = choices.find(
        (choice) => choice.getAttribute('aria-label') !== name(current.name)
      )!
      fireEvent.click(wrong)
      act(() => vi.advanceTimersByTime(650))
      expect(wrong).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: name(current.name) }))
      act(() => vi.advanceTimersByTime(650))
      expect(p.onComplete).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })
})
