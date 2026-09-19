import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import useSolarSystem3D from '../../src/features/dayNightExplorer/useSolarSystem3D'
import type { SolarSystemSceneState } from '../../src/features/dayNightExplorer/SolarSystem3DManager'

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

function Harness({ state = initial }: { state?: SolarSystemSceneState }) {
  const { canvasRef, globeReady, globeFailed, updateSceneState, retryGlobe } =
    useSolarSystem3D(state)
  return (
    <>
      <span>Clock available</span>
      <canvas ref={canvasRef} />
      <output>
        {globeReady ? 'Ready' : globeFailed ? 'Failed' : 'Loading'}
      </output>
      <button
        onClick={() => updateSceneState({ ...state, earthRotationDeg: 75 })}
      >
        Drag clock
      </button>
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
  it('paints the shell first, initializes with the latest drag state, and disposes once', async () => {
    const { rerender, unmount } = render(
      <StrictMode>
        <Harness />
      </StrictMode>
    )
    expect(screen.getByText('Clock available')).toBeVisible()
    expect(scene.construct).not.toHaveBeenCalled()
    nextFrame()
    expect(scene.construct).not.toHaveBeenCalled()
    const updated = { ...initial, earthRotationDeg: 50 }
    rerender(
      <StrictMode>
        <Harness state={updated} />
      </StrictMode>
    )
    const dragged = { ...updated, earthRotationDeg: 75 }
    fireEvent.click(screen.getByText('Drag clock'))
    nextFrame()
    await act(() => vi.dynamicImportSettled())
    expect(scene.construct).toHaveBeenCalledExactlyOnceWith(
      expect.any(HTMLCanvasElement),
      dragged
    )
    expect(screen.getByText('Ready')).toBeVisible()
    fireEvent.click(screen.getByText('Drag clock'))
    expect(scene.update).toHaveBeenLastCalledWith(dragged)
    unmount()
    expect(scene.dispose).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
  })

  it('never creates WebGL after leaving while the module is loading', async () => {
    const { unmount } = render(<Harness />)
    nextFrame()
    nextFrame()
    unmount()
    await act(() => vi.dynamicImportSettled())
    expect(scene.construct).not.toHaveBeenCalled()
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
