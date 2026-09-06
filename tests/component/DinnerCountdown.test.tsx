import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DinnerCountdown from '../../src/components/DinnerCountdown'
import { themes } from '../../src/contexts/ThemeContext'
import { useDinnerCountdownState } from '../../src/hooks/useDinnerCountdownState'

describe('DinnerCountdown', () => {
  it('records expiry once and accepts a reset without writing expiry again', () => {
    const onExpire = vi.fn()
    const { rerender, result } = renderHook(
      ({ remaining, isCompleted }) =>
        useDinnerCountdownState({
          remaining,
          isCompleted,
          bitesLeft: 1,
          isTimerRunning: false,
          biteCooldownSeconds: 15,
          onExpire: () => onExpire(),
        }),
      { initialProps: { remaining: 0, isCompleted: false } }
    )
    expect(onExpire).toHaveBeenCalledTimes(1)
    rerender({ remaining: 0, isCompleted: true })
    rerender({ remaining: 0, isCompleted: true })
    expect(onExpire).toHaveBeenCalledTimes(1)
    rerender({ remaining: 600, isCompleted: false })
    expect(result.current.isFinished).toBe(false)
    expect(result.current.liveRemaining).toBe(600)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })
  it('uses visual dinner controls and enforces the twenty-slice maximum', () => {
    const onAdjustTime = vi.fn()
    const onAdjustBites = vi.fn()

    const { rerender } = render(
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

    rerender(
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
