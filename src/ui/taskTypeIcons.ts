import {
  princessChoresIcon,
  princessEatingDinnerIcon,
  princessFlaskFullImage,
  princessMathsIcon,
} from '../assets/themes/princess/assets'
import type { TaskType } from '../data/types'

export const getPrincessTaskTypeIcon = (taskType: TaskType) => {
  switch (taskType) {
    case 'eating':
      return princessEatingDinnerIcon
    case 'watertoiletcheck':
      return princessFlaskFullImage
    case 'math':
    case 'positional-notation':
    case 'alphabet':
    case 'spelling':
      return princessMathsIcon
    case 'standard':
    default:
      return princessChoresIcon
  }
}
