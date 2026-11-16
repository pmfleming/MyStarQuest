import { afterEach, expect, it, vi } from 'vitest'
import { subscribeDayChange } from '../../src/lib/dayChange'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
it('shares one timer, stays silent within a day, and catches up after visibility resumes', () => {
  vi.useFakeTimers()
  let day = '2026-11-16',
    hidden = false
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
  const first = vi.fn(),
    second = vi.fn()
  const off1 = subscribeDayChange(() => day, first),
    off2 = subscribeDayChange(() => day, second)
  try {
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(180_000)
    expect(first).not.toHaveBeenCalled()
    hidden = true
    day = '2026-11-17'
    vi.advanceTimersByTime(60_000)
    expect(second).not.toHaveBeenCalled()
    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    off1()
    expect(vi.getTimerCount()).toBe(1)
  } finally {
    off1()
    off2()
  }
  expect(vi.getTimerCount()).toBe(0)
})
