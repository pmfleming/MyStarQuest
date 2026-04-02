import * as THREE from 'three'
import type {
  ExplorerCityOption,
  ExplorerDisplayMode,
  ExplorerFocusId,
} from '../../lib/dayNightExplorer/dayNightExplorerOptions'
import type { SunPosition } from '../../lib/solar'

const EARTH_RADIUS = 0.26
const EARTH_ORBIT_X = 1.55
const EARTH_ORBIT_Y = 1.08
const MOON_ORBIT_RADIUS = 0.6
const AXIAL_TILT_DEG = 23.4
const SOLAR_FOCUS_CAMERA_POSITION = new THREE.Vector3(0, 0, 4.9)
const EARTH_FOCUS_CAMERA_POSITION = new THREE.Vector3(0, 0, 0.88)
const SOLAR_FOCUS_LOOK_TARGET_X = -0.12
const EARTH_FOCUS_LOOK_TARGET_X = -0.03
const EARTH_FOCUS_CENTER_LATITUDE_DEG = 10
const CITY_MARKER_RADIUS = 0.008
const ACTIVE_CITY_MARKER_RADIUS = 0.009
const PING_SURFACE_OFFSET = 1
const PING_MIN_SCALE = ACTIVE_CITY_MARKER_RADIUS
const PING_MAX_SCALE = PING_MIN_SCALE * 2
const EARTH_FOCUS_LIGHT_DISTANCE = 3.2
const MONTH_LABEL_OFFSET_X = 0.08
const MONTH_LABEL_OFFSET_Y = 0.05
const MONTH_LABEL_SCALE_X = 0.72
const MONTH_LABEL_SCALE_Y = 0.26
const MONTH_LABEL_Z = 0
const MONTH_TICK_INSET_X = 0.14
const MONTH_TICK_INSET_Y = 0.1
const MONTH_TICK_OUTSET_X = 0.015
const MONTH_TICK_OUTSET_Y = 0.01

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'Jun',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

type CityVisual = {
  cityId: ExplorerFocusId
  anchor: THREE.Group
  marker: THREE.Mesh
  pulse: THREE.Mesh
  pulseTtl: number
  pulseStrokeWidth: number
  pulseOffsetMs: number
}

export type SolarSystemSceneState = {
  displayMode: ExplorerDisplayMode
  earthRotationDeg: number
  earthOrbitProgress: number
  moonOrbitProgress: number
  activeFocusId: ExplorerFocusId
  cityOptions: ExplorerCityOption[]
  sunPosition: SunPosition
  monthLabelFontFamily: string
}

declare global {
  interface Window {
    topojson?: {
      feature: (
        world: TopoJsonWorldData,
        object: TopoJsonGeometryObject
      ) => GeoFeatureCollection
    }
  }
}

type GeoCoordinate = [number, number]
type GeoRing = GeoCoordinate[]
type GeoPolygonCoordinates = GeoRing[]
type GeoMultiPolygonCoordinates = GeoPolygonCoordinates[]

type GeoPolygonFeature = {
  geometry: {
    type: 'Polygon'
    coordinates: GeoPolygonCoordinates
  }
}

type GeoMultiPolygonFeature = {
  geometry: {
    type: 'MultiPolygon'
    coordinates: GeoMultiPolygonCoordinates
  }
}

type GeoFeature = GeoPolygonFeature | GeoMultiPolygonFeature

type GeoFeatureCollection = {
  features: GeoFeature[]
}

type TopoJsonGeometryObject = {
  type: string
}

type TopoJsonWorldData = {
  objects: {
    land: TopoJsonGeometryObject
    countries: TopoJsonGeometryObject
  }
}

const latLonToVector = (
  latitude: number,
  longitude: number,
  radius: number
) => {
  const phi = THREE.MathUtils.degToRad(90 - latitude)
  const theta = THREE.MathUtils.degToRad(longitude + 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

const buildOrbitLine = () => {
  const points: THREE.Vector3[] = []
  const segments = 128

  for (let index = 0; index <= segments; index += 1) {
    const progress = index / segments
    const angle = Math.PI / 2 - progress * Math.PI * 2
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * EARTH_ORBIT_X,
        Math.sin(angle) * EARTH_ORBIT_Y,
        0
      )
    )
  }

  return new THREE.BufferGeometry().setFromPoints(points)
}

const normalizeLongitude = (longitude: number) =>
  ((((longitude + 180) % 360) + 360) % 360) - 180

