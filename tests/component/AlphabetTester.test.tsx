import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AlphabetTester from '../../src/components/AlphabetTester'
import { themes } from '../../src/contexts/ThemeContext'

const defaultProps = {
  theme: themes.princess,
  totalProblems: 5,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
}

describe('AlphabetTester', () => {
  it('shows only lowercase choices when lowercase is selected', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<AlphabetTester {...defaultProps} />)

    expect(screen.getByRole('radio', { name: 'ABC' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    await user.click(screen.getByRole('radio', { name: 'abc' }))

    expect(screen.getByRole('radio', { name: 'abc' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    rerender(<AlphabetTester {...defaultProps} isRunning />)

    await waitFor(() => {
      const choices = screen.getAllByRole('button')
      expect(choices).toHaveLength(3)
      expect(
        choices.every((choice) => /^[a-z]$/.test(choice.textContent ?? ''))
      ).toBe(true)
    })
  })
})
