import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DinnerCountdown from '../../src/components/DinnerCountdown'
import { themes } from '../../src/contexts/ThemeContext'

describe('DinnerCountdown', () => {
  it('uses visual setup controls for dinner minutes and bites', () => {
    const onAdjustTime = vi.fn()
    const onAdjustBites = vi.fn()

    render(
      <DinnerCountdown
        theme={themes.princess}
        duration={10 * 60}
        remaining={10 * 60}
        totalBites={2}
        bitesLeft={2}
        starReward={3}
        isTimerRunning={false}
        onAdjustTime={onAdjustTime}
        onAdjustBites={onAdjustBites}
        onStarsChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Dinner timer')).toBeInTheDocument()
    expect(screen.getByLabelText('Dinner plate portions')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.queryByLabelText('Minutes')).not.toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Increase timer by 5 minutes'))
    fireEvent.click(screen.getByLabelText('Decrease bites'))

    expect(onAdjustTime).toHaveBeenCalledWith(5 * 60)
    expect(onAdjustBites).toHaveBeenCalledWith(-1)
  })

  it('allows up to twenty dinner plate slices', () => {
    render(
      <DinnerCountdown
        theme={themes.princess}
        duration={10 * 60}
        remaining={10 * 60}
        totalBites={20}
        bitesLeft={20}
        starReward={3}
        isTimerRunning={false}
        onAdjustTime={vi.fn()}
        onAdjustBites={vi.fn()}
        onStarsChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Increase bites')).toBeDisabled()
    expect(screen.getByLabelText('Decrease bites')).toBeEnabled()
  })
})