const getCenteredLongitude = (state: SolarSystemSceneState) => {
  if (state.activeFocusId === 'earth') {
    return normalizeLongitude(state.sunPosition.longitude + 90)
  }

  const city = state.cityOptions.find(
    (entry) => entry.id === state.activeFocusId
  )
  if (city) {
    return city.location.longitude
  }

  return normalizeLongitude(state.sunPosition.longitude + 90)
}

const getEarthViewRotationY = (centeredLongitude: number) =>
  THREE.MathUtils.degToRad(-(centeredLongitude + 90))

const lerpAngle = (current: number, target: number, amount: number) => {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current)
  )
  return current + delta * amount
}

export default class SolarSystem3DManager {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly ambientLight: THREE.AmbientLight
  private readonly sunLight: THREE.PointLight
  private readonly sunMesh: THREE.Mesh
  private readonly earthOrbitAnchor: THREE.Group
  private readonly earthTiltGroup: THREE.Group
  private readonly earthMesh: THREE.Mesh
  private readonly atmosphereMesh: THREE.Mesh
  private readonly moonPivot: THREE.Group
  private readonly moonMesh: THREE.Mesh
  private readonly cityMarkerGroup: THREE.Group
  private readonly starField: THREE.Points
  private readonly orbitLine: THREE.LineLoop
  private readonly monthTickGroup: THREE.Group
  private readonly monthLabelGroup: THREE.Group
  private readonly monthLabelSprites: THREE.Sprite[] = []
  private readonly earthFocusTarget = new THREE.Vector3()
  private readonly cameraTarget = new THREE.Vector3()
  private readonly lookTarget = new THREE.Vector3()
  private readonly desiredCameraPosition = new THREE.Vector3()
  private readonly desiredLookTarget = new THREE.Vector3()
  private readonly earthPosition = new THREE.Vector3()
  private readonly moonPosition = new THREE.Vector3()
  private readonly desiredSunLightPosition = new THREE.Vector3()
  private readonly earthWorldPosition = new THREE.Vector3()
  private readonly cityWorldPosition = new THREE.Vector3()
  private readonly cameraDirectionFromEarth = new THREE.Vector3()
  private readonly citySurfaceNormal = new THREE.Vector3()
  private readonly outwardNormal = new THREE.Vector3()
  private animationFrameId: number | null = null
  private disposed = false
  private sceneState: SolarSystemSceneState
  private earthTexture: THREE.CanvasTexture | null = null
  private monthLabelTextures: THREE.CanvasTexture[] = []
  private cityVisuals: CityVisual[] = []

