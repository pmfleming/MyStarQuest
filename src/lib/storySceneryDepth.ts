import { storyImage } from './storyLayerScene'
import reefMiddle from '../assets/comic/layers/dinosaur-depth/reef-midground.webp'
import reefFront from '../assets/comic/layers/dinosaur-depth/reef-foreground.webp'
import cloudMiddle from '../assets/comic/layers/dinosaur-depth/cloud-midground.webp'
import cloudFront from '../assets/comic/layers/dinosaur-depth/cloud-foreground.webp'
import palaceFront from '../assets/comic/layers/dinosaur-depth/palace-foreground.webp'
import './storySceneryDepth.css'

type Habitat = 'underwater' | 'clouds' | 'space' | 'kitchen' | 'palace'

/** Place character nodes between these two independent scenery planes. */
export function createStoryScenery(habitat: Habitat, background?: string) {
  const sources =
    habitat === 'underwater'
      ? [reefMiddle, reefFront]
      : habitat === 'kitchen'
        ? [background!, background!]
        : habitat === 'palace'
          ? [background!, palaceFront]
          : [cloudMiddle, cloudFront]
  const layers = (['midground', 'foreground'] as const).map((depth, index) => {
    const layer = document.createElement('div')
    layer.className = `story-scenery-layer scenery-${habitat} scenery-${depth}`
    layer.dataset.depth = depth
    layer.append(storyImage(sources[index]!, 'story-scenery-art'))
    return layer
  })
  return { midground: layers[0]!, foreground: layers[1]! }
}
