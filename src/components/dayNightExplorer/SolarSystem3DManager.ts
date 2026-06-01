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

const MONTH_LABELS: string[] = [
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
]

type CityVisual = {
  cityId: ExplorerFocusId
  anchor: THREE.Group
  marker: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>
  pulse: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  pulseTtl: number
  pulseStrokeWidth: number
  pulseOffsetMs: number
}

export type SolarSystemSceneState = {
  displayMode: ExplorerDisplayMode
  earthRotationDeg: number
  earthOrbitProgress: number
  activeFocusId: ExplorerFocusId
  cityOptions: ExplorerCityOption[]
  sunPosition: SunPosition
  monthLabelFontFamily: string
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

type TopoJsonArcPoint = [number, number]
type TopoJsonArc = TopoJsonArcPoint[]

type TopoJsonTransform = {
  scale: [number, number]
  translate: [number, number]
}

type TopoJsonPolygonGeometry = {
  type: 'Polygon'
  arcs: number[][]
}

type TopoJsonMultiPolygonGeometry = {
  type: 'MultiPolygon'
  arcs: number[][][]
}

type TopoJsonGeometry = TopoJsonPolygonGeometry | TopoJsonMultiPolygonGeometry

type TopoJsonGeometryCollection = {
  type: 'GeometryCollection'
  geometries: TopoJsonGeometry[]
}

type TopoJsonWorldData = {
  transform: TopoJsonTransform
  arcs: TopoJsonArc[]
  objects: {
    land: TopoJsonGeometryCollection
    countries: TopoJsonGeometryCollection
  }
}

const isNumberPair = (value: unknown): value is [number, number] =>
  Array.isArray(value) &&
  value.length === 2 &&
  typeof value[0] === 'number' &&
  typeof value[1] === 'number'

const isTopoJsonTransform = (value: unknown): value is TopoJsonTransform =>
  typeof value === 'object' &&
  value !== null &&
  'scale' in value &&
  isNumberPair(value.scale) &&
  'translate' in value &&
  isNumberPair(value.translate)

const isArc = (value: unknown): value is TopoJsonArc =>
  Array.isArray(value) && value.every(isNumberPair)

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'number')

const isPolygonGeometry = (value: unknown): value is TopoJsonPolygonGeometry =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  value.type === 'Polygon' &&
  'arcs' in value &&
  Array.isArray(value.arcs) &&
  value.arcs.every(isNumberArray)

const isMultiPolygonGeometry = (
  value: unknown
): value is TopoJsonMultiPolygonGeometry =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  value.type === 'MultiPolygon' &&
  'arcs' in value &&
  Array.isArray(value.arcs) &&
  value.arcs.every(
    (polygon) => Array.isArray(polygon) && polygon.every(isNumberArray)
  )

const isGeometryCollection = (
  value: unknown
): value is TopoJsonGeometryCollection =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  value.type === 'GeometryCollection' &&
  'geometries' in value &&
  Array.isArray(value.geometries) &&
  value.geometries.every(
    (geometry) =>
      isPolygonGeometry(geometry) || isMultiPolygonGeometry(geometry)
  )

const parseTopoJsonWorldData = (value: unknown): TopoJsonWorldData => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'transform' in value &&
    isTopoJsonTransform(value.transform) &&
    'arcs' in value &&
    Array.isArray(value.arcs) &&
    value.arcs.every(isArc) &&
    'objects' in value &&
    typeof value.objects === 'object' &&
    value.objects !== null &&
    'land' in value.objects &&
    'countries' in value.objects &&
    isGeometryCollection(value.objects.land) &&
    isGeometryCollection(value.objects.countries)
  ) {
    return {
      transform: value.transform,
      arcs: value.arcs,
      objects: {
        land: value.objects.land,
        countries: value.objects.countries,
      },
    }
  }

  throw new Error('Invalid TopoJSON world data')
}

const decodeTopologyArcs = (world: TopoJsonWorldData) =>
  world.arcs.map((arc) => {
    let x = 0
    let y = 0

    return arc.map(([dx, dy]) => {
      x += dx
      y += dy

      return [
        x * world.transform.scale[0] + world.transform.translate[0],
        y * world.transform.scale[1] + world.transform.translate[1],
      ] satisfies GeoCoordinate
    })
  })

const getDecodedArc = (decodedArcs: GeoRing[], arcIndex: number): GeoRing => {
  const resolvedIndex = arcIndex >= 0 ? arcIndex : ~arcIndex
  const points = decodedArcs[resolvedIndex] ?? []

  return arcIndex >= 0 ? points : [...points].reverse()
}

