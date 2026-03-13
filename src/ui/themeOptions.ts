// src/constants/themeOptions.ts

// Define a type for the theme IDs for type safety
export type ThemeId = 'space' | 'nature' | 'cartoon' | 'princess'

interface ThemeOption {
  id: ThemeId
  label: string
  emoji: string
  description: string
}

const themeOptions: ThemeOption[] = [
  {
    id: 'space',
    label: 'Space',
    emoji: '🚀',
    description: 'Galactic Explorer',
  },
  { id: 'nature', label: 'Nature', emoji: '🌿', description: 'Sunny Meadow' },
  { id: 'cartoon', label: 'Cartoon', emoji: '💥', description: 'Super Squad' },
  {
    id: 'princess',
    label: 'Princess',
    emoji: '👑',
    description: 'Royal Kingdom',
  },
]

// A quick lookup map for getting theme details by ID
export const THEME_ID_LOOKUP = new Map(
  themeOptions.map((option) => [option.id, option])
)
