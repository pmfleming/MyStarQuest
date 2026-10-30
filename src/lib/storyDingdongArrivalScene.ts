import { createStoryLayerScene, storyImage as image } from './storyLayerScene'
import background from '../assets/comic/layers/dingdong-arrival/background.webp'
import dingdong from '../assets/comic/layers/dingdong-arrival/dingdong.webp'
import original from '../assets/comic/opening/44-dingdong-invitation-v2.webp'
import './storyDingdongArrivalScene.css'

export function createDingdongArrivalScene(host: HTMLElement) {
  return createStoryLayerScene(host, {
    className: 'dingdong-arrival-scene',
    panelIds: ['44-dingdong-invitation'],
    entrance: 'flying',
    build(stage) {
      stage.append(image(background, 'dingdong-arrival-background'))
      stage.append(image(original, 'dingdong-arrival-foreground'))
      const arrival = document.createElement('div')
      arrival.className = 'dingdong-arrival-actor'
      arrival.append(image(dingdong, 'dingdong-arrival-sprite'))
      stage.append(arrival)
    },
  })
}
