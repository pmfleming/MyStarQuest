import { useEffect, useRef, useState } from 'react'
import animals from '../../data/creatureCollections/animals'
import {
  getLoadedCollection,
  loadCollection,
} from '../../data/creatureCollections/loadCollection'
import type {
  CatalogAnimal,
  CreatureCollection,
  CreatureCollectionData,
} from '../../data/creatureCollections/types'

const EMPTY_COLLECTION: CreatureCollectionData = {
  catalog: [],
  getTeachingFacts: () => [],
}

export function useCreatureCollection(
  onCatalogChange: (catalog: CatalogAnimal[]) => void
) {
  const [collection, setCollection] = useState<CreatureCollection>('animals')
  const [loaded, setLoaded] = useState({ id: collection, data: animals })
  const [collectionError, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  useEffect(
    () => () => {
      requestId.current += 1
    },
    []
  )

  const changeCollection = (next: CreatureCollection) => {
    if (next === collection && !collectionError) return
    const request = ++requestId.current
    setCollection(next)
    setError(null)
    onCatalogChange([])
    const accept = (data: CreatureCollectionData) => {
      if (request !== requestId.current) return
      setLoaded({ id: next, data })
      onCatalogChange(data.catalog)
    }
    const cached = getLoadedCollection(next)
    if (cached) {
      accept(cached)
      return
    }
    void loadCollection(next)
      .then(accept)
      .catch(() => {
        if (request === requestId.current)
          setError('Pictures could not be loaded. Please try again.')
      })
  }

  return {
    collection,
    collectionError,
    isCollectionLoading: loaded.id !== collection && !collectionError,
    data: loaded.id === collection ? loaded.data : EMPTY_COLLECTION,
    changeCollection,
  }
}
