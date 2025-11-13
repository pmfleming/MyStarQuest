// src/constants/themeOptions.ts

// Define a type for the theme IDs for type safety
export type ThemeId = 'princess' | 'robot' | 'forest' | 'ocean' | 'dino'

export const THEME_OPTIONS: {
  id: ThemeId
  label: string
  emoji: string
}[] = [
  { id: 'princess', label: 'Princess', emoji: '👸' },
  { id: 'robot', label: 'Robot', emoji: '🤖' },
  { id: 'forest', label: 'Nature', emoji: '🌲' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'dino', label: 'Dinosaurs', emoji: '🦖' },
]

// A quick lookup map for getting theme details by ID
export const THEME_ID_LOOKUP = new Map(
  THEME_OPTIONS.map((option) => [option.id, option])
)
