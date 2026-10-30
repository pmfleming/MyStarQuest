import { createStoryLayerScene, storyImage as image } from './storyLayerScene'
import background from '../assets/comic/layers/tidying/background.webp'
import coral from '../assets/comic/layers/tidying/coral.webp'
import crystal from '../assets/comic/layers/tidying/crystal.webp'
import yellow from '../assets/comic/layers/tidying/yellow.webp'
import mint from '../assets/comic/layers/tidying/mint.webp'
import cyan from '../assets/comic/layers/tidying/cyan.webp'
import heart from '../assets/comic/layers/tidying/heart.webp'
import original from '../assets/comic/opening/17-tidying.webp'
import './storyTidyingScene.css'

/** Only the distant helpers and window atmosphere move; foreground artwork stays fixed. */
export function createTidyingScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'tidying-scene',
    panelIds: ['17-tidying'],
    build(stage) {
      stage.append(image(background, 'tidying-background'))
      const light = document.createElement('div')
      light.className = 'tidying-window-light'
      stage.append(light)
      for (const [src, name] of [
        [coral, 'coral'],
        [crystal, 'crystal'],
        [yellow, 'yellow'],
        [mint, 'mint'],
        [cyan, 'cyan'],
        [heart, 'heart'],
      ] as const) {
        const group = image(src, `tidying-helpers tidying-${name}`)
        group.dataset.group = name
        stage.append(group)
      }
      for (let i = 0; i < 9; i++) {
        const bubble = document.createElement('span')
        bubble.className = 'tidying-bubble'
        bubble.style.setProperty(
          '--x',
          `${[9, 18, 40, 47, 55, 64, 78, 85, 93][i]}%`
        )
        bubble.style.setProperty('--size', `${0.55 + (i % 3) * 0.25}%`)
        bubble.style.setProperty('--duration', `${9 + (i % 4)}s`)
        bubble.style.setProperty('--delay', `${-i * 1.4}s`)
        stage.append(bubble)
      }
      // Reuse the exact original front of the scene, also covering the counter edge.
      stage.append(image(original, 'tidying-foreground'))
      stage.append(image(original, 'tidying-counter'))
    },
  })
}
