import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SolarSystemSceneState } from '../../src/features/dayNightExplorer/SolarSystem3DManager'
import useSolarSystem3D from '../../src/features/dayNightExplorer/useSolarSystem3D'

const scene = vi.hoisted(() => ({
  construct: vi.fn(),
  update: vi.fn(),
  dispose: vi.fn(),
}))
vi.mock('../../src/features/dayNightExplorer/SolarSystem3DManager', () => ({
  default: class {
    constructor(...args: unknown[]) {
      scene.construct(...args)
    }
    setSceneState = scene.update
    dispose = scene.dispose
  },
}))

const initial = { earthRotationDeg: 10 } as SolarSystemSceneState
let frames: Map<number, FrameRequestCallback>
let frameId: number

function Harness({
  state = initial,
  enabled = true,
}: {
  state?: SolarSystemSceneState
  enabled?: boolean
}) {
  const { canvasRef, globeReady, globeFailed, retryGlobe } = useSolarSystem3D(
    state,
    enabled
  )
  return (
    <>
      <span>Clock available</span>
      {enabled && <canvas ref={canvasRef} />}
      <output>
        {globeReady ? 'Ready' : globeFailed ? 'Failed' : 'Loading'}
      </output>
      <button onClick={retryGlobe}>Retry</button>
    </>
  )
}

function nextFrame() {
  const callbacks = [...frames.values()]
  frames.clear()
  act(() => callbacks.forEach((callback) => callback(0)))
}

beforeEach(() => {
  vi.clearAllMocks()
  frames = new Map()
  frameId = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
})
afterEach(() => vi.unstubAllGlobals())

describe('deferred globe lifecycle', () => {
  it('disposes when hidden and initializes a fresh canvas with current state when shown again', async () => {
    const { rerender, unmount } = render(<Harness enabled={false} />)
    nextFrame()
    nextFrame()
    await act(() => vi.dynamicImportSettled())
    expect(scene.construct).not.toHaveBeenCalled()

    rerender(<Harness />)
    nextFrame()
    nextFrame()
    await act(() => vi.dynamicImportSettled())
    expect(screen.getByText('Ready')).toBeVisible()
    const firstCanvas = scene.construct.mock.calls[0][0]
    rerender(<Harness enabled={false} />)
    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(screen.queryByText('Ready')).not.toBeInTheDocument()

    const updated = { ...initial, earthRotationDeg: 50 }
    rerender(<Harness state={updated} />)
    nextFrame()
    nextFrame()
    await act(() => vi.dynamicImportSettled())
    expect(scene.construct).toHaveBeenCalledTimes(2)
    expect(scene.construct.mock.calls[1][0]).not.toBe(firstCanvas)
    expect(scene.construct).toHaveBeenLastCalledWith(
      expect.any(HTMLCanvasElement),
      updated,
      expect.any(Function)
    )
    expect(screen.getByText('Ready')).toBeVisible()
    unmount()
    expect(scene.dispose).toHaveBeenCalledTimes(2)
  })

  it('allows a failed renderer to retry without blocking the clock', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    scene.construct.mockImplementationOnce(() => {
      throw new Error('WebGL unavailable')
    })
    const { unmount } = render(<Harness />)
    nextFrame()
    nextFrame()
    await act(() => vi.dynamicImportSettled())
    expect(screen.getByText('Failed')).toBeVisible()
    expect(screen.getByText('Clock available')).toBeVisible()
    fireEvent.click(screen.getByText('Retry'))
    nextFrame()
    nextFrame()
    await act(() => vi.dynamicImportSettled())
    expect(screen.getByText('Ready')).toBeVisible()
    expect(screen.queryByText('Failed')).not.toBeInTheDocument()
    unmount()
    log.mockRestore()
  })
})
