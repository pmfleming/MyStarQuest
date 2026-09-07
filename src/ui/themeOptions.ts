import princessImage from '../assets/themes/princess/princess.svg'
import teenieImage from '../assets/teenie/heart.webp'
import spaceImage from '../assets/themes/space/space.svg'
import natureImage from '../assets/themes/nature/nature.svg'
import cartoonImage from '../assets/themes/cartoon/cartoon.svg'

// Define a type for the theme IDs for type safety
export type ThemeId = 'space' | 'nature' | 'cartoon' | 'princess' | 'teenie'

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
    id: 'space',
    label: 'Space',
    emoji: '🚀',
    description: 'Galactic Explorer',
    image: spaceImage,
  },
  {
    id: 'nature',
    label: 'Nature',
    emoji: '🌿',
    description: 'Sunny Meadow',
    image: natureImage,
  },
  {
    id: 'cartoon',
    label: 'Cartoon',
    emoji: '💥',
    description: 'Super Squad',
    image: cartoonImage,
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
