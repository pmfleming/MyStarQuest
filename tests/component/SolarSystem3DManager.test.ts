import * as THREE from 'three'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SolarSystem3DManager, {
  type SolarSystemSceneState,
} from '../../src/features/dayNightExplorer/SolarSystem3DManager'
import type { CachedEarthTexture } from '../../src/features/dayNightExplorer/earthTextureCache'

const loadPixels = vi.hoisted(() => vi.fn())
const rendererDispose = vi.hoisted(() => vi.fn())
vi.mock('../../src/features/dayNightExplorer/earthTextureCache', () => ({
  loadEarthTexturePixels: loadPixels,
}))
vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: class {
    dispose = rendererDispose
    setPixelRatio() {}
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

it('does not upload shared pixels when a tab closes before generation finishes', async () => {
  let complete!: (pixels: CachedEarthTexture) => void
  loadPixels.mockReturnValue(
    new Promise<CachedEarthTexture>((resolve) => {
      complete = resolve
    })
  )
  const manager = new SolarSystem3DManager(
    document.createElement('canvas'),
    state
  )
  manager.dispose()
  const textureDispose = vi.spyOn(THREE.Texture.prototype, 'dispose')
  const colorSet = vi.spyOn(THREE.Color.prototype, 'set')
  complete({ pixels: new Uint8Array(16), generateMipmaps: false })
  await Promise.resolve()
  expect(colorSet).not.toHaveBeenCalled()
  expect(textureDispose).not.toHaveBeenCalled()
  expect(rendererDispose).toHaveBeenCalledOnce()
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
