import { describe, expect, it } from 'vitest'
import { parseWorldFeatureCollections } from '../../../src/features/dayNightExplorer/worldTopology'

const topology = () => ({
  transform: { scale: [2, 3], translate: [10, 20] },
  arcs: [
    [
      [0, 0],
      [1, 0],
    ],
    [
      [1, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [1, 1],
    ],
  ],
  objects: {
    land: {
      type: 'GeometryCollection',
      geometries: [{ type: 'Polygon', arcs: [[0, 1, -3]] }],
    },
    countries: {
      type: 'GeometryCollection',
      geometries: [{ type: 'MultiPolygon', arcs: [[[0, 1, -3]], [[-1]]] }],
    },
  },
})

describe('world topology decoding', () => {
  it('decodes delta coordinates, joins shared endpoints and reverses negative arcs without mutating input', () => {
    const source = topology()
    const before = structuredClone(source)
    const result = parseWorldFeatureCollections(source)
    const ring = [
      [10, 20],
      [12, 20],
      [12, 23],
      [10, 20],
    ]
    expect(result.land.features).toEqual([
      { geometry: { type: 'Polygon', coordinates: [ring] } },
    ])
    expect(result.countries.features).toEqual([
      {
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [ring],
            [
              [
                [12, 20],
                [10, 20],
              ],
            ],
          ],
        },
      },
    ])
    expect(source).toEqual(before)
  })

  it.each([{ ...topology(), arcs: [[[Infinity, 0]]] }])(
    'rejects malformed external topology: %j',
    (source) => {
      expect(() => parseWorldFeatureCollections(source)).toThrow(
        'Invalid TopoJSON world data'
      )
    }
  )
})
