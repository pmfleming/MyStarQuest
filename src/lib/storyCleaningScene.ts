import {
  createStoryLayerScene,
  syncStoryAnimationVisibility,
  storyImage as img,
} from './storyLayerScene'
import background from '../assets/comic/layers/cleaning/background.webp'
import yellow from '../assets/comic/layers/cleaning/yellow-duster.webp'
import mint from '../assets/comic/layers/cleaning/mint-mop.webp'
import './storyCleaningScene.css'
import { createStoryScenery } from './storySceneryDepth'

export function createCleaningScene(host: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const motions: Animation[] = []
  const cancelMotion = () =>
    motions.splice(0).forEach((animation) => animation.cancel())
  const scene = createStoryLayerScene(host, {
    className: 'cleaning-scene',
    panelIds: ['15-speed-cleaning'],
    build(stage) {
      stage.append(img(background, 'cleaning-background'))
      const scenery = createStoryScenery('palace', background)
      stage.append(scenery.midground)
      actor(yellow, 'yellow')
      actor(mint, 'mint')
      stage.append(scenery.foreground)
    },
    onReady: animate,
    onStop: cancelMotion,
    onVisibilityChange: () => syncStoryAnimationVisibility(motions),
  })
  const { stage } = scene
  function actor(src: string, name: string) {
    const node = document.createElement('div')
    node.className = `cleaner cleaner-${name}`
    node.dataset.cleaner = name
    node.append(img(src, 'cleaner-sprite'))
    for (let i = 0; i < 5; i++) {
      const glint = document.createElement('span')
      glint.className = 'cleaner-glint'
      glint.style.setProperty('--i', String(i))
      node.append(glint)
    }
    if (name === 'mint') {
      const reflection = document.createElement('div')
      reflection.className = 'cleaner-reflection'
      reflection.append(img(src, 'cleaner-reflection-image'))
      node.append(reflection)
    }
    stage.append(node)
    return node
  }
  function animate() {
    cancelMotion()
    if (reduced.matches || !stage.classList.contains('ready')) return
    const duster = stage.querySelector<HTMLElement>('.cleaner-yellow')!
    const mop = stage.querySelector<HTMLElement>('.cleaner-mint')!
    motions.push(
      duster.animate(
        [
          { left: '7%', top: '8%', transform: 'rotate(-4deg) scale(1)' },
          {
            left: '13%',
            top: '20%',
            transform: 'rotate(8deg) scale(.96)',
            offset: 0.2,
          },
          {
            left: '34%',
            top: '5%',
            transform: 'rotate(-7deg) scale(.82)',
            offset: 0.48,
          },
          {
            left: '20%',
            top: '2%',
            transform: 'rotate(-10deg) scale(.9)',
            offset: 0.74,
          },
          { left: '7%', top: '8%', transform: 'rotate(-4deg) scale(1)' },
        ],
        { duration: 8500, iterations: Infinity, easing: 'ease-in-out' }
      )
    )
    motions.push(
      mop.animate(
        [
          { left: '58%', bottom: '9%', transform: 'rotate(0deg) scale(1)' },
          {
            left: '37%',
            bottom: '15%',
            transform: 'rotate(-4deg) scale(.85)',
            offset: 0.25,
          },
          {
            left: '13%',
            bottom: '7%',
            transform: 'rotate(2deg) scale(1)',
            offset: 0.5,
          },
          {
            left: '37%',
            bottom: '3%',
            transform: 'rotate(5deg) scale(1.05)',
            offset: 0.75,
          },
          { left: '58%', bottom: '9%', transform: 'rotate(0deg) scale(1)' },
        ],
        { duration: 10500, iterations: Infinity, easing: 'ease-in-out' }
      )
    )
    syncStoryAnimationVisibility(motions)
  }
  reduced.addEventListener('change', animate)
  return {
    ...scene,
    dispose() {
      scene.dispose()
      reduced.removeEventListener('change', animate)
    },
  }
}
