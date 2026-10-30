import { createStoryLayerScene, storyImage as image } from './storyLayerScene'
import background from '../assets/comic/layers/space-flight/background.webp'
import friends from '../assets/comic/layers/space-flight/friends.webp'
import castleBackground from '../assets/comic/layers/castle-flight/background.webp'
import castleFriends from '../assets/comic/layers/castle-flight/friends.webp'
import './storySpaceFlightScene.css'

export function createSpaceFlightScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'space-flight-scene',
    panelIds: ['47-flight-to-star-planet', '50-flight-to-princess-castle'],
    entrance: 'flying',
    build(stage, id) {
      const castle = id === '50-flight-to-princess-castle'
      stage.classList.toggle('castle-flight', castle)
      stage.append(
        image(castle ? castleBackground : background, 'space-flight-background')
      )
      const arrival = document.createElement('div')
      arrival.className = 'space-flight-arrival'
      const formation = document.createElement('div')
      formation.className = 'space-flight-formation'
      for (const name of castle
        ? ['aurora', 'eclipse', 'odette']
        : ['aurora', 'eclipse', 'odette', 'dingdong']) {
        const trail = document.createElement('span')
        trail.className = `space-flight-trail space-flight-${name}`
        formation.append(trail)
      }
      formation.append(
        image(castle ? castleFriends : friends, 'space-flight-friends')
      )
      arrival.append(formation)
      stage.append(arrival)
    },
  })
}
