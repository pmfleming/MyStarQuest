import {
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDayWinterImage,
} from '../assets/themes/princess/assets'
import type { Season } from '../lib/seasons'

export const nonSchoolDayImages: Record<Season, string> = {
  spring: princessNonSchoolDaySpringImage,
  summer: princessNonSchoolDaySummerImage,
  autumn: princessNonSchoolDayAutumnImage,
  winter: princessNonSchoolDayWinterImage,
}
