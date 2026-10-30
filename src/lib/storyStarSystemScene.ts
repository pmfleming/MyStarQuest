import { createStoryLayerScene, storyImage as image } from './storyLayerScene'
import background from '../assets/comic/layers/star-system/background.webp'
import './storyStarSystemScene.css'

const assets = import.meta.glob<string>(
  '../assets/comic/layers/star-system/*.webp',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
)
const satellites = [
  ['rainbow-planet', 9.6, 50.5, 16.5],
  ['flower-globe', 15.7, 31, 9],
  ['yellow-planet', 38, 21, 6.8],
  ['green-planet', 60.3, 22, 5.9],
  ['purple-planet', 81.5, 30.7, 8],
  ['umbrella', 93, 44.7, 10],
  ['lightning', 86.2, 67.5, 19.5],
  ['gift', 54, 80.5, 23],
  ['bubble', 22.4, 71, 15],
  ['moon', 37.6, 65, 10],
  ['bunny', 23.6, 45, 7.2],
  ['spotted-planet', 30.1, 34, 4.7],
  ['purple-moons', 45.8, 27.5, 4.6],
  ['droplet', 66.7, 33.1, 4.5],
  ['gem', 70.1, 43.5, 3.5],
  ['checkerboard', 79.7, 46, 7.7],
  ['cards', 67.5, 60, 10.5],
] as const

export function createStarSystemScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'star-system-scene',
    panelIds: ['49-pop-star-system'],
    build(stage) {
      stage.append(image(background, 'star-system-background'))
      satellites.forEach(([name, x, y, width], i) => {
        const anchor = document.createElement('div')
        anchor.className = 'star-system-satellite'
        anchor.dataset.satellite = name
        anchor.style.left = `${x}%`
        anchor.style.top = `${y}%`
        anchor.style.width = `${width}%`
        anchor.style.setProperty('--duration', `${150 + i * 9}s`)
        anchor.style.setProperty(
          '--direction',
          i % 3 === 0 ? 'reverse' : 'normal'
        )
        anchor.append(
          image(
            assets[`../assets/comic/layers/star-system/${name}.webp`]!,
            'star-system-spinner'
          )
        )
        stage.append(anchor)
      })
      const rainbow = document.createElement('div')
      rainbow.className = 'star-system-rainbow'
      for (let i = 0; i < 9; i++) {
        const glint = document.createElement('i')
        glint.style.left = `${8 + i * 10}%`
        glint.style.setProperty('--delay', `${-i * 0.65}s`)
        rainbow.append(glint)
      }
      stage.append(rainbow)
    },
  })
}
