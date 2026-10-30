import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { expect, it } from 'vitest'
import { story } from '../../src/data/stories/seaFriends'
import {
  getStorySceneFactories,
  getStorySceneFactory,
} from '../../src/lib/storyScenes'
import { storySparkleSites } from '../../src/lib/storySparkles'
import { storyTransitions } from '../../src/lib/storyTransitions'

const lib = resolve('src/lib')
const sources = readdirSync(lib)
  .filter((name) => /^story.*\.ts$/.test(name))
  .map((name) => readFileSync(join(lib, name), 'utf8'))

it('registers every available story animation player so a new one cannot be silently omitted', () => {
  const available = sources
    .flatMap((source) =>
      [...source.matchAll(/export function (create\w+)\(/g)].map(
        (match) => match[1]!
      )
    )
    .filter((name) => name !== 'createStoryLayerScene')
  const registered = Object.values(getStorySceneFactories()).map(
    (create) => create.name
  )
  expect(
    new Set([
      ...registered,
      'createMorningRooms',
      'createPhotoMoment',
      'createStorySparkles',
      'createStoryTransitions',
    ])
  ).toEqual(new Set(available))
})

it('routes every declared scene effect and cinematic transition to existing story pages', () => {
  const effects = new Set(story.panels.map((panel) => panel.effect))
  for (const [effect, create] of Object.entries(getStorySceneFactories())) {
    expect(
      effects.has(
        effect as NonNullable<(typeof story.panels)[number]['effect']>
      )
    ).toBe(true)
    expect(
      getStorySceneFactory(
        effect as NonNullable<(typeof story.panels)[number]['effect']>
      )
    ).toBe(create)
  }
  const ids = new Set(story.panels.map((panel) => panel.id))
  for (const transition of storyTransitions) {
    expect(ids.has(transition.from)).toBe(true)
    expect(ids.has(transition.to)).toBe(true)
  }
  for (const panel of story.panels)
    expect(storySparkleSites[panel.id.split('-')[0]!]).toBeDefined()
})

it('accounts for every animation layer folder, including the castle flight', () => {
  const referenced = new Set(
    sources.flatMap((source) =>
      [...source.matchAll(/assets\/comic\/layers\/([^/'"*]+)/g)].map(
        (match) => match[1]!
      )
    )
  )
  const folders = readdirSync(resolve('src/assets/comic/layers'), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  expect(new Set(folders)).toEqual(referenced)
})
