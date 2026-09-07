import { getThemeAsset, hasIllustratedTheme } from '../ui/themeAssets'
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
  if (!hasIllustratedTheme(theme.id)) return null

  switch (waterLevel) {
    case 'full':
      return getThemeAsset(theme.id, 'flaskFullImage')
    case 'twothirds':
      return getThemeAsset(theme.id, 'flaskTwoThirdsImage')
    case 'onethird':
      return getThemeAsset(theme.id, 'flaskOneThirdImage')
    case 'empty':
      return getThemeAsset(theme.id, 'drinkSuccessImage')
  }
}

export const getToiletImage = (theme: Theme, toiletStatus: ToiletStatus) => {
  if (!hasIllustratedTheme(theme.id)) return null
  return toiletStatus === 'didpeepee'
    ? getThemeAsset(theme.id, 'didPeePeeImage')
    : getThemeAsset(theme.id, 'notPeePeeImage')
}

export const getWaterToiletOutcomeImage = (
  theme: Theme,
  outcome: WaterToiletOutcome
) => {
  if (!hasIllustratedTheme(theme.id)) return undefined
  return outcome === 'success'
    ? getThemeAsset(theme.id, 'drinkSuccessImage')
    : getThemeAsset(theme.id, 'notPeePeeImage')
}
