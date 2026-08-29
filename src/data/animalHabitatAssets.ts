import burrowImage from '../assets/animal-habitats/burrow.webp'
import caveImage from '../assets/animal-habitats/cave.webp'
import desertImage from '../assets/animal-habitats/desert.webp'
import farmImage from '../assets/animal-habitats/farm.webp'
import forestImage from '../assets/animal-habitats/forest.webp'
import grasslandImage from '../assets/animal-habitats/grassland.webp'
import mountainImage from '../assets/animal-habitats/mountain.webp'
import natureImage from '../assets/animal-habitats/nature.webp'
import oceanImage from '../assets/animal-habitats/ocean.webp'
import pondImage from '../assets/animal-habitats/pond.webp'
import riverImage from '../assets/animal-habitats/river.webp'
import townImage from '../assets/animal-habitats/town.webp'
import treesImage from '../assets/animal-habitats/trees.webp'
import tundraImage from '../assets/animal-habitats/tundra.webp'
import wetlandImage from '../assets/animal-habitats/wetland.webp'

export const ANIMAL_HABITAT_NAMES = [
  'Ocean',
  'Forest',
  'Grassland',
  'Desert',
  'Wetland',
  'Mountain',
  'River',
  'Pond',
  'Tundra',
  'Farm',
  'Town',
  'Trees',
  'Cave',
  'Burrow',
  'Nature',
] as const

export type AnimalHabitatName = (typeof ANIMAL_HABITAT_NAMES)[number]

export const ANIMAL_HABITAT_IMAGE_BY_NAME: Record<AnimalHabitatName, string> = {
  Ocean: oceanImage,
  Forest: forestImage,
  Grassland: grasslandImage,
  Desert: desertImage,
  Wetland: wetlandImage,
  Mountain: mountainImage,
  River: riverImage,
  Pond: pondImage,
  Tundra: tundraImage,
  Farm: farmImage,
  Town: townImage,
  Trees: treesImage,
  Cave: caveImage,
  Burrow: burrowImage,
  Nature: natureImage,
}

const includesAny = (text: string, values: string[]) =>
  values.some((value) => text.includes(value))

export const getAnimalHabitatName = (text: string): AnimalHabitatName => {
  const value = text.toLowerCase()
  const habitats: Array<[string[], AnimalHabitatName]> = [
    [['ocean', 'sea', 'reef'], 'Ocean'],
    [['forest', 'woodland', 'jungle'], 'Forest'],
    [['grassland', 'savanna', 'meadow'], 'Grassland'],
    [['desert', 'sand'], 'Desert'],
    [['wetland', 'swamp', 'marsh', 'mangrove'], 'Wetland'],
    [['mountain', 'cliff'], 'Mountain'],
    [['river', 'stream'], 'River'],
    [['pond', 'lake'], 'Pond'],
    [['tundra', 'ice'], 'Tundra'],
    [['farm', 'field'], 'Farm'],
    [['garden', 'town', 'building', 'roof'], 'Town'],
    [['tree', 'canopy', 'hollow'], 'Trees'],
    [['cave', 'rock'], 'Cave'],
    [['burrow', 'tunnel', 'soil', 'underground'], 'Burrow'],
  ]

  return (
    habitats.find(([needles]) => includesAny(value, needles))?.[1] ?? 'Nature'
  )
}

export const getAnimalHabitatImage = (text: string) =>
  ANIMAL_HABITAT_IMAGE_BY_NAME[getAnimalHabitatName(text)]
