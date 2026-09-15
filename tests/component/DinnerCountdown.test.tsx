import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
})
