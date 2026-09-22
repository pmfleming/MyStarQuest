import * as z from 'zod/mini'

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

// Keep the runtime validator and decoded types derived from one contract.
const coordinateSchema = z.tuple([z.number(), z.number()])
const polygonArcsSchema = z.array(z.array(z.int()))
const geometryCollectionSchema = z.object({
  type: z.literal('GeometryCollection'),
  geometries: z.array(
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('Polygon'), arcs: polygonArcsSchema }),
      z.object({
        type: z.literal('MultiPolygon'),
        arcs: z.array(polygonArcsSchema),
      }),
    ])
  ),
})
const worldSchema = z.object({
  transform: z.object({ scale: coordinateSchema, translate: coordinateSchema }),
  arcs: z.array(z.array(coordinateSchema)),
  objects: z.object({
    land: geometryCollectionSchema,
    countries: geometryCollectionSchema,
  }),
})
type TopoJsonWorldData = z.infer<typeof worldSchema>
type TopoJsonGeometryCollection = z.infer<typeof geometryCollectionSchema>

const parseTopoJsonWorldData = (value: unknown): TopoJsonWorldData => {
  const parsed = worldSchema.safeParse(value)
  if (!parsed.success) throw new Error('Invalid TopoJSON world data')
  return parsed.data
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
