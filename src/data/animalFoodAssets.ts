import bambooImage from '../assets/animal-foods/bamboo.webp'
import antelopesImage from '../assets/animal-foods/antelopes-card-art.webp'
import birdsImage from '../assets/animal-foods/birds-card-art.webp'
import deerImage from '../assets/animal-foods/deer.webp'
import fishImage from '../assets/animal-foods/fish.webp'
import foodImage from '../assets/animal-foods/food.webp'
import fruitImage from '../assets/animal-foods/fruit-card-art.webp'
import grassImage from '../assets/animal-foods/grass-card-art.webp'
import insectsImage from '../assets/animal-foods/insects.webp'
import krillImage from '../assets/animal-foods/krill.webp'
import flowersAndNectarImage from '../assets/animal-foods/flowers-and-nectar-card-art.webp'
import leavesImage from '../assets/animal-foods/leaves-card-art.webp'
import reptilesImage from '../assets/animal-foods/reptiles-card-art.webp'
import rodentsImage from '../assets/animal-foods/rodents-card-art.webp'
import rootsImage from '../assets/animal-foods/roots-card-art.webp'
import seedsAndNutsImage from '../assets/animal-foods/seeds-and-nuts-card-art.webp'
import sealsImage from '../assets/animal-foods/seals.webp'
import shellfishImage from '../assets/animal-foods/shellfish.webp'
import shrimpImage from '../assets/animal-foods/shrimp.webp'
import wormsImage from '../assets/animal-foods/worms.webp'

export const ANIMAL_FOOD_NAMES = [
  'Fish',
  'Insects',
  'Seeds & Nuts',
  'Fruit',
  'Grass',
  'Leaves',
  'Roots',
  'Rodents',
  'Birds',
  'Antelopes',
  'Reptiles',
  'Flowers & Nectar',
  'Worms',
  'Shellfish',
  'Bamboo',
  'Deer',
  'Krill',
  'Seals',
  'Shrimp',
  'Food',
] as const

export type AnimalFoodName = (typeof ANIMAL_FOOD_NAMES)[number]

export const ANIMAL_FOOD_IMAGE_BY_NAME: Record<AnimalFoodName, string> = {
  Fish: fishImage,
  Insects: insectsImage,
  'Seeds & Nuts': seedsAndNutsImage,
  Fruit: fruitImage,
  Grass: grassImage,
  Leaves: leavesImage,
  Roots: rootsImage,
  Rodents: rodentsImage,
  Birds: birdsImage,
  Antelopes: antelopesImage,
  Reptiles: reptilesImage,
  'Flowers & Nectar': flowersAndNectarImage,
  Worms: wormsImage,
  Shellfish: shellfishImage,
  Bamboo: bambooImage,
  Deer: deerImage,
  Krill: krillImage,
  Seals: sealsImage,
  Shrimp: shrimpImage,
  Food: foodImage,
}
