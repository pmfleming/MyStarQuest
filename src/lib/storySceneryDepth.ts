import { storyImage } from './storyLayerScene'
import reefMiddle from '../assets/comic/layers/dinosaur-depth/reef-midground.webp'
import reefFront from '../assets/comic/layers/dinosaur-depth/reef-foreground.webp'
import cloudMiddle from '../assets/comic/layers/dinosaur-depth/cloud-midground.webp'
import cloudFront from '../assets/comic/layers/dinosaur-depth/cloud-foreground.webp'
import palaceFront from '../assets/comic/layers/dinosaur-depth/palace-foreground.webp'
import './storySceneryDepth.css'

type Habitat = 'underwater' | 'clouds' | 'space' | 'kitchen' | 'palace'

/** Place character nodes between these two independent scenery planes. */
export function createStoryScenery(habitat: Habitat, background = '') {
  const sources: Record<Habitat, [string, string]> = {
    underwater: [reefMiddle, reefFront],
    kitchen: [background, background],
    palace: [background, palaceFront],
    clouds: [cloudMiddle, cloudFront],
    space: [cloudMiddle, cloudFront],
  }
  const layerFor = (depth: string, source: string) => {
    const layer = document.createElement('div')
    layer.className = `story-scenery-layer scenery-${habitat} scenery-${depth}`
    layer.dataset.depth = depth
    layer.append(storyImage(source, 'story-scenery-art'))
    return layer
  }
  const [middle, front] = sources[habitat]
  return {
    midground: layerFor('midground', middle),
    foreground: layerFor('foreground', front),
  }
}
