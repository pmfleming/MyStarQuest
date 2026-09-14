import { createAssetCatalog, type NamedAsset } from './assetCatalog'

export type AnimalAsset = NamedAsset

const ANIMAL_ASSET_MODULES = import.meta.glob<string>(
  '../assets/animals/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
)

const animalCatalog = createAssetCatalog(ANIMAL_ASSET_MODULES)
export const ANIMAL_ASSETS: AnimalAsset[] = animalCatalog.assets
export const ANIMAL_ASSET_BY_NAME = animalCatalog.byName
