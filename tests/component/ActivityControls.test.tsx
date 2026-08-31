import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { themes } from '../../src/contexts/ThemeContext'
import { ActivitySetupControls } from '../../src/components/ui/ActivityControls'

describe('ActivitySetupControls', () => {
  it('standardizes editable spacing and read-only setup controls', () => {
    const { container, rerender } = render(
      <ActivitySetupControls
        isSetup
        theme={themes.princess}
        totalProblems={6}
        min={1}
        max={9}
        onAdjustProblems={vi.fn()}
        starReward={3}
        onStarsChange={vi.fn()}
        previousAriaLabel="Fewer problems"
        nextAriaLabel="More problems"
        beforeProblemControl={<button type="button">Mode</button>}
      />
    )

    const setup = container.querySelector('[data-activity-setup]')

    expect(setup).toHaveStyle({ gap: '24px' })
    expect(setup).toHaveStyle({ width: '380px', maxWidth: '100%' })
    expect(screen.getByText('Mode')).toBe(setup?.children[0])
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(setup?.children).toHaveLength(3)

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
