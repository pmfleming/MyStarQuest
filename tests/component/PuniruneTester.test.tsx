import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import punirunes from '../../src/data/creatureCollections/punirunes'
import manifest from '../../src/assets/punirunes/manifest.json'
import { PUNIRUNE_LORE } from '../../src/data/puniruneLore'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
vi.mock('../../src/lib/shuffle', () => ({
  shuffle: <T,>(items: T[]) => [...items],
}))

afterEach(() => vi.useRealTimers())

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

const selectPunirunes = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Punirunes' }))
    await vi.dynamicImportSettled()
  })
}

describe('Punirunes in Who am I?', () => {
  it('covers the roster with sourced lore followed by exactly one appearance card', () => {
    const expected = manifest.characters
      .filter((character) => character.stage !== 'human')
      .map((character) => character.name)
      .sort()
    expect(punirunes.catalog.map((animal) => animal.name).sort()).toEqual(
      expected
    )
    expect(new Set(expected).size).toBe(52)
    expect(Object.keys(PUNIRUNE_LORE).sort()).toEqual(expected)
    for (const animal of punirunes.catalog) {
      if (animal.kind !== 'punirune') throw new Error('Unexpected creature')
      expect(animal.clues[0].sourceUrl).toMatch(/^https:\/\//)
      expect(new Set(animal.clues.map((clue) => clue.label)).size).toBe(
        animal.clues.length
      )
      expect(
        animal.clues.filter((clue) => clue.label === 'LOOKS')
      ).toHaveLength(1)
      expect(animal.clues.at(-1)?.label).toBe('LOOKS')
      expect(animal.clues.slice(0, -1).every((clue) => clue.sourceUrl)).toBe(
        true
      )
      const character = manifest.characters.find(
        (entry) => entry.name === animal.name
      )
      for (const clue of animal.clues.filter((entry) => entry.sourceUrl)) {
        expect([
          ...(character?.referenceImages ?? []),
          'https://www.takaratomy.co.jp/products/punirunes/character/',
          'https://www.tv-tokyo.co.jp/anime/punirunes2/chara/',
          'https://www.tv-tokyo.co.jp/anime/punirunes3_kachikochi/chara/',
          'https://www.takaratomy.co.jp/products/punirunes/about/',
          ...('episode' in clue && clue.episode
            ? [
                `https://www.tv-tokyo.co.jp/anime/punirunes/episodes/${clue.episode.season}_${String(clue.episode.number).padStart(2, '0')}.html`,
              ]
            : []),
        ]).toContain(clue.sourceUrl)
      }
      expect(animal.image).toContain(`/punirunes/${animal.name}.png`)
      const clues = punirunes.getTeachingFacts(animal, 'princess')
      expect(clues.map((clue) => clue.label)).toEqual([
        'ABOUT ME',
        'LIKES',
        'SPECIAL',
        'LOOKS',
      ])
      expect(clues.every((clue) => clue.text && clue.illustration)).toBe(true)
      expect(clues.every((clue) => clue.visual === '')).toBe(true)
      expect(
        clues.slice(0, -1).every((clue) => clue.illustration !== animal.image)
      ).toBe(true)
      expect(clues.at(-1)?.illustration).toBe(animal.image)
      const hiddenClues = punirunes.getTeachingFacts(animal, 'princess', true)
      expect(hiddenClues.at(-1)?.illustration).toContain(
        '/generic/mystery-appearance.png'
      )
      expect(hiddenClues.slice(0, -1)).toEqual(clues.slice(0, -1))
      expect(punirunes.getTeachingFacts(animal, 'teenie')).toEqual(clues)
    }
  })

  it('loads the collection, browses characters and switches back to animals', async () => {
    const p = props()
    const { rerender } = render(<AnimalTester {...p} />)
    await selectPunirunes()
    expect(
      screen.getByRole('radiogroup', { name: 'Punirune game mode' })
    ).toBeInTheDocument()
    rerender(<AnimalTester {...p} isRunning />)
    expect(screen.getByAltText('Airun')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Enlarge Airun picture' })
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Choose starting letter' }),
      { detail: 0 }
    )
    const letters = screen.getByRole('toolbar', { name: 'Starting letters' })
    fireEvent.wheel(letters, { deltaY: 100 })
    fireEvent.wheel(letters, { deltaY: 100 })
    fireEvent.click(screen.getByRole('button', { name: 'Jump to J' }))
    expect(screen.getByAltText('Jewerun')).toBeInTheDocument()
    expect(document.querySelectorAll('.animal-fact-symbol')).toHaveLength(0)
    expect(
      screen.queryAllByText(/^(ABOUT ME|LIKES|SPECIAL|LOOKS)$/)
    ).toHaveLength(0)
    expect(
      screen.getByLabelText(/^SPECIAL:/).querySelector('img')
    ).toHaveAttribute(
      'src',
      expect.stringContaining('/hints/Jewerun-crystal-quest.png')
    )
    expect(
      screen.getByLabelText('ABOUT ME: My friends can count on me')
    ).toBeInTheDocument()
    expect(
      screen.queryByLabelText('LIKES: I love eating')
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('LOOKS: I am pale purple with a jewel on my head')
    ).toBeInTheDocument()
    await act(async () =>
      fireEvent.click(screen.getByRole('radio', { name: 'Animals' }))
    )
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
  })

  it.each(['Easy', 'Hard'] as const)(
    'plays a %s solo round without revealing the portrait early',
    async (difficulty) => {
      const p = { ...props(), totalProblems: 2 }
      const { rerender } = render(<AnimalTester {...p} />)
      await selectPunirunes()
      fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
      fireEvent.click(screen.getByRole('radio', { name: difficulty }))
      vi.useFakeTimers()
      rerender(<AnimalTester {...p} isRunning />)
      expect(
        screen.getByLabelText('ABOUT ME: I am curious and cheerful')
      ).toBeInTheDocument()
      expect(
        screen.queryByLabelText('LIKES: I love eating')
      ).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      const choices = within(screen.getByLabelText('Punirune choices'))
      expect(choices.getAllByRole('button')).toHaveLength(3)
      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByLabelText('LIKES: I love eating')).toBeInTheDocument()
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(3000))
      expect(
        screen.getByLabelText('SPECIAL: I started a school in Puni Land')
      ).toBeInTheDocument()
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(2999))
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(1))
      const looks = screen.getByLabelText(/^LOOKS:/)
      expect(looks.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringContaining(
          difficulty === 'Easy'
            ? '/punirunes/Airun.png'
            : '/generic/mystery-appearance.png'
        )
      )
      fireEvent.click(choices.getByRole('button', { name: 'Akarun' }))
      act(() => vi.advanceTimersByTime(650))
      expect(
        choices.queryByRole('button', { name: 'Akarun' })
      ).not.toBeInTheDocument()
      fireEvent.click(choices.getByRole('button', { name: 'Airun' }))
      act(() => vi.advanceTimersByTime(650))
      expect(p.onComplete).not.toHaveBeenCalled()
      // A short biography still gets the same four categories and timing.
      expect(
        screen.getByLabelText('ABOUT ME: I am a child Punirune')
      ).toBeInTheDocument()
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(3000))
      expect(
        screen.getByLabelText('LIKES: I love gentle squishes')
      ).toBeInTheDocument()
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(3000))
      expect(
        screen.getByLabelText(
          'SPECIAL: I grow through baby, child and adult stages'
        )
      ).toBeInTheDocument()
      expect(screen.queryByLabelText(/^LOOKS:/)).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(3000))
      expect(
        screen.getByLabelText(/^LOOKS:/).querySelector('img')
      ).toHaveAttribute(
        'src',
        expect.stringContaining(
          difficulty === 'Easy'
            ? '/punirunes/Akarun.png'
            : '/generic/mystery-appearance.png'
        )
      )
      expect(
        screen.getAllByRole('button', {
          name: /^(ABOUT ME|LIKES|SPECIAL|LOOKS):/,
        })
      ).toHaveLength(4)
      fireEvent.click(choices.getByRole('button', { name: 'Akarun' }))
      act(() => vi.advanceTimersByTime(650))
      expect(p.onComplete).toHaveBeenCalledOnce()
    }
  )

  it('hides the answer in two-player mode, including its final clue, and finishes', async () => {
    const p = props()
    const { rerender } = render(<AnimalTester {...p} />)
    await selectPunirunes()
    fireEvent.click(screen.getByRole('radio', { name: '2 Players' }))
    rerender(<AnimalTester {...p} isRunning />)
    fireEvent.click(screen.getByRole('button', { name: 'Hide punirune' }), {
      detail: 0,
    })
    expect(screen.queryByAltText('Airun')).not.toBeInTheDocument()
    expect(
      screen.getByLabelText(/^LOOKS:/).querySelector('img')
    ).toHaveAttribute(
      'src',
      expect.stringContaining('/generic/mystery-appearance.png')
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show punirune' }), {
      detail: 0,
    })
    expect(screen.getByAltText('Airun')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Finish game' }))
    expect(p.onExit).toHaveBeenCalledOnce()
  })
})
