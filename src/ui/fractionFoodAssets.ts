import type { ThemeId } from './themeOptions'
import teeniePizza from '../assets/themes/teenie/fractions/pizza.webp'
import teenieCake from '../assets/themes/teenie/fractions/cake.webp'
import teenieTart from '../assets/themes/teenie/fractions/tart.webp'
import princessPizza from '../assets/themes/princess/fractions/pizza.webp'
import princessCake from '../assets/themes/princess/fractions/cake.webp'
import princessTart from '../assets/themes/princess/fractions/tart.webp'

export type FractionFoodAsset = {
  image: string
  label: string
  description: string
  // Food bounds as percentages of the square illustration, excluding the plate.
  food: { x: number; y: number; width: number; height: number }
}

const foods: Record<
  ThemeId,
  [FractionFoodAsset, FractionFoodAsset, FractionFoodAsset]
> = {
  teenie: [
    {
      image: teeniePizza,
      label: 'Pizza',
      description: 'Yumyumping holding a pizza',
      food: { x: 25.5, y: 47.7, width: 45.7, height: 44.8 },
    },
    {
      image: teenieCake,
      label: 'Strawberry cake',
      description: 'Sweetping holding a strawberry cake',
      food: { x: 25.4, y: 47.7, width: 45.5, height: 43.6 },
    },
    {
      image: teenieTart,
      label: 'Citrus tart',
      description: 'Tangyping holding a citrus tart',
      food: { x: 27, y: 49, width: 44.5, height: 43 },
    },
  ],
  princess: [
    {
      image: princessPizza,
      label: 'Pizza',
      description: 'Princess holding a pizza',
      food: { x: 27, y: 50.8, width: 43.6, height: 40.4 },
    },
    {
      image: princessCake,
      label: 'Strawberry cake',
      description: 'Princess holding a strawberry cake',
      food: { x: 28.9, y: 52, width: 40.5, height: 38 },
    },
    {
      image: princessTart,
      label: 'Citrus tart',
      description: 'Princess holding a citrus tart',
      food: { x: 28, y: 49.3, width: 42.3, height: 41.9 },
    },
  ],
}

// Keep the same food for each guided copy/build pair.
export const getFractionFood = (
  theme: ThemeId,
  index: number,
  recognising: boolean
) =>
  foods[theme][(recognising ? index : Math.floor(index / 2)) % 3] ??
  foods[theme][0]
