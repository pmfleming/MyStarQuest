import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useExplorerClock from '../../src/features/dayNightExplorer/useExplorerClock'
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

  it('keeps external synchronization, adjustments, and ticking on the same time', () => {
    const onUpdate = vi.fn()
    const { result, unmount } = renderHook(() =>
      useExplorerClock({ initialMinutes: 0, initialSeconds: 0, onUpdate })
    )
    act(() => result.current.syncClockTime({ totalMinutes: 1439, seconds: 59 }))
    act(() => result.current.adjustMinutes(2))
    expect(onUpdate).toHaveBeenLastCalledWith(1441, 59)
    act(() => vi.advanceTimersByTime(1000))
    expect(onUpdate).toHaveBeenLastCalledWith(1442, 0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('commits the final pointer position even before its animation frame runs', () => {
    const onUpdate = vi.fn()
    const { result, unmount } = renderHook(() =>
      useExplorerClock({ initialMinutes: 0, initialSeconds: 0, onUpdate })
    )
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    } as DOMRect)
    result.current.svgRef.current = svg
    act(() =>
      result.current.handlePointerDown(
        {
          stopPropagation: vi.fn(),
          currentTarget: { setPointerCapture: vi.fn() },
          pointerId: 1,
          clientX: 50,
          clientY: 0,
        } as unknown as Parameters<typeof result.current.handlePointerDown>[0],
        'minute'
      )
    )
    act(() =>
      window.dispatchEvent(
        Object.assign(new Event('pointermove'), { clientX: 100, clientY: 50 })
      )
    )
    act(() => window.dispatchEvent(new Event('pointerup')))
    expect(result.current.minutes).toBe(15)
    expect(result.current.isDragging).toBe(false)
    expect(onUpdate).toHaveBeenLastCalledWith(15, 0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
