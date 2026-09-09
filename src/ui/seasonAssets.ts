import type { Season } from '../lib/seasons'
import { getThemeAssets } from './themeAssets'
import type { ThemeId } from './themeOptions'
export const getNonSchoolDayImages = (id: ThemeId): Record<Season, string> => {
  const a = getThemeAssets(id)
  return {
    spring: a.nonSchoolDaySpringImage,
    summer: a.nonSchoolDaySummerImage,
    autumn: a.nonSchoolDayAutumnImage,
    winter: a.nonSchoolDayWinterImage,
  }
}
