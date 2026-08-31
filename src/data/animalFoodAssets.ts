import bambooImage from '../assets/animal-foods/bamboo.webp'
import deerImage from '../assets/animal-foods/deer.webp'
import fishImage from '../assets/animal-foods/fish.webp'
import foodImage from '../assets/animal-foods/food.webp'
import fruitImage from '../assets/animal-foods/fruit.webp'
import insectsImage from '../assets/animal-foods/insects.webp'
import krillImage from '../assets/animal-foods/krill.webp'
import meatImage from '../assets/animal-foods/meat.webp'
import nectarImage from '../assets/animal-foods/nectar.webp'
import plantsImage from '../assets/animal-foods/plants.webp'
import seedsImage from '../assets/animal-foods/seeds.webp'
import sealsImage from '../assets/animal-foods/seals.webp'
import shellfishImage from '../assets/animal-foods/shellfish.webp'
import shrimpImage from '../assets/animal-foods/shrimp.webp'
import preyImage from '../assets/animal-foods/small-animals.webp'
import wormsImage from '../assets/animal-foods/worms.webp'

export const ANIMAL_FOOD_NAMES = [
  'Fish',
  'Insects',
  'Seeds',
  'Fruit',
  'Plants',
  'Meat',
  'Nectar',
  'Worms',
  'Shellfish',
  'Bamboo',
  'Deer',
  'Krill',
  'Prey',
  'Seals',
  'Shrimp',
  'Food',
] as const

export type AnimalFoodName = (typeof ANIMAL_FOOD_NAMES)[number]

export const ANIMAL_FOOD_IMAGE_BY_NAME: Record<AnimalFoodName, string> = {
  Fish: fishImage,
  Insects: insectsImage,
  Seeds: seedsImage,
  Fruit: fruitImage,
  Plants: plantsImage,
  Meat: meatImage,
  Nectar: nectarImage,
  Worms: wormsImage,
  Shellfish: shellfishImage,
  Bamboo: bambooImage,
  Deer: deerImage,
  Krill: krillImage,
  Prey: preyImage,
  Seals: sealsImage,
  Shrimp: shrimpImage,
  Food: foodImage,
}