const stitchRing = (decodedArcs: GeoRing[], ringArcIndexes: number[]) =>
  ringArcIndexes.flatMap((arcIndex, index) => {
    const points = getDecodedArc(decodedArcs, arcIndex)
    return index === 0 ? points : points.slice(1)
  })

const topologyObjectToFeatureCollection = (
  world: TopoJsonWorldData,
  object: TopoJsonGeometryCollection
): GeoFeatureCollection => {
  const decodedArcs = decodeTopologyArcs(world)

  return {
    features: object.geometries.map((geometry) => {
      if (geometry.type === 'Polygon') {
        return {
          geometry: {
            type: 'Polygon',
            coordinates: geometry.arcs.map((ring) =>
              stitchRing(decodedArcs, ring)
            ),
          },
        } satisfies GeoPolygonFeature
      }

      return {
        geometry: {
          type: 'MultiPolygon',
          coordinates: geometry.arcs.map((polygon) =>
            polygon.map((ring) => stitchRing(decodedArcs, ring))
          ),
        },
      } satisfies GeoMultiPolygonFeature
    }),
  }
}

const drawRing = (
  context: CanvasRenderingContext2D,
  ring: GeoRing,
  project: (lon: number, lat: number) => number[]
) => {
  ring.forEach((coord, i: number) => {
    const [x, y] = project(coord[0], coord[1])
    if (i === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
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
  private readonly earthMesh: THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshStandardMaterial
  >
  private readonly atmosphereMesh: THREE.Mesh
  private readonly cityMarkerGroup: THREE.Group
  private readonly starField: THREE.Points
  private readonly orbitLine: THREE.LineLoop<
    THREE.BufferGeometry,
    THREE.LineBasicMaterial
  >
  private readonly monthTickGroup: THREE.Group
  private readonly monthLabelGroup: THREE.Group
  private readonly cameraTarget = new THREE.Vector3()
  private readonly lookTarget = new THREE.Vector3()
  private readonly desiredCameraPosition = new THREE.Vector3()
  private readonly desiredLookTarget = new THREE.Vector3()
  private readonly earthPosition = new THREE.Vector3()
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
      emissiveIntensity: 0.03,
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
        opacity: 0.12,
      })
    )
    this.earthTiltGroup.add(this.atmosphereMesh)

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
    this.orbitLine.material.dispose()
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
      this.ambientLight.intensity = 0.03
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

      visual.marker.material.color.set(city.color)

      visual.marker.scale.setScalar(
        state.activeFocusId === city.id
          ? ACTIVE_CITY_MARKER_RADIUS
          : CITY_MARKER_RADIUS
      )

      const pulseMaterial = visual.pulse.material
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
      const pulseMaterial = visual.pulse.material
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

    this.earthTexture = new THREE.CanvasTexture(canvas)
    this.earthTexture.colorSpace = THREE.SRGBColorSpace
    this.earthMesh.material.map = this.earthTexture
    this.earthMesh.material.needsUpdate = true

    try {
      const response = await fetch('/data/world-50m-2024.json')
      if (!response.ok) {
        throw new Error(`Map data request failed with ${response.status}`)
      }

      const world = parseTopoJsonWorldData(await response.json())
      const land = topologyObjectToFeatureCollection(world, world.objects.land)
      const countries = topologyObjectToFeatureCollection(
        world,
        world.objects.countries
      )

      const project = (lon: number, lat: number) => {
        const x = ((lon + 180) / 360) * width
        const y = ((90 - lat) / 180) * height
        return [x, y]
      }

      // Draw land
      context.beginPath()
      land.features.forEach((feature: GeoFeature) => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates.forEach((ring) => {
            drawRing(context, ring, project)
          })
        } else {
          feature.geometry.coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
              drawRing(context, ring, project)
            })
          })
        }
      })
      context.fillStyle = '#2ed573'
      context.fill()

      // Draw country outlines
      context.beginPath()
      countries.features.forEach((feature: GeoFeature) => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates.forEach((ring) => {
            drawRing(context, ring, project)
          })
        } else {
          feature.geometry.coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
              drawRing(context, ring, project)
            })
          })
        }
      })
      context.strokeStyle = 'rgba(0, 80, 0, 0.4)'
      context.lineWidth = 1
      context.stroke()

      this.earthTexture.needsUpdate = true
    } catch (error) {
      console.error('Failed to load map data for 3D Earth', error)
    }
  }

  private disposeObject(object: THREE.Object3D) {
    object.traverse((node: THREE.Object3D) => {
      if (!(node instanceof THREE.Mesh)) return
      const mesh = node
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
