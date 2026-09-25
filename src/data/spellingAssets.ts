import { ANIMAL_ASSETS } from './animalAssets'
import { createAssetCatalog, type NamedAsset } from './assetCatalog'

const teenieModules = import.meta.glob<string>(
  '../assets/teenie/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)
const pokemonModules = import.meta.glob<string>(
  '../assets/pokemon/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

export type SpellingWordSetId = 'teenie' | 'animals' | 'pokemon'

export const SPELLING_WORD_SETS: Record<SpellingWordSetId, NamedAsset[]> = {
  teenie: createAssetCatalog(teenieModules).assets,
  animals: ANIMAL_ASSETS,
  pokemon: createAssetCatalog(pokemonModules, (name) =>
    name.replace(/^grrowlithe$/i, 'growlithe')
  ).assets,
}

const spellingImages = new Map(
  Object.values(SPELLING_WORD_SETS)
    .flat()
    .map(({ name, image }) => [name.toLowerCase(), image])
)

export const getSpellingImage = (name: string) =>
  spellingImages.get(name.trim().toLowerCase())
