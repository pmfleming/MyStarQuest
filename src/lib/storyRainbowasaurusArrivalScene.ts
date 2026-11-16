import { createStoryLayerScene, storyImage as image } from './storyLayerScene'
import background from '../assets/comic/layers/rainbowasaurus-arrival/background.webp'
import rainbowasaurus from '../assets/dinosaurs/cartoon/princess-rainbowasaurus.png'
import './storyRainbowasaurusArrivalScene.css'
import { createDinosaurDepth } from './storyDinosaurDepth'

export function createRainbowasaurusArrivalScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'rainbowasaurus-arrival-scene',
    panelIds: ['62-rainbowasaurus-arrival'],
    entrance: 'flying',
    build(stage) {
      stage.append(image(background, 'rainbowasaurus-arrival-background'))
      const depth = createDinosaurDepth('dig')
      stage.append(depth.midground)
      const shadow = document.createElement('div')
      shadow.className = 'rainbowasaurus-arrival-shadow'
      stage.append(shadow)
      const arrival = document.createElement('div')
      arrival.className = 'rainbowasaurus-arrival-actor'
      // Reuse her original flying artwork, including her broad back and huge wings.
      arrival.append(image(rainbowasaurus, 'rainbowasaurus-arrival-sprite'))
      stage.append(arrival)
      stage.append(depth.air, depth.foreground)
    },
  })
}
