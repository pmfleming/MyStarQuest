import { render, screen, waitFor } from '@testing-library/react'
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
  it('lists lowercase first and uses it by default', async () => {
    const { rerender } = render(<AlphabetTester {...defaultProps} />)

    const caseOptions = screen.getAllByRole('radio')
    expect(
      caseOptions.map((option) => option.getAttribute('aria-label'))
    ).toEqual(['abc', 'ABC'])
    expect(caseOptions[0]).toHaveAttribute('aria-checked', 'true')

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
