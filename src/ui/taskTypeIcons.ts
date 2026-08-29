import {
  princessChoresIcon,
  princessEatingDinnerIcon,
  princessFlaskFullImage,
  princessMathsIcon,
} from '../assets/themes/princess/assets'
import type { TaskType } from '../data/types'
import animalsIcon from '../assets/global/cat-camel-cow.webp'

const princessIconByTaskType = {
  standard: princessChoresIcon,
  eating: princessEatingDinnerIcon,
  watertoiletcheck: princessFlaskFullImage,
  math: princessMathsIcon,
  'large-numbers': princessMathsIcon,
  'positional-notation': princessMathsIcon,
  alphabet: princessMathsIcon,
  spelling: princessMathsIcon,
  animals: animalsIcon,
} satisfies Record<TaskType, string>

export const getPrincessTaskTypeIcon = (taskType: TaskType) =>
  princessIconByTaskType[taskType]
