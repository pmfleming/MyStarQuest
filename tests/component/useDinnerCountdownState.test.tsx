import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useDinnerCountdownState } from '../../src/hooks/useDinnerCountdownState'
import { ActivityTabVisibleContext } from '../../src/contexts/ActivityTabContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

it('does not repaint inactive activity tabs but saves expiry at the deadline', async () => {
  vi.useFakeTimers()
  const onExpire = vi.fn()
  const timerStartedAt = Date.now()
  let visible = false
  let renders = 0
  const { result, rerender, unmount } = renderHook(
    () => {
      renders++
      return useDinnerCountdownState({
        remaining: 10,
        bitesLeft: 3,
        isTimerRunning: true,
        isCompleted: false,
        biteCooldownSeconds: 0,
        timerStartedAt,
        onExpire,
      })
    },
    {
      wrapper: ({ children }) => (
        <ActivityTabVisibleContext value={visible}>
          {children}
        </ActivityTabVisibleContext>
      ),
    }
  )
  const initialRenders = renders
  await act(async () => vi.advanceTimersByTime(8000))
  expect(renders).toBe(initialRenders)
  expect(onExpire).not.toHaveBeenCalled()
  visible = true
  rerender()
  expect(result.current.liveRemaining).toBe(2)
  await act(async () => vi.advanceTimersByTime(250))
  expect(result.current.liveRemainingFloat).toBe(1.75)
  visible = false
  rerender()
  await act(async () => vi.advanceTimersByTime(1750))
  expect(onExpire).toHaveBeenCalledTimes(1)
  expect(vi.getTimerCount()).toBe(0)
  unmount()
})
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
