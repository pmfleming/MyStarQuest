import type { GeoFeatureCollection, GeoRing } from './worldTopology'

type PathDrawingContext = Pick<CanvasRenderingContext2D, 'lineTo' | 'moveTo'>

const drawRing = (
  context: PathDrawingContext,
  ring: GeoRing,
  project: (longitude: number, latitude: number) => [number, number]
) => {
  ring.forEach(([longitude, latitude], index) => {
    const [x, y] = project(longitude, latitude)
    if (index === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  })
}

export const drawFeatureCollection = (
  context: PathDrawingContext,
  collection: GeoFeatureCollection,
  project: (longitude: number, latitude: number) => [number, number]
) => {
  for (const feature of collection.features) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates

    for (const polygon of polygons) {
      for (const ring of polygon) drawRing(context, ring, project)
    }
  }
}
