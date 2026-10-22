import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import PositionalNotation from '../../src/components/PositionalNotation'
import { themes } from '../../src/contexts/ThemeContext'
import * as problems from '../../src/lib/positionalNotationProblems'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it.each([
  { label: 'Three crowns: 1–9,999', target: 4090, hundredsOfThousands: 0 },
  { label: 'Four crowns: 1–999,999', target: 604090, hundredsOfThousands: 6 },
])(
  'completes $label using all place values, including zero digits',
  async ({ label, target, hundredsOfThousands }) => {
    vi.useFakeTimers()
    vi.spyOn(
      problems,
      'generateProgressivePositionalNotationProblem'
    ).mockReturnValue({ target })
    const props = {
      theme: themes.princess,
      totalProblems: 1,
      starReward: 1,
      isRunning: false,
      checkTrigger: 0,
      onComplete: vi.fn(),
      onAdjustProblems: vi.fn(),
      onStarsChange: vi.fn(),
    }
    const view = render(<PositionalNotation {...props} />)
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    fireEvent.click(screen.getByRole('radio', { name: label }))
    view.rerender(<PositionalNotation {...props} isRunning />)
    expect(screen.getByText(target.toLocaleString('en-US'))).toBeInTheDocument()
    for (const [name, count] of [
      ['Add hundred thousand', hundredsOfThousands],
      ['Add thousand', 4],
      ['Add ten', 9],
    ] as const) {
      for (let index = 0; index < count; index++) {
        fireEvent.click(screen.getByRole('button', { name, exact: true }))
      }
    }
    expect(
      screen.getByRole('button', { name: 'Add ten', exact: true })
    ).toBeDisabled()
    view.rerender(<PositionalNotation {...props} isRunning checkTrigger={1} />)
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(props.onComplete).toHaveBeenCalledTimes(1)
  }
)
