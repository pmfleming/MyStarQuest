import { getThemeAssets } from './themeAssets'
import type { ThemeId } from './themeOptions'
import type { Season } from '../lib/seasons'
export const getNonSchoolDayImages = (id: ThemeId): Record<Season, string> => {
  const a = getThemeAssets(id)
  return {
    spring: a.nonSchoolDaySpringImage,
    summer: a.nonSchoolDaySummerImage,
    autumn: a.nonSchoolDayAutumnImage,
    winter: a.nonSchoolDayWinterImage,
  }
}
// Compatibility for consumers that explicitly need the original calendar artwork.
export const nonSchoolDayImages = getNonSchoolDayImages('princess')
