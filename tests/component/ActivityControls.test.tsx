import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { themes } from '../../src/contexts/ThemeContext'
import { ActivitySetupControls } from '../../src/components/ui/ActivityControls'

describe('ActivitySetupControls', () => {
  it('reports edits and removes editing controls in read-only mode', async () => {
    const user = userEvent.setup()
    const onAdjustProblems = vi.fn()
    const onStarsChange = vi.fn()
    const { rerender } = render(
      <ActivitySetupControls
        isSetup
        theme={themes.princess}
        totalProblems={6}
        min={1}
        max={9}
        onAdjustProblems={onAdjustProblems}
        starReward={3}
        onStarsChange={onStarsChange}
        previousAriaLabel="Fewer problems"
        nextAriaLabel="More problems"
        beforeProblemControl={<button type="button">Mode</button>}
      />
    )

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mode' })).toBeInTheDocument()

    await user.click(screen.getByLabelText('Fewer problems'))
    await user.click(screen.getByLabelText('More problems'))
    await user.click(screen.getByLabelText('Increase star value'))

    expect(onAdjustProblems.mock.calls).toEqual([[-1], [1]])
    expect(onStarsChange).toHaveBeenCalledWith(4)

    rerender(
      <ActivitySetupControls
        isSetup
        theme={themes.princess}
        totalProblems={10}
        min={1}
        max={10}
        onAdjustProblems={vi.fn()}
        starReward={3}
        onStarsChange={vi.fn()}
        previousAriaLabel="Fewer problems"
        nextAriaLabel="More problems"
        beforeProblemControl={<button type="button">Difficulty</button>}
        isEditable={false}
      />
    )

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.queryByLabelText('Fewer problems')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('More problems')).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Decrease star value')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText('Increase star value')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Difficulty')).not.toBeInTheDocument()
  })
})
