type GeoCoordinate = [number, number]
export type GeoRing = GeoCoordinate[]
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

export type GeoFeatureCollection = {
  features: GeoFeature[]
}

type TopoJsonArc = [number, number][]

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
  decodedArcs: GeoRing[],
  object: TopoJsonGeometryCollection
): GeoFeatureCollection => {
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

export const parseWorldFeatureCollections = (value: unknown) => {
  const world = parseTopoJsonWorldData(value)
  const decodedArcs = decodeTopologyArcs(world)
  return {
    land: topologyObjectToFeatureCollection(decodedArcs, world.objects.land),
    countries: topologyObjectToFeatureCollection(
      decodedArcs,
      world.objects.countries
    ),
  }
}
