import type { Panel } from '../data/stories/seaFriends'
import './storyPageMotion.css'
import { createUnderwaterScene } from './storyUnderwater'
import { createAirScenes } from './storyAirScenes'
import { createCleaningScene } from './storyCleaningScene'
import { createTidyingScene } from './storyTidyingScene'
import { createIceCreamScene } from './storyIceCreamScene'
import { createSpaceFlightScene } from './storySpaceFlightScene'
import { createStarSystemScene } from './storyStarSystemScene'
import { createDingdongArrivalScene } from './storyDingdongArrivalScene'

type SceneEffect = Exclude<
  NonNullable<Panel['effect']>,
  'photo-moment' | 'morning-rooms'
>
export type StorySceneFactory = typeof createUnderwaterScene

/** The story reader resolves every layered page effect through this registry. */
export function getStorySceneFactories(): Record<
  SceneEffect,
  StorySceneFactory
> {
  return {
    'underwater-meeting': createUnderwaterScene,
    'air-scene': createAirScenes,
    'cleaning-scene': createCleaningScene,
    'tidying-scene': createTidyingScene,
    'ice-cream-scene': createIceCreamScene,
    'space-flight-scene': createSpaceFlightScene,
    'star-system-scene': createStarSystemScene,
    'dingdong-arrival-scene': createDingdongArrivalScene,
  }
}

export function getStorySceneFactory(effect: Panel['effect']) {
  if (!effect || effect === 'photo-moment' || effect === 'morning-rooms') return
  return getStorySceneFactories()[effect]
}
