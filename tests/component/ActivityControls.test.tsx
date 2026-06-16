import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { themes } from '../../src/contexts/ThemeContext'
import { ActivitySetupControls } from '../../src/components/ui/ActivityControls'

describe('ActivitySetupControls', () => {
  it('renders read-only setup values without edit controls', () => {
    render(
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
