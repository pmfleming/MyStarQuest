import { getThemeAsset } from './themeAssets'
import type { TaskType } from '../data/types'
import type { ThemeId } from './themeOptions'
export const getPresetChoreOverviewImage = (
  type: TaskType,
  themeId: ThemeId = 'princess'
) => {
  if (type === 'eating') return getThemeAsset(themeId, 'dinnerOverview')
  if (type === 'watertoiletcheck')
    return getThemeAsset(themeId, 'waterToiletOverview')
  return undefined
}
