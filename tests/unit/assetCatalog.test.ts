import { expect, it } from 'vitest'
import {
  createAssetCatalog,
  createAssetResolver,
} from '../../src/data/assetCatalog'

it('normalizes and sorts catalog names while keeping the original image URLs', () => {
  const catalog = createAssetCatalog(
    { '/art/Zebra.webp': 'z', '/art/Ant.png': 'a' },
    (name) => name.toLowerCase()
  )
  expect(catalog.assets).toEqual([
    { name: 'ant', image: 'a' },
    { name: 'zebra', image: 'z' },
  ])
  expect([...catalog.byName]).toEqual([
    ['ant', 'a'],
    ['zebra', 'z'],
  ])
})

it('resolves nested assets and rejects missing or empty URLs with useful context', () => {
  const image = createAssetResolver(
    { '/art/looks/heart.webp': 'heart-url', '/art/empty.webp': '' },
    '/art/',
    'Missing picture',
    '.webp'
  )
  expect(image('looks/heart')).toBe('heart-url')
  for (const key of ['absent', 'empty'])
    expect(() => image(key)).toThrow(`Missing picture: ${key}`)
})
