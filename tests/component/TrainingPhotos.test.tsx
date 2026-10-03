import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'

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
  it('browses training with the keyboard and recovers from photo loading errors', () => {
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
    const opener = screen.getByRole('button', {
      name: 'Choose starting letter',
    })
    fireEvent.click(opener)
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    expect(screen.getByRole('button', { name: 'Jump to Z' })).toHaveFocus()
    const missing = screen.getByRole('button', { name: 'Jump to X' })
    expect(missing).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(missing)
    expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(screen.getByRole('button', { name: 'Jump to A' })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    expect(screen.getByRole('button', { name: 'Jump to B' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Jump to B' }))
    expect(screen.queryByAltText('Alpaca')).not.toBeInTheDocument()
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(opener).toHaveFocus()
    fireEvent.click(opener)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(opener).toHaveFocus()
    expect(opener).toHaveAttribute('aria-expanded', 'false')
  })
})
