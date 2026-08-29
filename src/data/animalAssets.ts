export type AnimalAsset = {
  name: string
  image: string
}

const ANIMAL_ASSET_MODULES = import.meta.glob(
  '../assets/animals/*.{png,jpg,jpeg,webp,svg}',
  { eager: true, import: 'default' }
) as Record<string, string>

const getAssetName = (path: string) =>
  path
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '') ?? path

export const ANIMAL_ASSETS: AnimalAsset[] = Object.entries(ANIMAL_ASSET_MODULES)
  .map(([path, image]) => ({
    name: getAssetName(path),
    image,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const ANIMAL_ASSET_BY_NAME = new Map(
  ANIMAL_ASSETS.map((animal) => [animal.name, animal.image])
)
