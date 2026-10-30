import { createStoryLayerScene, storyImage as image } from './storyLayerScene'
import background from '../assets/comic/layers/ice-cream/background.webp'
import coral from '../assets/comic/layers/ice-cream/coral.webp'
import crystal from '../assets/comic/layers/ice-cream/crystal.webp'
import './storyIceCreamScene.css'

/** Independent, subtle helper motion over a stationary kitchen plate. */
export function createIceCreamScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'ice-cream-scene',
    panelIds: ['14-ice-creams'],
    build(stage) {
      stage.append(image(background, 'ice-cream-background'))
      stage.append(image(coral, 'ice-cream-helper ice-cream-coral'))
      stage.append(image(crystal, 'ice-cream-helper ice-cream-crystal'))
      const sprinkles = document.createElement('div')
      sprinkles.className = 'ice-cream-sprinkles'
      for (let i = 0; i < 12; i++) {
        const sprinkle = document.createElement('i')
        sprinkle.style.setProperty('--x', `${18 + ((i * 17) % 60)}%`)
        sprinkle.style.setProperty('--drift', `${((i % 5) - 2) * 3}px`)
        sprinkle.style.setProperty('--delay', `${-i * 0.19}s`)
        sprinkle.style.setProperty(
          '--colour',
          ['#f460bb', '#ffda42', '#40cdeb', '#b75bec'][i % 4] ?? '#f460bb'
        )
        sprinkles.append(sprinkle)
      }
      stage.append(sprinkles)
    },
  })
}
