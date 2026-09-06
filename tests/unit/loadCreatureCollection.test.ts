import { expect, it } from 'vitest'
import {
  getLoadedCollection,
  loadCollection,
} from '../../src/data/creatureCollections/loadCollection'

it('loads optional collections once, shares concurrent requests, and retains successful results', async () => {
  expect(getLoadedCollection('animals')?.catalog.length).toBeGreaterThan(0)
  expect(getLoadedCollection('insects')).toBeUndefined()
  expect(getLoadedCollection('teeniepings')).toBeUndefined()
  const first = loadCollection('insects')
  expect(loadCollection('insects')).toBe(first)
  const insects = await first
  expect(insects.catalog.length).toBeGreaterThan(0)
  expect(insects.catalog.every((item) => item.kind === 'insect')).toBe(true)
  expect(getLoadedCollection('insects')).toBe(insects)
  expect(await loadCollection('insects')).toBe(insects)
  expect(getLoadedCollection('teeniepings')).toBeUndefined()
})
