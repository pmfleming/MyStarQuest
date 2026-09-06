import * as THREE from 'three'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SolarSystem3DManager, {
  type SolarSystemSceneState,
} from '../../src/components/dayNightExplorer/SolarSystem3DManager'
import type { CachedEarthTexture } from '../../src/lib/dayNightExplorer/earthTextureCache'

const loadPixels = vi.hoisted(() => vi.fn())
const rendererDispose = vi.hoisted(() => vi.fn())
vi.mock('../../src/lib/dayNightExplorer/earthTextureCache', () => ({
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

it('cleans up replaced labels and makes scene disposal idempotent', async () => {
  loadPixels.mockResolvedValue({
    pixels: new Uint8Array(16),
    generateMipmaps: false,
  })
  const materialDispose = vi.spyOn(THREE.Material.prototype, 'dispose')
  const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose')
  const textureDispose = vi.spyOn(THREE.Texture.prototype, 'dispose')
  const manager = new SolarSystem3DManager(
    document.createElement('canvas'),
    state
  )
  await Promise.resolve()
  manager.setSceneState({ ...state, monthLabelFontFamily: 'serif' })
  expect(materialDispose).toHaveBeenCalledTimes(12)
  expect(textureDispose).toHaveBeenCalledTimes(12)

  manager.dispose()
  // Sun, Earth, atmosphere, orbit, starfield, 12 ticks, 12 current labels.
  expect(materialDispose).toHaveBeenCalledTimes(12 + 29)
  expect(geometryDispose).toHaveBeenCalledTimes(18)
  expect(textureDispose).toHaveBeenCalledTimes(12 + 12 + 1)
  expect(rendererDispose).toHaveBeenCalledOnce()
  manager.dispose()
  expect(rendererDispose).toHaveBeenCalledOnce()
  expect(materialDispose).toHaveBeenCalledTimes(12 + 29)
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
