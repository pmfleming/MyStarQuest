import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { TEENIEPING_COLLECTION_AVAILABLE } from '../../src/data/creatureCollections/availability'
import { themes } from '../../src/contexts/ThemeContext'
import {
  TEENIEPING_ART_COMPLETE,
  TEENIEPING_CLUE_CATEGORIES,
  TEENIEPING_KNOWLEDGE,
} from '../../src/data/teeniepingKnowledge'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const props = () => ({
  theme: themes.princess,
  totalProblems: 1,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onExit: vi.fn(),
})
const selectTeeniepings = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Teeniepings' }))
    await vi.dynamicImportSettled()
  })
}

describe('Teenieping collection', () => {
  it('accounts for every portrait with four distinct illustrated clues', async () => {
    const portraits = import.meta.glob('../../src/assets/teenie/*.webp')
    expect(TEENIEPING_KNOWLEDGE).toHaveLength(Object.keys(portraits).length)
    expect(TEENIEPING_KNOWLEDGE).toHaveLength(84)
    expect(TEENIEPING_ART_COMPLETE).toBe(true)
    expect(TEENIEPING_COLLECTION_AVAILABLE).toBe(TEENIEPING_ART_COMPLETE)
    const images = TEENIEPING_KNOWLEDGE.flatMap((item) =>
      TEENIEPING_CLUE_CATEGORIES.map((category) => {
        expect(item.clues[category].length).toBeGreaterThan(0)
        expect(item.clueImages[category]).not.toBe(item.image)
        return item.clueImages[category]
      })
    )
    expect(new Set(images).size).toBe(336)
  })

  it('teaches four picture clues and resets when switching collections', async () => {
    const p = props()
    const { rerender } = render(<AnimalTester {...p} />)
    expect(screen.getByRole('radio', { name: 'Teeniepings' })).toBeEnabled()
    await selectTeeniepings()
    rerender(<AnimalTester {...p} isRunning />)
    expect(screen.getByAltText('Artping')).toBeInTheDocument()
    const art = TEENIEPING_KNOWLEDGE[0]
    for (const category of TEENIEPING_CLUE_CATEGORIES) {
      const clue = screen.getByLabelText(
        `${category.toUpperCase()}: ${art.clues[category]}`
      )
      expect(clue.querySelector('img')).toHaveAttribute(
        'src',
        art.clueImages[category]
      )
    }
    fireEvent.click(screen.getByRole('button', { name: 'Next teenieping' }))
    expect(screen.getByAltText('Auroraping')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Animals' }))
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
    await selectTeeniepings()
    expect(screen.getByAltText('Artping')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Previous teenieping' })
    ).toBeDisabled()
  })

  it.each([
    ['Easy', 3],
    ['Hard', 6],
  ] as const)(
    'plays %s with %i choices and reveals appearance last',
    async (difficulty, choiceCount) => {
      vi.useFakeTimers()
      try {
        const p = props()
        const { rerender } = render(<AnimalTester {...p} />)
        await selectTeeniepings()
        fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
        fireEvent.click(screen.getByRole('radio', { name: difficulty }))
        rerender(<AnimalTester {...p} isRunning />)
        expect(
          screen.queryByRole('radiogroup', { name: 'Creature collection' })
        ).not.toBeInTheDocument()
        expect(screen.getByLabelText(/^THEME:/)).toBeInTheDocument()
        expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
        act(() => vi.advanceTimersByTime(3000))
        expect(screen.getByLabelText(/^PROP:/)).toBeInTheDocument()
        act(() => vi.advanceTimersByTime(3000))
        expect(screen.getByLabelText(/^MAGIC:/)).toBeInTheDocument()
        expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
        act(() => vi.advanceTimersByTime(3000))
        const looksImage = screen
          .getByLabelText(/^LOOKS:/)
          .querySelector('img')
          ?.getAttribute('src')
        const current = TEENIEPING_KNOWLEDGE.find(
          (item) => item.clueImages.looks === looksImage
        )!
        expect(current).toBeDefined()
        const choices = within(
          screen.getByLabelText('Teenieping choices')
        ).getAllByRole('button')
        expect(choices).toHaveLength(choiceCount)
        const candidates = choices.map((choice) =>
          TEENIEPING_KNOWLEDGE.find(
            (item) => item.name === choice.getAttribute('aria-label')
          )!
        )
        expect(candidates.every(Boolean)).toBe(true)
        expect(
          candidates.filter((item) => item.identity === current.identity)
        ).toHaveLength(1)
        const wrong = choices.find(
          (choice) => choice.getAttribute('aria-label') !== current.name
        )!
        fireEvent.click(wrong)
        act(() => vi.advanceTimersByTime(650))
        expect(wrong).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: current.name }))
        act(() => vi.advanceTimersByTime(650))
        expect(p.onComplete).toHaveBeenCalledOnce()
      } finally {
        vi.useRealTimers()
      }
    }
  )

  it('supports two-player reveal and finish', async () => {
    const p = props()
    const { rerender } = render(<AnimalTester {...p} />)
    await selectTeeniepings()
    fireEvent.click(screen.getByRole('radio', { name: '2 Players' }))
    rerender(<AnimalTester {...p} isRunning />)
    expect(screen.getAllByLabelText(/^(LOOKS|PROP|THEME|MAGIC):/)).toHaveLength(
      4
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hide teenieping' }))
    expect(
      screen.getByRole('button', { name: 'Show teenieping' })
    ).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Show teenieping' }))
    expect(
      screen.getByRole('button', { name: 'Hide teenieping' })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Finish game' }))
    expect(p.onExit).toHaveBeenCalledOnce()
  })
})
