import animals from './animals'
import type { CreatureCollection, CreatureCollectionData } from './types'

const loaded: Partial<Record<CreatureCollection, CreatureCollectionData>> = {
  animals,
}
const pending: Partial<
  Record<CreatureCollection, Promise<CreatureCollectionData>>
> = {}

export const getLoadedCollection = (id: CreatureCollection) => loaded[id]

export const loadCollection = (
  id: CreatureCollection
): Promise<CreatureCollectionData> => {
  const cached = loaded[id]
  if (cached) return Promise.resolve(cached)
  const inFlight = pending[id]
  if (inFlight) return inFlight

  const request =
    id === 'insects' ? import('./insects') : import('./teeniepings')
  const result = request
    .then(({ default: data }) => {
      loaded[id] = data
      delete pending[id]
      return data
    })
    .catch((error: unknown) => {
      delete pending[id]
      throw error
    })
  pending[id] = result
  return result
}
