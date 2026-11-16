import { storyImage } from './storyLayerScene'
import './storyDinosaurDepth.css'

const assets = import.meta.glob<string>(
  '../assets/comic/layers/dinosaur-depth/*.webp',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
)

export function dinosaurDepthAsset(name: string) {
  return assets[`../assets/comic/layers/dinosaur-depth/${name}.webp`]!
}

/** Real alpha scenery plates surround the actor planes, including during page turns. */
export function createDinosaurDepth(habitat: string) {
  const material =
    habitat === 'clouds'
      ? 'cloud'
      : habitat === 'lagoon'
        ? 'reef'
        : habitat === 'canyon' || habitat === 'dig'
          ? 'rock'
          : 'fern'
  const make = (depth: 'midground' | 'foreground' | 'air') => {
    const layer = document.createElement('div')
    layer.className = `dinosaur-depth-layer dinosaur-depth-${depth}`
    layer.dataset.depth = depth
    layer.dataset.material = material
    layer.append(
      storyImage(
        dinosaurDepthAsset(
          depth === 'air' ? 'cloud-midground' : `${material}-${depth}`
        ),
        'dinosaur-depth-art'
      )
    )
    return layer
  }
  return {
    midground: make('midground'),
    foreground: make('foreground'),
    air: make('air'),
  }
}
