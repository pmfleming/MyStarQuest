import { getThemeAsset } from './themeAssets'
import type { TaskType } from '../data/types'
import type { ThemeId } from './themeOptions'
import type { MealPeriod } from '../lib/mealTime'

export const getMealImage = (themeId: ThemeId, meal: MealPeriod) =>
  getThemeAsset(
    themeId,
    meal === 'breakfast'
      ? 'eatingBreakfastIcon'
      : meal === 'lunch'
        ? 'eatingLunchIcon'
        : 'dinnerOverview'
  )

export const getPresetChoreOverviewImage = (
  type: TaskType,
  themeId: ThemeId = 'princess',
  meal: MealPeriod = 'dinner'
) => {
  if (type === 'eating') return getMealImage(themeId, meal)
  if (type === 'watertoiletcheck')
    return getThemeAsset(themeId, 'waterToiletOverview')
  return undefined
}
