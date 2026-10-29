import { afterEach, expect, it, vi } from 'vitest'
import { shuffle } from '../../../src/lib/shuffle'

afterEach(() => vi.restoreAllMocks())

it('produces each three-item permutation once across the six equally likely draw paths', () => {
  const random = vi.spyOn(Math, 'random')
  const source = Object.freeze(['a', 'b', 'c'])
  const permutations: string[] = []
  for (const first of [0, 1 / 3, 2 / 3]) {
    for (const second of [0, 0.5]) {
      random.mockReturnValueOnce(first).mockReturnValueOnce(second)
      permutations.push(shuffle(source).join(''))
    }
  }
  expect(permutations.sort()).toEqual([
    'abc',
    'acb',
    'bac',
    'bca',
    'cab',
    'cba',
  ])
  expect(source).toEqual(['a', 'b', 'c'])
})

it('preserves duplicate, null and undefined values without changing the input', () => {
  const value = {}
  const source = Object.freeze([value, undefined, value, null])
  const result = shuffle(source)
  expect(result).not.toBe(source)
  expect(result).toHaveLength(4)
  expect(result.filter((item) => item === value)).toHaveLength(2)
  expect(result).toContain(null)
  expect(result).toContain(undefined)
  expect(shuffle([])).toEqual([])
  expect(shuffle([value])).toEqual([value])
})
