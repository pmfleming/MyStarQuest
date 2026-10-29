import princessImage from '../assets/themes/princess/princess.svg'
import teenieImage from '../assets/teenie/heart.webp'
import { isThemeId, type ThemeId } from '../data/themeIds'

export { isThemeId, type ThemeId }

interface ThemeOption {
  id: ThemeId
  label: string
  emoji: string
  description: string
  image: string
}

export const themeOptions: ThemeOption[] = [
  {
    id: 'teenie',
    label: 'Teenie Friends',
    emoji: '💖',
    description: 'Teenie Friends',
    image: teenieImage,
  },
  {
    id: 'princess',
    label: 'Princess',
    emoji: '👑',
    description: 'Royal Kingdom',
    image: princessImage,
  },
]

// A quick lookup map for getting theme details by ID
export const THEME_ID_LOOKUP = new Map(
  themeOptions.map((option) => [option.id, option])
)
