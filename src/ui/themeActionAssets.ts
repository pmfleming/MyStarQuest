import genericResetIcon from '../assets/global/reset.svg'
import {
  princessDeleteIcon,
  princessEditIcon,
  princessResetIcon,
} from '../assets/themes/princess/assets'
import type { ThemeId } from './themeOptions'

export type ThemeActionIcon = 'edit' | 'delete' | 'reset'

const genericActionIcons: Partial<Record<ThemeActionIcon, string>> = {
  reset: genericResetIcon,
}

const themedActionIcons: Partial<
  Record<ThemeId, Partial<Record<ThemeActionIcon, string>>>
> = {
  princess: {
    edit: princessEditIcon,
    delete: princessDeleteIcon,
    reset: princessResetIcon,
  },
}

export const getThemeActionIcon = (themeId: ThemeId, action: ThemeActionIcon) =>
  themedActionIcons[themeId]?.[action] ?? genericActionIcons[action]
