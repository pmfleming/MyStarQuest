import { expect, it } from 'vitest'
import { createAssetResolver } from '../../src/data/assetCatalog'

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
