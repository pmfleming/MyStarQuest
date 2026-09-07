import princessImage from '../assets/themes/princess/princess.svg'
import teenieImage from '../assets/teenie/heart.webp'

// Define a type for the theme IDs for type safety
export type ThemeId = 'princess' | 'teenie'

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

export const isThemeId = (value: string): value is ThemeId =>
  themeOptions.some((option) => option.id === value)

// A quick lookup map for getting theme details by ID
export const THEME_ID_LOOKUP = new Map(
  themeOptions.map((option) => [option.id, option])
)
