import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useDinnerCountdownState } from '../../src/hooks/useDinnerCountdownState'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('stops hidden timers, catches up on return, saves expiry once and cleans up', async () => {
  vi.useFakeTimers()
  let hidden = false
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
  const onExpire = vi.fn()
  const timerStartedAt = Date.now()
  const { result, unmount } = renderHook(() =>
    useDinnerCountdownState({
      remaining: 2,
      bitesLeft: 3,
      isTimerRunning: true,
      isCompleted: false,
      biteCooldownSeconds: 0,
      timerStartedAt,
      onExpire,
    })
  )
  await act(async () => vi.advanceTimersByTime(500))
  expect(result.current.liveRemainingFloat).toBe(1.5)
  hidden = true
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(vi.getTimerCount()).toBe(0)
  await act(async () => vi.advanceTimersByTime(3000))
  expect(onExpire).not.toHaveBeenCalled()
  hidden = false
  await act(async () => document.dispatchEvent(new Event('visibilitychange')))
  expect(result.current.isTimeout).toBe(true)
  expect(result.current.liveRemaining).toBe(0)
  await act(async () => vi.advanceTimersByTime(1000))
  expect(onExpire).toHaveBeenCalledTimes(1)
  unmount()
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(vi.getTimerCount()).toBe(0)
})
