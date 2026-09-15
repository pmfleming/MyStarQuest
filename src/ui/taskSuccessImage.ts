import { getChoreImage } from '../assets/chores/assets'
import type { TaskWithEphemeral } from '../data/types'
import type { Theme } from '../contexts/ThemeContext'
import { getThemeAsset } from './themeAssets'
import { getWaterToiletOutcomeImage } from './waterToiletAssets'

export const getTaskSuccessImage = (item: TaskWithEphemeral, theme: Theme) => {
  if (item.taskType === 'standard') {
    return (
      getChoreImage(item.imageKey, theme.id) ??
      getThemeAsset(theme.id, 'quizCorrectImage')
    )
  }
  if (item.taskType === 'eating')
    return getThemeAsset(theme.id, 'eatingFullImage')
  if (item.taskType === 'watertoiletcheck') {
    return (
      getWaterToiletOutcomeImage(theme, 'success') ??
      getThemeAsset(theme.id, 'quizCorrectImage')
    )
  }
  return getThemeAsset(theme.id, 'quizCorrectImage')
}
