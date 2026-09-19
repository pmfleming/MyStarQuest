import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import { ANIMAL_KNOWLEDGE } from '../../src/data/animalKnowledge'
import { INSECT_KNOWLEDGE } from '../../src/data/insectKnowledge'
import { INSECT_COLLECTION_NAMES } from '../../src/data/creatureCollections/insectCollectionNames'
import credits from '../../src/data/creaturePhotoCredits.json'
import { getCreaturePhoto } from '../../src/data/creaturePhotos'
import { loadCollection } from '../../src/data/creatureCollections/loadCollection'

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

describe('Who am I training photos', () => {
  it('shows only the selected portrait when switching between loaded collections', async () => {
    await Promise.all(
      (['insects', 'dinosaurs', 'teeniepings'] as const).map(loadCollection)
    )
    render(<AnimalTester {...props()} />)

    for (const [collection, name] of [
      ['Teeniepings', 'Artping'],
      ['Dinosaurs', 'Ankylosaurus'],
      ['Insects', 'Ant'],
      ['Animals', 'Alpaca'],
      ['Teeniepings', 'Artping'],
      ['Insects', 'Ant'],
    ]) {
      fireEvent.click(screen.getByRole('radio', { name: collection }))
      const portraits = screen.getAllByRole('button', {
        name: /^(View |Enlarge .* picture)/,
      })
      expect(portraits).toHaveLength(1)
      expect(portraits[0].querySelector('img')).toHaveAttribute('alt', name)
      expect(
        screen.getAllByRole('button', { name: 'Choose starting letter' })
      ).toHaveLength(1)
    }
  })

  it('covers both catalogs with local photos and credits', () => {
    const names = [
      ...ANIMAL_KNOWLEDGE.filter(
        (item) => !INSECT_COLLECTION_NAMES.has(item.name)
      ),
      ...INSECT_KNOWLEDGE,
    ]
      .map((item) => item.name)
      .sort()
    expect(credits.map((photo) => photo.id).sort()).toEqual(names)
    for (const name of names) {
      const photo = getCreaturePhoto(name)!
      expect(photo.src).toContain(`/creaturePhotos/${name}.webp`)
      expect(photo.photographer).toBeTruthy()
      expect(photo.sourceUrl).toMatch(/^https:\/\//)
      expect(photo.licence).toMatch(/^(CC BY|CC0|Public domain)/)
    }
  })

  it('supports keyboard toggling and falls back to the drawing on loading errors', () => {
    render(<AnimalTester {...props()} />)
    const trigger = screen.getByRole('button', {
      name: 'View real photo of alpaca',
    })
    trigger.focus()
    fireEvent.click(trigger, { detail: 0 })
    expect(trigger).toHaveAttribute('aria-pressed', 'true')
    expect(trigger).toHaveFocus()
    fireEvent.error(screen.getByAltText('Real alpaca'))
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('couldn’t load')
    fireEvent.click(trigger, { detail: 0 })
    expect(screen.getByAltText('Real alpaca')).toBeInTheDocument()
    fireEvent.click(trigger, { detail: 0 })
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
  })
})
