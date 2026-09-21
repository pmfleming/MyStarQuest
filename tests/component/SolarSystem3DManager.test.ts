import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SolarSystem3DManager, {
  type SolarSystemSceneState,
} from '../../src/features/dayNightExplorer/SolarSystem3DManager'

const loadPixels = vi.hoisted(() => vi.fn())
const rendererDispose = vi.hoisted(() => vi.fn())
const rendererSize = vi.hoisted(() => vi.fn())
const rendererRatio = vi.hoisted(() => vi.fn())
vi.mock('../../src/features/dayNightExplorer/earthTextureCache', () => ({
  loadEarthTexturePixels: loadPixels,
}))
vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: class {
    domElement: HTMLCanvasElement
    constructor({ canvas }: { canvas: HTMLCanvasElement }) {
      this.domElement = canvas
    }
    dispose = rendererDispose
    setPixelRatio = rendererRatio
    setSize = rendererSize
    render() {}
  },
}))

const state: SolarSystemSceneState = {
  displayMode: 'earth-focus',
  earthRotationDeg: 0,
  earthOrbitProgress: 0,
  activeFocusId: 'earth',
  cityOptions: [],
  sunPosition: { latitude: 0, longitude: 0 },
  monthLabelFontFamily: 'sans-serif',
}

beforeEach(() => {
  rendererDispose.mockClear()
  rendererSize.mockClear()
  rendererRatio.mockClear()
  loadPixels.mockReset()
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    clearRect() {},
    strokeText() {},
    fillText() {},
  } as unknown as CanvasRenderingContext2D)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('disconnects visibility observers and never restarts a disposed scene', () => {
  loadPixels.mockReturnValue(new Promise(() => {}))
  const disconnect = vi.fn()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect = disconnect
    }
  )
  const removeListener = vi.spyOn(document, 'removeEventListener')
  const manager = new SolarSystem3DManager(
    document.createElement('canvas'),
    state
  )
  manager.dispose()
  expect(disconnect).toHaveBeenCalledOnce()
  expect(removeListener).toHaveBeenCalledWith(
    'visibilitychange',
    expect.any(Function)
  )
  expect(cancelAnimationFrame).toHaveBeenCalled()
  vi.mocked(requestAnimationFrame).mockClear()
  document.dispatchEvent(new Event('visibilitychange'))
  manager.setSceneState({ ...state, monthLabelFontFamily: 'serif' })
  expect(requestAnimationFrame).not.toHaveBeenCalled()
})