  constructor(canvas: HTMLCanvasElement, initialState: SolarSystemSceneState) {
    this.sceneState = initialState
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#06111f')

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
    this.camera.position.copy(SOLAR_FOCUS_CAMERA_POSITION)
    this.camera.lookAt(0, 0, 0)
    this.cameraTarget.copy(this.camera.position)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

    this.ambientLight = new THREE.AmbientLight('#7aa2ff', 0.5)
    this.scene.add(this.ambientLight)

    this.sunLight = new THREE.PointLight('#fff2c0', 22, 0, 2)
    this.scene.add(this.sunLight)

    const sunMaterial = new THREE.MeshBasicMaterial({ color: '#ffd76a' })
    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 48, 48),
      sunMaterial
    )
    this.scene.add(this.sunMesh)

    this.orbitLine = new THREE.LineLoop(
      buildOrbitLine(),
      new THREE.LineBasicMaterial({
        color: '#7fb2ff',
        transparent: true,
        opacity: 0.22,
      })
    )
    this.scene.add(this.orbitLine)

    this.monthTickGroup = this.createMonthTicks()
    this.scene.add(this.monthTickGroup)

    this.monthLabelGroup = this.createMonthLabels(
      initialState.monthLabelFontFamily
    )
    this.scene.add(this.monthLabelGroup)

    this.earthOrbitAnchor = new THREE.Group()
    this.scene.add(this.earthOrbitAnchor)

    this.earthTiltGroup = new THREE.Group()
    this.earthTiltGroup.rotation.z = THREE.MathUtils.degToRad(AXIAL_TILT_DEG)
    this.earthOrbitAnchor.add(this.earthTiltGroup)

    const earthMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.95,
      metalness: 0.02,
      emissive: '#07111f',
      emissiveIntensity: 0.3,
    })
    this.earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS, 64, 64),
      earthMaterial
    )
    this.earthTiltGroup.add(this.earthMesh)

    this.atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(EARTH_RADIUS * 1.08, 48, 48),
      new THREE.MeshBasicMaterial({
        color: '#77c4ff',
        transparent: true,
        opacity: 0.18,
      })
    )
    this.earthTiltGroup.add(this.atmosphereMesh)

    this.moonPivot = new THREE.Group()
    this.earthOrbitAnchor.add(this.moonPivot)

    this.moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 32, 32),
      new THREE.MeshStandardMaterial({
        color: '#eef2f7',
        roughness: 0.95,
        metalness: 0,
        emissive: '#5e6673',
        emissiveIntensity: 0.18,
      })
    )
    this.moonPivot.add(this.moonMesh)

    this.cityMarkerGroup = new THREE.Group()
    this.earthMesh.add(this.cityMarkerGroup)

    this.starField = this.createStarField()
    this.scene.add(this.starField)

    this.rebuildCityMarkers(initialState)
    this.initEarthTexture()
    this.animate()
  }

  setSceneState(nextState: SolarSystemSceneState) {
    if (
      this.sceneState.monthLabelFontFamily !== nextState.monthLabelFontFamily
    ) {
      this.rebuildMonthLabels(nextState.monthLabelFontFamily)
    }
    this.sceneState = nextState
    this.syncCityVisualState(nextState)
  }

  dispose() {
    this.disposed = true
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }

    this.renderer.dispose()
    this.orbitLine.geometry.dispose()
    ;(this.orbitLine.material as THREE.Material).dispose()
    if (this.earthTexture) {
      this.earthTexture.dispose()
    }
    this.monthLabelTextures.forEach((texture) => texture.dispose())
    this.disposeObject(this.scene)
  }

  private animate = () => {
    if (this.disposed) {
      return
    }

    this.resizeRendererToDisplaySize()
    this.applySceneState(this.sceneState)
    this.renderer.render(this.scene, this.camera)
    this.animationFrameId = window.requestAnimationFrame(this.animate)
  }

  private applySceneState(state: SolarSystemSceneState) {
    const earthOrbitAngle = Math.PI / 2 - state.earthOrbitProgress * Math.PI * 2

    if (state.displayMode === 'earth-focus') {
      this.earthPosition.set(0, 0, 0)
      this.earthOrbitAnchor.position.set(0, 0, 0)
      this.earthTiltGroup.rotation.z = lerpAngle(
        this.earthTiltGroup.rotation.z,
        0,
        0.12
      )

      const centeredLongitude = getCenteredLongitude(state)
      const targetRotationY = getEarthViewRotationY(centeredLongitude)
      this.earthMesh.rotation.x = lerpAngle(
        this.earthMesh.rotation.x,
        THREE.MathUtils.degToRad(EARTH_FOCUS_CENTER_LATITUDE_DEG),
        0.12
      )
      this.earthMesh.rotation.y = lerpAngle(
        this.earthMesh.rotation.y,
        targetRotationY,
        0.12
      )
    } else {
      this.earthPosition.set(
        Math.cos(earthOrbitAngle) * EARTH_ORBIT_X,
        Math.sin(earthOrbitAngle) * EARTH_ORBIT_Y,
        0
      )
      this.earthOrbitAnchor.position.copy(this.earthPosition)
      this.earthTiltGroup.rotation.z = lerpAngle(
        this.earthTiltGroup.rotation.z,
        THREE.MathUtils.degToRad(AXIAL_TILT_DEG),
        0.08
      )
      this.earthMesh.rotation.x = lerpAngle(this.earthMesh.rotation.x, 0, 0.08)
      this.earthMesh.rotation.y = THREE.MathUtils.degToRad(
        state.earthRotationDeg
      )
    }

    const moonAngle = state.moonOrbitProgress * Math.PI * 2
    this.moonPosition.set(
      Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
      Math.sin(moonAngle) * MOON_ORBIT_RADIUS * 0.75,
      Math.sin(moonAngle * 0.75) * 0.04
    )
    this.moonMesh.position.copy(this.moonPosition)

    if (state.displayMode === 'earth-focus') {
      const centeredLongitude = getCenteredLongitude(state)
      const relativeSunLongitude = normalizeLongitude(
        state.sunPosition.longitude - centeredLongitude
      )
      const relativeSunVector = latLonToVector(
        state.sunPosition.latitude,
        relativeSunLongitude - 90,
        EARTH_FOCUS_LIGHT_DISTANCE
      )

      this.desiredSunLightPosition.copy(relativeSunVector)
      this.sunLight.position.lerp(this.desiredSunLightPosition, 0.12)
      this.sunMesh.visible = false
      this.ambientLight.intensity = 0.12
      this.orbitLine.visible = false
      this.monthTickGroup.visible = false
      this.monthLabelGroup.visible = false
    } else {
      this.sunMesh.visible = true
      this.sunMesh.position.set(0, 0, 0)
      this.sunLight.position.lerp(this.sunMesh.position, 0.08)
      this.ambientLight.intensity = 0.42
      this.orbitLine.visible = true
      this.monthTickGroup.visible = true
      this.monthLabelGroup.visible = true
    }

    this.moonMesh.visible = false

    this.earthFocusTarget.copy(this.earthPosition)

    if (state.displayMode === 'earth-focus') {
      this.desiredCameraPosition.copy(EARTH_FOCUS_CAMERA_POSITION)
      this.desiredLookTarget.set(EARTH_FOCUS_LOOK_TARGET_X, 0, 0)
    } else {
      this.desiredCameraPosition.copy(SOLAR_FOCUS_CAMERA_POSITION)
      this.desiredLookTarget.set(SOLAR_FOCUS_LOOK_TARGET_X, 0, 0)
    }

    this.cameraTarget.lerp(this.desiredCameraPosition, 0.08)
    this.lookTarget.lerp(this.desiredLookTarget, 0.1)
    this.camera.position.copy(this.cameraTarget)
    this.camera.lookAt(this.lookTarget)

    this.updateCityPings(state)
    this.starField.rotation.y += 0.0003
  }

  private rebuildCityMarkers(state: SolarSystemSceneState) {
    while (this.cityMarkerGroup.children.length > 0) {
      const child = this.cityMarkerGroup.children[0]
      this.cityMarkerGroup.remove(child)
      this.disposeObject(child)
    }

    this.cityVisuals = state.cityOptions.map((city, index) => {
      const group = new THREE.Group()
      const surfacePosition = latLonToVector(
        city.location.latitude,
        city.location.longitude,
        EARTH_RADIUS * PING_SURFACE_OFFSET
      )
      group.position.copy(surfacePosition)
      this.outwardNormal.copy(surfacePosition).normalize()
      group.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        this.outwardNormal
      )

      const marker = new THREE.Mesh(
        new THREE.CircleGeometry(1, 24),
        new THREE.MeshBasicMaterial({
          color: city.color,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
          side: THREE.FrontSide,
        })
      )
      marker.renderOrder = 5
      marker.scale.setScalar(CITY_MARKER_RADIUS)
      marker.position.z = 0.0009
      group.add(marker)

      const pulse = new THREE.Mesh(
        new THREE.RingGeometry(0.72, 1, 48),
        new THREE.MeshBasicMaterial({
          color: city.color,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
          side: THREE.FrontSide,
          blending: THREE.AdditiveBlending,
        })
      )
      pulse.renderOrder = 6
      pulse.position.z = 0.0012
      pulse.scale.setScalar(PING_MIN_SCALE)
      group.add(pulse)

      this.cityMarkerGroup.add(group)

      return {
        cityId: city.id,
        anchor: group,
        marker,
        pulse,
        pulseTtl: city.ttl,
        pulseStrokeWidth: city.strokeWidth,
        pulseOffsetMs: index * 333,
      }
    })

    this.syncCityVisualState(state)
  }

  private syncCityVisualState(state: SolarSystemSceneState) {
    for (const visual of this.cityVisuals) {
      const city = state.cityOptions.find((entry) => entry.id === visual.cityId)
      if (!city) {
        continue
      }

      ;(visual.marker.material as THREE.MeshBasicMaterial).color.set(city.color)

      visual.marker.scale.setScalar(
        state.activeFocusId === city.id
          ? ACTIVE_CITY_MARKER_RADIUS
          : CITY_MARKER_RADIUS
      )

      const pulseMaterial = visual.pulse.material as THREE.MeshBasicMaterial
      pulseMaterial.color.set(city.color)
    }
  }

  private updateCityPings(state: SolarSystemSceneState) {
    const now = Date.now()
    this.earthMesh.getWorldPosition(this.earthWorldPosition)
    this.cameraDirectionFromEarth
      .subVectors(this.camera.position, this.earthWorldPosition)
      .normalize()

    for (const visual of this.cityVisuals) {
      visual.anchor.getWorldPosition(this.cityWorldPosition)
      this.citySurfaceNormal
        .subVectors(this.cityWorldPosition, this.earthWorldPosition)
        .normalize()

      const isFrontFacing =
        this.citySurfaceNormal.dot(this.cameraDirectionFromEarth) > 0
      visual.marker.visible =
        state.displayMode === 'earth-focus' ? isFrontFacing : true
      const cycleProgress =
        (((now - visual.pulseOffsetMs) % visual.pulseTtl) + visual.pulseTtl) %
        visual.pulseTtl
      const progress = cycleProgress / visual.pulseTtl
      const opacity = 1 - progress
      const scale =
        PING_MIN_SCALE + (PING_MAX_SCALE - PING_MIN_SCALE) * progress
      const pulseMaterial = visual.pulse.material as THREE.MeshBasicMaterial
      const intensityBoost = state.activeFocusId === visual.cityId ? 0.2 : 0

      pulseMaterial.opacity = Math.max(0, opacity * (1.15 + intensityBoost))
      visual.pulse.scale.setScalar(
        scale * (1 + (visual.pulseStrokeWidth - 3) * 0.03)
      )
      visual.pulse.visible =
        state.displayMode === 'earth-focus' && isFrontFacing
    }
  }

  private resizeRendererToDisplaySize() {
    const canvas = this.renderer.domElement
    const width = canvas.clientWidth || canvas.width
    const height = canvas.clientHeight || canvas.height

    if (width === 0 || height === 0) {
      return
    }

    if (canvas.width !== width || canvas.height !== height) {
      this.renderer.setSize(width, height, false)
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
  }

  private createStarField() {
    const geometry = new THREE.BufferGeometry()
    const starCount = 400
    const positions = new Float32Array(starCount * 3)

    for (let index = 0; index < starCount; index += 1) {
      const radius = 8 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const offset = index * 3

      positions[offset] = radius * Math.sin(phi) * Math.cos(theta)
      positions[offset + 1] = radius * Math.cos(phi)
      positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: '#ffffff',
        size: 0.04,
        sizeAttenuation: true,
      })
    )
  }

  private createMonthLabels(fontFamily: string) {
    const group = new THREE.Group()

    MONTH_LABELS.forEach((label, index) => {
      const progress = index / MONTH_LABELS.length
      const angle = Math.PI / 2 - progress * Math.PI * 2
      const x = Math.cos(angle) * (EARTH_ORBIT_X + MONTH_LABEL_OFFSET_X)
      const y = Math.sin(angle) * (EARTH_ORBIT_Y + MONTH_LABEL_OFFSET_Y)
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.createMonthLabelTexture(label, fontFamily),
          transparent: true,
          depthTest: true,
          depthWrite: false,
        })
      )

      sprite.position.set(x, y, MONTH_LABEL_Z)
      sprite.scale.set(MONTH_LABEL_SCALE_X, MONTH_LABEL_SCALE_Y, 1)
      sprite.material.rotation = 0
      this.monthLabelSprites.push(sprite)
      group.add(sprite)
    })

    return group
  }

  private createMonthTicks() {
    const group = new THREE.Group()

    for (let index = 0; index < MONTH_LABELS.length; index += 1) {
      const progress = index / MONTH_LABELS.length
      const angle = Math.PI / 2 - progress * Math.PI * 2
      const innerPoint = new THREE.Vector3(
        Math.cos(angle) * (EARTH_ORBIT_X - MONTH_TICK_INSET_X),
        Math.sin(angle) * (EARTH_ORBIT_Y - MONTH_TICK_INSET_Y),
        0.08
      )
      const outerPoint = new THREE.Vector3(
        Math.cos(angle) * (EARTH_ORBIT_X + MONTH_TICK_OUTSET_X),
        Math.sin(angle) * (EARTH_ORBIT_Y + MONTH_TICK_OUTSET_Y),
        0.08
      )
      const geometry = new THREE.BufferGeometry().setFromPoints([
        innerPoint,
        outerPoint,
      ])
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: '#d7e6ff',
          transparent: true,
          opacity: 0.8,
        })
      )
      group.add(line)
    }

    return group
  }

  private rebuildMonthLabels(fontFamily: string) {
    while (this.monthLabelGroup.children.length > 0) {
      const child = this.monthLabelGroup.children[0]
      this.monthLabelGroup.remove(child)
      this.disposeObject(child)
    }
    this.monthLabelSprites.length = 0
    this.monthLabelTextures.forEach((texture) => texture.dispose())
    this.monthLabelTextures = []

    MONTH_LABELS.forEach((label, index) => {
      const progress = index / MONTH_LABELS.length
      const angle = Math.PI / 2 - progress * Math.PI * 2
      const x = Math.cos(angle) * (EARTH_ORBIT_X + MONTH_LABEL_OFFSET_X)
      const y = Math.sin(angle) * (EARTH_ORBIT_Y + MONTH_LABEL_OFFSET_Y)
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: this.createMonthLabelTexture(label, fontFamily),
          transparent: true,
          depthTest: true,
          depthWrite: false,
        })
      )
      sprite.position.set(x, y, MONTH_LABEL_Z)
      sprite.scale.set(MONTH_LABEL_SCALE_X, MONTH_LABEL_SCALE_Y, 1)
      sprite.material.rotation = 0
      this.monthLabelSprites.push(sprite)
      this.monthLabelGroup.add(sprite)
    })
  }

  private createMonthLabelTexture(label: string, fontFamily: string) {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 384
    const context = canvas.getContext('2d')

    if (!context) {
      const texture = new THREE.CanvasTexture(canvas)
      this.monthLabelTextures.push(texture)
      return texture
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.font = `700 200px ${fontFamily}`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.lineJoin = 'round'
    context.strokeStyle = 'rgba(6, 17, 31, 0.95)'
    context.lineWidth = 24
    context.shadowColor = 'rgba(6, 17, 31, 1)'
    context.shadowBlur = 28
    context.strokeText(label, canvas.width / 2, canvas.height / 2)
    context.fillStyle = 'rgba(244, 248, 255, 1)'
    context.fillText(label, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    this.monthLabelTextures.push(texture)
    return texture
  }

  private async initEarthTexture() {
    const width = 2048
    const height = 1024
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return

    // Fill ocean
    context.fillStyle = '#1e3799'
    context.fillRect(0, 0, width, height)

    try {
      if (!window.topojson) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/topojson@3'
          script.onload = () => resolve()
          script.onerror = () => reject()
          document.head.appendChild(script)
        })
      }

      const response = await fetch('/data/world-50m-2024.json')
      const world = (await response.json()) as TopoJsonWorldData
      const land = window.topojson.feature(world, world.objects.land)
      const countries = window.topojson.feature(world, world.objects.countries)

      const project = (lon: number, lat: number) => {
        const x = ((lon + 180) / 360) * width
        const y = ((90 - lat) / 180) * height
        return [x, y]
      }

      // Draw land
      context.beginPath()
      land.features.forEach((feature: GeoFeature) => {
        const coordinates = feature.geometry.coordinates
        coordinates.forEach((polygon) => {
          polygon.forEach((ring) => {
            ring.forEach((coord, i: number) => {
              const [x, y] = project(coord[0], coord[1])
              if (i === 0) context.moveTo(x, y)
              else context.lineTo(x, y)
            })
          })
        })
      })
      context.fillStyle = '#2ed573'
      context.fill()

      // Draw country outlines
      context.beginPath()
      countries.features.forEach((feature: GeoFeature) => {
        const coordinates = feature.geometry.coordinates
        if (feature.geometry.type === 'Polygon') {
          coordinates.forEach((ring) => {
            ring.forEach((coord, i: number) => {
              const [x, y] = project(coord[0], coord[1])
              if (i === 0) context.moveTo(x, y)
              else context.lineTo(x, y)
            })
          })
        } else if (feature.geometry.type === 'MultiPolygon') {
          coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
              ring.forEach((coord, i: number) => {
                const [x, y] = project(coord[0], coord[1])
                if (i === 0) context.moveTo(x, y)
                else context.lineTo(x, y)
              })
            })
          })
        }
      })
      context.strokeStyle = 'rgba(0, 80, 0, 0.4)'
      context.lineWidth = 1
      context.stroke()

      this.earthTexture = new THREE.CanvasTexture(canvas)
      this.earthTexture.colorSpace = THREE.SRGBColorSpace
      ;(this.earthMesh.material as THREE.MeshStandardMaterial).map =
        this.earthTexture
      ;(this.earthMesh.material as THREE.MeshStandardMaterial).needsUpdate =
        true
    } catch (error) {
      console.error('Failed to load map data for 3D Earth', error)
    }
  }

  private disposeObject(object: THREE.Object3D) {
    object.traverse((node: THREE.Object3D) => {
      const mesh = node as THREE.Mesh
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }

      const material = mesh.material
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose())
      } else if (material) {
        material.dispose()
      }
    })
  }
}
