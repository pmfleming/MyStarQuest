import dinnerOverviewImage from '../assets/themes/princess/dinner-overview.webp'
import waterToiletCheckOverviewImage from '../assets/themes/princess/water-toilet-check-overview.webp'
import type { TaskType } from '../data/types'

export const getPresetChoreOverviewImage = (type: TaskType) => {
  if (type === 'eating') return dinnerOverviewImage
  if (type === 'watertoiletcheck') return waterToiletCheckOverviewImage
  return undefined
}
