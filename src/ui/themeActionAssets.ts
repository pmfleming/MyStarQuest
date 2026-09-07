import genericResetIcon from '../assets/global/reset.svg'
import { getThemeAsset, hasIllustratedTheme } from './themeAssets'
import type { ThemeId } from './themeOptions'
export type ThemeActionIcon = 'edit' | 'delete' | 'reset'
export const getThemeActionIcon = (id: ThemeId, action: ThemeActionIcon) =>
  hasIllustratedTheme(id)
    ? getThemeAsset(id, `${action}Icon`)
    : action === 'reset'
      ? genericResetIcon
      : undefined
