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
