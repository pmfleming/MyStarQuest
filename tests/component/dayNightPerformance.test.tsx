import { StrictMode } from 'react'
import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getClockImageLayers } from '../../src/components/dayNightExplorer/clockImageLayers'
import useExplorerClock from '../../src/components/dayNightExplorer/useExplorerClock'
import StarInfoBox from '../../src/components/ui/StarInfoBox'
import { themes } from '../../src/contexts/ThemeContext'
import { renderEarthTexture } from '../../src/lib/dayNightExplorer/earthTextureRenderer'

describe('day/night performance safeguards', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('collapses matching clock backgrounds into one equivalent layer', () => {
    expect(getClockImageLayers('/night.webp', '/night.webp', 0.5)).toEqual([
      {
        key: 'base',
        image: '/night.webp',
        opacity: 0.625,
        zIndex: 3,
      },
    ])
  })

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

  it('renders Earth map data through the worker-compatible renderer', () => {
    const context = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const polygon = { type: 'Polygon', arcs: [[0]] }
    const worldData = {
      transform: { scale: [1, 1], translate: [0, 0] },
      arcs: [
        [
          [0, 0],
          [10, 0],
          [0, 10],
          [-10, 0],
          [0, -10],
        ],
      ],
      objects: {
        land: { type: 'GeometryCollection', geometries: [polygon] },
        countries: { type: 'GeometryCollection', geometries: [polygon] },
      },
    }

    renderEarthTexture(context, 100, 50, worldData)

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 50)
    expect(context.beginPath).toHaveBeenCalledTimes(2)
    expect(context.fill).toHaveBeenCalledOnce()
    expect(context.stroke).toHaveBeenCalledOnce()
  })
})
