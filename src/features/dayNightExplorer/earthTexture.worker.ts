/// <reference lib="webworker" />
import {
  EARTH_TEXTURE_HEIGHT,
  EARTH_TEXTURE_WIDTH,
  renderEarthTexture,
  type EarthTextureWorkerResponse,
} from './earthTextureRenderer'

// This module is built as a dedicated worker, not a Window entry point.
declare const self: DedicatedWorkerGlobalScope
const respond = (
  message: EarthTextureWorkerResponse,
  transfer: Transferable[] = []
) => self.postMessage(message, transfer)

const buildEarthTexture = async () => {
  try {
    const response = await fetch('/data/world-50m-2024.json')
    if (!response.ok) {
      throw new Error(`Map data request failed with ${response.status}`)
    }

    const canvas = new OffscreenCanvas(
      EARTH_TEXTURE_WIDTH,
      EARTH_TEXTURE_HEIGHT
    )
    const context = canvas.getContext('2d')
    if (!context) throw new Error('2D canvas is unavailable')

    renderEarthTexture(
      context,
      EARTH_TEXTURE_WIDTH,
      EARTH_TEXTURE_HEIGHT,
      await response.json()
    )

    const pixels = context.getImageData(
      0,
      0,
      EARTH_TEXTURE_WIDTH,
      EARTH_TEXTURE_HEIGHT
    ).data.buffer
    respond({ type: 'ready', pixels }, [pixels])
  } catch (error) {
    respond({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

void buildEarthTexture()
