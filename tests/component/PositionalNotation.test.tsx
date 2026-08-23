import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PositionalNotation from '../../src/components/PositionalNotation'
import { themes } from '../../src/contexts/ThemeContext'

const defaultProps = {
  theme: themes.princess,
  totalProblems: 1,
  starReward: 3,
  isRunning: false,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
}

describe('PositionalNotation', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offers two crown levels and caps each hard-level place at nine', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    const { rerender } = render(<PositionalNotation {...defaultProps} />)

    expect(screen.getByRole('radio', { name: 'One crown' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Two crowns' }))

    expect(screen.getByRole('radio', { name: 'Two crowns' })).toHaveAttribute(
      'aria-checked',
      'true'
    )

    rerender(<PositionalNotation {...defaultProps} isRunning />)

    await waitFor(() => expect(screen.getByText('999')).toBeInTheDocument())
    expect(screen.getByText('Hundreds')).toBeInTheDocument()
    expect(screen.getByText('Tens')).toBeInTheDocument()
    expect(screen.getByText('Ones')).toBeInTheDocument()

    const addHundred = screen.getByRole('button', { name: 'Add hundred' })
    const addTen = screen.getByRole('button', { name: 'Add ten' })
    const addOne = screen.getByRole('button', { name: 'Add one' })

    for (let count = 0; count < 9; count++) {
      fireEvent.click(addHundred)
      fireEvent.click(addTen)
      fireEvent.click(addOne)
    }

    expect(addHundred).toBeDisabled()
    expect(addTen).toBeDisabled()
    expect(addOne).toBeDisabled()
    expect(screen.getByText('900')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
  })
})
