import fishImage from '../assets/animal-foods/fish.webp'
import foodImage from '../assets/animal-foods/food.webp'
import fruitImage from '../assets/animal-foods/fruit.webp'
import insectsImage from '../assets/animal-foods/insects.webp'
import meatImage from '../assets/animal-foods/meat.webp'
import nectarImage from '../assets/animal-foods/nectar.webp'
import plantsImage from '../assets/animal-foods/plants.webp'
import seedsImage from '../assets/animal-foods/seeds.webp'
import shellfishImage from '../assets/animal-foods/shellfish.webp'
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
  Food: foodImage,
}

const includesAny = (text: string, values: string[]) =>
  values.some((value) => text.includes(value))

export const getAnimalFoodName = (text: string): AnimalFoodName => {
  const value = text.toLowerCase()
  const foods: Array<[string[], AnimalFoodName]> = [
    [['fish'], 'Fish'],
    [['insect', 'moth', 'mosquito', 'beetle', 'ant'], 'Insects'],
    [['seed', 'grain', 'nut'], 'Seeds'],
    [['fruit', 'berry', 'berries'], 'Fruit'],
    [['grass', 'leaf', 'leaves', 'plant', 'root'], 'Plants'],
    [['meat', 'animal', 'prey'], 'Meat'],
    [['nectar', 'pollen'], 'Nectar'],
    [['worm'], 'Worms'],
    [['crab', 'shellfish'], 'Shellfish'],
  ]

  return foods.find(([needles]) => includesAny(value, needles))?.[1] ?? 'Food'
}

export const getAnimalFoodImage = (text: string) =>
  ANIMAL_FOOD_IMAGE_BY_NAME[getAnimalFoodName(text)]
