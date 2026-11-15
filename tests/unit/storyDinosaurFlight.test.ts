import { readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import { story } from '../../src/data/stories/seaFriends'
import {
  dinosaurFlightLayouts,
  dinosaurFlightAsset,
} from '../../src/lib/storyDinosaurFlightAssets'
import { storyTransitionFor } from '../../src/lib/storyTransitions'

it('visits every current cartoon prehistoric creature using the existing artwork', () => {
  const available = readdirSync('src/assets/dinosaurs/cartoon')
    .filter((name) => name.endsWith('.png'))
    .map((name) => name.slice(0, -4))
  const featured = new Set([
    'princess-rainbowasaurus',
    'digosaurus',
    ...dinosaurFlightLayouts.flatMap((scene) =>
      scene.visitors.map((visitor) => visitor.id)
    ),
  ])
  expect(featured).toEqual(new Set(available))
  for (const scene of dinosaurFlightLayouts) {
    for (const visitor of scene.visitors)
      expect(dinosaurFlightAsset(`dinosaur-${visitor.id}`)).toBeTruthy()
  }
})

it('keeps both companions on separate Digosauruses behind Odette in every panel', () => {
  for (const scene of dinosaurFlightLayouts) {
    expect(scene.companions.map((member) => member.id)).toEqual([
      'diana',
      'eclipse',
    ])
    expect(scene.companions.every((member) => member.x > scene.rider.x)).toBe(
      true
    )
    expect(scene.companions[0]!.x).toBeLessThan(scene.companions[1]!.x)
    expect(scene.rider.width).toBeGreaterThan(scene.companions[0]!.width * 1.7)
    for (const name of [
      scene.background,
      `${scene.id}-landscape`,
      'boarding',
      'riding',
      'riding-lookdown',
      'diana-riding',
      'eclipse-riding',
    ])
      expect(dinosaurFlightAsset(name)).toBeTruthy()
    expect(
      story.panels.find((panel) => panel.id === scene.id)?.image
    ).toBeTruthy()
  }
})

it('carries the three mounted friends across every adjacent flight page in either direction', () => {
  for (const [index, scene] of dinosaurFlightLayouts.slice(1).entries()) {
    const previous = story.panels.find(
      (panel) => panel.id === dinosaurFlightLayouts[index]!.id
    )!
    const next = story.panels.find((panel) => panel.id === scene.id)!
    expect(storyTransitionFor(previous, next)?.kind).toBe('dinosaur-flight')
    expect(storyTransitionFor(next, previous)?.kind).toBe('dinosaur-flight')
  }
})
