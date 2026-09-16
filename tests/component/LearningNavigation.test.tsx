import { fireEvent, render, screen } from '@testing-library/react'
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
    open()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(opener).toHaveFocus()
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(p.onSelectLetter).toHaveBeenCalledTimes(1)
  })
})
