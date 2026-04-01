import {
  princessDidPeePeeImage,
  princessFlaskOneThirdImage,
  princessFlaskTwoThirdsImage,
  princessFlaskFullImage,
  princessDrinkSuccessImage,
  princessNotPeePeeImage,
} from '../assets/themes/princess/assets'
import type { Theme } from '../contexts/ThemeContext'
import type { ToiletStatus, WaterLevel } from '../data/types'
import type { WaterToiletOutcome } from '../lib/choreLogic'

export const waterLabels: Record<WaterLevel, string> = {
  full: 'Full flask',
  twothirds: 'Two-thirds full flask',
  onethird: 'One-third full flask',
  empty: 'Empty flask',
}

export const toiletLabels: Record<ToiletStatus, string> = {
  notpeepee: 'Has not gone to the toilet',
  didpeepee: 'Has gone to the toilet',
}

export const fallbackWaterVisuals: Record<WaterLevel, string> = {
  full: '💧💧💧',
  twothirds: '💧💧',
  onethird: '💧',
  empty: '🫙',
}

export const fallbackToiletVisuals: Record<ToiletStatus, string> = {
  notpeepee: '🚫',
  didpeepee: '✅',
}

export const getWaterImage = (theme: Theme, waterLevel: WaterLevel) => {
  if (theme.id !== 'princess') return null

  switch (waterLevel) {
    case 'full':
      return princessFlaskFullImage
    case 'twothirds':
      return princessFlaskTwoThirdsImage
    case 'onethird':
      return princessFlaskOneThirdImage
    case 'empty':
      return princessDrinkSuccessImage
  }
}

export const getToiletImage = (theme: Theme, toiletStatus: ToiletStatus) => {
  if (theme.id !== 'princess') return null
  return toiletStatus === 'didpeepee'
    ? princessDidPeePeeImage
    : princessNotPeePeeImage
}

export const getWaterToiletOutcomeImage = (
  theme: Theme,
  outcome: WaterToiletOutcome
) => {
  if (theme.id !== 'princess') return undefined
  return outcome === 'success'
    ? princessDrinkSuccessImage
    : princessNotPeePeeImage
}
