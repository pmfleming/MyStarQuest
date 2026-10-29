import type { TestType } from './types'

export const TEST_CATEGORIES = [
  'numbers',
  'letters',
  'trivia',
  'stories',
] as const
export type TestCategory = (typeof TEST_CATEGORIES)[number]
export type ExerciseCategory = Exclude<TestCategory, 'stories'>

export const categoryLabels: Record<TestCategory, string> = {
  numbers: 'Numbers',
  letters: 'Letters',
  trivia: 'Trivia',
  stories: 'Stories',
}

export const testCategory: Record<TestType, ExerciseCategory> = {
  math: 'numbers',
  'large-numbers': 'numbers',
  fractions: 'numbers',
  'positional-notation': 'numbers',
  alphabet: 'letters',
  spelling: 'letters',
  animals: 'trivia',
}
