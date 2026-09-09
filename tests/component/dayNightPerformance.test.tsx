import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useExplorerClock from '../../src/components/dayNightExplorer/useExplorerClock'
import StarInfoBox from '../../src/components/ui/StarInfoBox'
import { themes } from '../../src/contexts/ThemeContext'

describe('day/night clock and timer cleanup', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('advances seconds and rolls over to the next minute', () => {
    const onUpdate = vi.fn()
    const { result } = renderHook(() => {
      return useExplorerClock({
        initialMinutes: 10,
        initialSeconds: 58,
        onUpdate,
      })
    })
    onUpdate.mockClear()

    act(() => vi.advanceTimersByTime(1000))

    expect(onUpdate).toHaveBeenLastCalledWith(10, 59)

    act(() => vi.advanceTimersByTime(1000))

    expect(result.current.minutes).toBe(11)
    expect(result.current.seconds).toBe(0)
  })

  it('cancels star animation work when the component unmounts', () => {
    const { unmount } = render(
      <StarInfoBox theme={themes.princess} totalStars={5} />
    )

    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
