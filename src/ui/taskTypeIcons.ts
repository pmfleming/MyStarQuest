import { getThemeAssets } from './themeAssets'
import type { TaskType } from '../data/types'
import type { ThemeId } from './themeOptions'
import animalsIcon from '../assets/global/cat-camel-cow.webp'
export const getTaskTypeIcon = (
  taskType: TaskType,
  themeId: ThemeId = 'princess'
) => {
  const assets = getThemeAssets(themeId)
  const icons = {
    standard: assets.choresIcon,
    eating: assets.eatingDinnerIcon,
    watertoiletcheck: assets.flaskFullImage,
    math: assets.mathsIcon,
    'large-numbers': assets.mathsIcon,
    'positional-notation': assets.mathsIcon,
    alphabet: assets.mathsIcon,
    spelling: assets.mathsIcon,
    animals: animalsIcon,
  } satisfies Record<TaskType, string>
  return icons[taskType]
}
