import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LearningNavigation from '../../src/components/animalTester/LearningNavigation'
import { themes } from '../../src/contexts/ThemeContext'

const props = () => ({
  creatureName: 'animal',
  currentLetter: 'M',
  availableLetters: 'ABCDEFGHIJKLMNOPQRSTUVWYZ'.split(''),
  theme: themes.princess,
  canGoPrevious: true,
  isLastAnimal: false,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  onSelectLetter: vi.fn(),
})

const open = () => {
  fireEvent.click(
    screen.getByRole('button', { name: 'Choose starting letter' })
  )
  return screen.getByRole('group', { name: 'Starting letters' })
}

describe('LearningNavigation', () => {
  it.each([
    ['A', 'ABCDEFGH'],
    ['M', 'IJKLMNOP'],
    ['Z', 'STUVWXYZ'],
  ])(
    'shows eight letters around %s with alphabet boundaries',
    (letter, window) => {
      render(<LearningNavigation {...props()} currentLetter={letter} />)
      const strip = open()
      expect(
        within(strip)
          .getAllByRole('button')
          .map((button) => button.textContent)
          .join('')
      ).toBe(window)
      expect(
        screen.getByRole('button', { name: `Jump to ${letter}` })
      ).toHaveAttribute('aria-pressed', 'true')
      expect(
        screen.getByRole('button', { name: `Jump to ${letter}` })
      ).toHaveFocus()
    }
  )

  it('browses with the keyboard, ignores unavailable letters, and restores focus after selection', () => {
    const p = props()
    render(<LearningNavigation {...p} />)
    open()
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(screen.getByRole('button', { name: 'Jump to Z' })).toHaveFocus()
    const missing = screen.getByRole('button', { name: 'Jump to X' })
    expect(missing).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(missing)
    expect(p.onSelectLetter).not.toHaveBeenCalled()
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(screen.getByRole('button', { name: 'Jump to A' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(screen.getByRole('button', { name: 'Jump to B' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Jump to B' }))
    expect(p.onSelectLetter).toHaveBeenCalledWith('B')
    const opener = screen.getByRole('button', {
      name: 'Choose starting letter',
    })
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(opener).toHaveFocus()
  })

  it('dismisses without selecting and recenters after browsing', () => {
    const p = props()
    render(<LearningNavigation {...p} />)
    const strip = open()
    fireEvent.wheel(strip, { deltaX: 100 })
    expect(within(strip).getAllByRole('button')[0]).toHaveTextContent('J')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.getByRole('button', { name: 'Choose starting letter' })
    ).toHaveFocus()
    expect(within(open()).getAllByRole('button')[0]).toHaveTextContent('I')
    fireEvent.pointerDown(document.body)
    expect(
      screen.getByRole('button', { name: 'Choose starting letter' })
    ).toHaveAttribute('aria-expanded', 'false')
    expect(p.onSelectLetter).not.toHaveBeenCalled()
  })
})
