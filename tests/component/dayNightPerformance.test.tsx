import { StrictMode } from 'react'
import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useExplorerClock from '../../src/components/dayNightExplorer/useExplorerClock'
import StarInfoBox from '../../src/components/ui/StarInfoBox'
import { themes } from '../../src/contexts/ThemeContext'

describe('day/night performance safeguards', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('updates second-level visuals without a React render every second', () => {
    const onUpdate = vi.fn()
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount += 1
      return useExplorerClock({
        initialMinutes: 10,
        initialSeconds: 58,
        onUpdate,
      })
    })
    const initialRenderCount = renderCount
    onUpdate.mockClear()

    act(() => vi.advanceTimersByTime(1000))

    expect(renderCount).toBe(initialRenderCount)
    expect(onUpdate).toHaveBeenLastCalledWith(10, 59)

    act(() => vi.advanceTimersByTime(1000))

    expect(result.current.minutes).toBe(11)
    expect(result.current.seconds).toBe(0)
    expect(renderCount).toBeGreaterThan(initialRenderCount)
  })

  it('cancels star animation work when the component unmounts', () => {
    const { unmount } = render(
      <StarInfoBox theme={themes.princess} totalStars={5} />
    )

    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('restarts the star animation after the Strict Mode effect replay', () => {
    const { container } = render(
      <StrictMode>
        <StarInfoBox theme={themes.princess} totalStars={5} />
      </StrictMode>
    )

    expect(vi.getTimerCount()).toBeGreaterThan(0)

    act(() => vi.advanceTimersByTime(5000))

    expect(container).toHaveTextContent('5')
  })
})
