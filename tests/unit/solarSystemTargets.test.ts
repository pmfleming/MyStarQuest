import { afterEach, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import SolarSystem3DManager, {
  type SolarSystemSceneState,
} from '../../src/features/dayNightExplorer/SolarSystem3DManager'
import * as geometry from '../../src/features/dayNightExplorer/solarSystemGeometry'

const render = vi.hoisted(() => vi.fn())
vi.mock('three', async (original) => ({
  ...(await original<typeof THREE>()),
  WebGLRenderer: class {
    domElement: HTMLCanvasElement
    constructor({ canvas }: { canvas: HTMLCanvasElement }) {
      this.domElement = canvas
    }
    setPixelRatio() {}
    setSize() {}
    dispose() {}
    render = render
  },
}))
vi.mock('../../src/features/dayNightExplorer/earthTextureCache', () => ({
  loadEarthTexturePixels: () => new Promise(() => {}),
}))
vi.mock('../../src/features/dayNightExplorer/solarSystemGeometry', {
  spy: true,
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  render.mockClear()
})

it('calculates focus targets once per input change while continuing animation', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  let frame: FrameRequestCallback = () => {}
  vi.stubGlobal('requestAnimationFrame', (next: FrameRequestCallback) => {
    frame = next
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const state: SolarSystemSceneState = {
    displayMode: 'earth-focus',
    earthRotationDeg: 90,
    earthOrbitProgress: 0.25,
    orbitYear: 2026,
    activeFocusId: 'earth',
    cityOptions: [],
    sunPosition: { latitude: 10, longitude: 30 },
    monthLabelFontFamily: 'sans-serif',
  }
  const centered = vi.mocked(geometry.getCenteredLongitude)
  centered.mockClear()
  const manager = new SolarSystem3DManager(
    document.createElement('canvas'),
    state
  )
  for (let i = 0; i < 120; i++) frame(i * (1000 / 60))
  expect(render).toHaveBeenCalledTimes(60)
  expect(centered).toHaveBeenCalledTimes(1)
  const scene = render.mock.calls[0][0] as THREE.Scene
  const light = scene.children.find(
    (object) => object instanceof THREE.PointLight
  ) as THREE.PointLight
  const expected = geometry.latLonToVector(10, -180, 3.2)
  expect(light.position.distanceTo(expected)).toBeLessThan(0.00001)
  manager.setSceneState({ ...state, displayMode: 'solar-focus' })
  frame(2000)
  const earthAnchor = scene.children.find(
    (object) =>
      object instanceof THREE.Group && object.children[0] instanceof THREE.Group
  )!
  expect(earthAnchor.position.x).toBeCloseTo(1.55)
  expect(earthAnchor.position.y).toBeCloseTo(0)
  manager.setSceneState({
    ...state,
    sunPosition: { latitude: 20, longitude: 60 },
  })
  frame(2016)
  expect(centered).toHaveBeenCalledTimes(2)
  manager.dispose()
})

it('renders reduced motion only on invalidation and resumes ambient animation when enabled', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  const preference = {
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', () => preference)
  const frames: FrameRequestCallback[] = []
  vi.stubGlobal('requestAnimationFrame', (next: FrameRequestCallback) => {
    frames.push(next)
    return frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const state: SolarSystemSceneState = {
    displayMode: 'earth-focus',
    earthRotationDeg: 90,
    earthOrbitProgress: 0.25,
    orbitYear: 2026,
    activeFocusId: 'earth',
    cityOptions: [],
    sunPosition: { latitude: 10, longitude: 30 },
    monthLabelFontFamily: 'sans-serif',
  }
  const manager = new SolarSystem3DManager(
    document.createElement('canvas'),
    state
  )
  frames.shift()!(0)
  expect(render).toHaveBeenCalledOnce()
  expect(frames).toHaveLength(0)
  manager.setSceneState({ ...state, displayMode: 'solar-focus' })
  frames.shift()!(100)
  expect(render).toHaveBeenCalledTimes(2)
  expect(frames).toHaveLength(0)
  window.dispatchEvent(new Event('resize'))
  frames.shift()!(200)
  expect(render).toHaveBeenCalledTimes(3)
  preference.matches = false
  preference.addEventListener.mock.calls[0][1]()
  frames.shift()!(300)
  expect(frames).toHaveLength(1)
  manager.dispose()
  expect(preference.removeEventListener).toHaveBeenCalledWith(
    'change',
    preference.addEventListener.mock.calls[0][1]
  )
})
