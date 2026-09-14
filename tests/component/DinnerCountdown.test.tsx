import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DinnerCountdown from '../../src/components/DinnerCountdown'
import { themes } from '../../src/contexts/ThemeContext'
import { useDinnerCountdownState } from '../../src/hooks/useDinnerCountdownState'

describe('DinnerCountdown', () => {
  afterEach(() => vi.useRealTimers())

  it('does not fail an unstarted dinner with zero remaining time (start: null)', () => {
    const timerStartedAt = null

    const onExpire = vi.fn()
    const { result, rerender } = renderHook(
      ({ isTimerRunning }) =>
        useDinnerCountdownState({
          remaining: 0,
          bitesLeft: 2,
          isCompleted: false,
          isTimerRunning,
          timerStartedAt,
          biteCooldownSeconds: 15,
          onExpire,
        }),
      { initialProps: { isTimerRunning: false } }
    )
    expect(result.current.isSetup).toBe(true)
    expect(result.current.isTimeout).toBe(false)
    // Entering the activity can render before its start write arrives.
    rerender({ isTimerRunning: true })
    expect(result.current.isFinished).toBe(false)
    expect(onExpire).not.toHaveBeenCalled()
  })

  it('records expiry once and accepts a reset without writing expiry again', () => {
    vi.useFakeTimers().setSystemTime(10_000)
    const onExpire = vi.fn()
    const { rerender, result } = renderHook(
      ({ remaining, isCompleted, timerStartedAt }) =>
        useDinnerCountdownState({
          remaining,
          isCompleted,
          bitesLeft: 1,
          isTimerRunning: timerStartedAt != null,
          timerStartedAt,
          biteCooldownSeconds: 15,
          onExpire: () => onExpire(),
        }),
      {
        initialProps: {
          remaining: 1,
          isCompleted: false,
          timerStartedAt: 10_000 as number | null,
        },
      }
    )
    act(() => vi.advanceTimersByTime(750))
    expect(result.current.isTimeout).toBe(false)
    expect(onExpire).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(250))
    expect(onExpire).toHaveBeenCalledTimes(1)
    rerender({ remaining: 0, isCompleted: true, timerStartedAt: null })
    rerender({ remaining: 0, isCompleted: true, timerStartedAt: null })
    expect(result.current.isTimeout).toBe(true)
    expect(onExpire).toHaveBeenCalledTimes(1)
    rerender({ remaining: 600, isCompleted: false, timerStartedAt: null })
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
    fireEvent.click(screen.getByText('10:00'))
    expect(screen.getByText('600')).toBeInTheDocument()
    fireEvent.click(screen.getByText('600'))
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
