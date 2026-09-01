import { drawFeatureCollection } from './worldMapCanvas'
import { parseWorldFeatureCollections } from './worldTopology'

export const EARTH_TEXTURE_WIDTH = 2048
export const EARTH_TEXTURE_HEIGHT = 1024
export const EARTH_OCEAN_COLOR = '#1e3799'

type EarthTextureContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D

export type EarthTextureWorkerResponse =
  | { type: 'ready'; pixels: ArrayBuffer }
  | { type: 'error'; message: string }

export const renderEarthTexture = (
  context: EarthTextureContext,
  width: number,
  height: number,
  worldData: unknown
) => {
  context.fillStyle = EARTH_OCEAN_COLOR
  context.fillRect(0, 0, width, height)

  const { land, countries } = parseWorldFeatureCollections(worldData)
  const project = (longitude: number, latitude: number): [number, number] => [
    ((longitude + 180) / 360) * width,
    ((90 - latitude) / 180) * height,
  ]

  context.beginPath()
  drawFeatureCollection(context, land, project)
  context.fillStyle = '#2ed573'
  context.fill()

  context.beginPath()
  drawFeatureCollection(context, countries, project)
  context.strokeStyle = 'rgba(0, 80, 0, 0.4)'
  context.lineWidth = 1
  context.stroke()
}
