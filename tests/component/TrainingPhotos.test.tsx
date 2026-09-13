import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import { ANIMAL_KNOWLEDGE } from '../../src/data/animalKnowledge'
import { INSECT_KNOWLEDGE } from '../../src/data/insectKnowledge'
import { INSECT_COLLECTION_NAMES } from '../../src/data/creatureCollections/insectCollectionNames'
import credits from '../../src/data/creaturePhotoCredits.json'
import { getCreaturePhoto } from '../../src/data/creaturePhotos'

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

  it('swaps the existing image in place and back in Strict Mode without scoring', () => {
    const p = props()
    render(
      <StrictMode>
        <AnimalTester {...p} />
      </StrictMode>
    )
    const drawing = screen.getByAltText('Alpaca')
    const originalSrc = drawing.getAttribute('src')
    const imageStyle = drawing.getAttribute('style')
    const card = drawing.parentElement
    fireEvent.click(drawing, { detail: 1 })
    expect(drawing).toHaveAttribute('src', originalSrc)
    fireEvent.doubleClick(drawing)
    const photo = screen.getByAltText('Real alpaca')
    expect(photo).toBe(drawing)
    expect(photo.parentElement).toBe(card)
    expect(photo).toHaveAttribute('style', imageStyle)
    expect(photo).toHaveAttribute('src', getCreaturePhoto('alpaca')!.src)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Real photo' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Photo credits')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Source' })
    ).not.toBeInTheDocument()
    fireEvent.doubleClick(photo)
    expect(screen.getByAltText('Alpaca')).toHaveAttribute('src', originalSrc)
    expect(screen.queryByText('Photo credits')).not.toBeInTheDocument()
    expect(p.onStarsChange).not.toHaveBeenCalled()
    expect(p.onComplete).not.toHaveBeenCalled()
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

  it('resets to the drawing when navigating', () => {
    render(<AnimalTester {...props()} />)
    fireEvent.doubleClick(screen.getByAltText('Alpaca'))
    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }))
    expect(screen.queryByAltText('Real alpaca')).not.toBeInTheDocument()
    fireEvent.doubleClick(screen.getByAltText('Armadillo'))
    expect(screen.getByAltText('Real armadillo')).toBeInTheDocument()
  })

  it('swaps insect photos and excludes Teeniepings', async () => {
    render(<AnimalTester {...props()} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Insects' }))
      await vi.dynamicImportSettled()
    })
    fireEvent.doubleClick(screen.getByAltText('Ant'))
    expect(screen.getByAltText('Real ant')).toHaveAttribute(
      'src',
      getCreaturePhoto('ant')!.src
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('radio', { name: 'Teeniepings' }))
      await vi.dynamicImportSettled()
    })
    expect(screen.queryByAltText('Real ant')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^View real photo/ })
    ).not.toBeInTheDocument()
  })

  it.each(['1 Player', '2 Players'])(
    'does not expose photos in %s mode',
    (mode) => {
      const p = props()
      const { rerender } = render(<AnimalTester {...p} isRunning={false} />)
      fireEvent.click(screen.getByRole('radio', { name: mode }))
      rerender(<AnimalTester {...p} />)
      expect(
        screen.queryByRole('button', { name: /^View real photo/ })
      ).not.toBeInTheDocument()
      expect(document.querySelector('img[src*="creaturePhotos"]')).toBeNull()
    }
  )
})
