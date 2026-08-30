import { serverTimestamp } from 'firebase/firestore'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ALPHABET_STARS,
  DEFAULT_ANIMALS_PROBLEMS,
  DEFAULT_ANIMALS_STARS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_LARGE_NUMBERS_STARS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_MATH_STARS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_PV_STARS,
  DEFAULT_SPELLING_PROBLEMS,
  DEFAULT_SPELLING_STARS,
  DEFAULT_WATER_TOILET_STARS,
  type ChoreType,
  type ChoreRecord,
  type TestRecord,
  type TestType,
} from './types'
import { validateTaskFields } from './taskLimits'

type TaskTemplate = {
  title: string
  category: string
  starValue: number
  extras?: Record<string, unknown>
}

const CHORE_TEMPLATES: Record<ChoreType, TaskTemplate> = {
  standard: {
    title: 'New Chore',
    category: '',
    starValue: 1,
  },
  eating: {
    title: 'Dinner',
    category: 'eating',
    starValue: DEFAULT_DINNER_STARS,
    extras: {
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    },
  },
  watertoiletcheck: {
    title: 'Water & Toilet Check',
    category: 'watertoiletcheck',
    starValue: DEFAULT_WATER_TOILET_STARS,
  },
}

const TEST_TEMPLATES: Record<TestType, TaskTemplate> = {
  math: {
    title: 'Arithmetic',
    category: 'math',
    starValue: DEFAULT_MATH_STARS,
    extras: {
      mathTotalProblems: DEFAULT_MATH_PROBLEMS,
      mathDifficulty: 'easy',
    },
  },
  'large-numbers': {
    title: 'Large Numbers',
    category: 'large-numbers',
    starValue: DEFAULT_LARGE_NUMBERS_STARS,
    extras: {
      largeNumbersTotalProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
    },
  },
  'positional-notation': {
    title: 'Positional Notation',
    category: 'positional-notation',
    starValue: DEFAULT_PV_STARS,
    extras: {
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
    },
  },
  alphabet: {
    title: 'Alphabet Match',
    category: 'alphabet',
    starValue: DEFAULT_ALPHABET_STARS,
    extras: {
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
    },
  },
  spelling: {
    title: 'Spelling',
    category: 'spelling',
    starValue: DEFAULT_SPELLING_STARS,
    extras: {
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
    },
  },
  animals: {
    title: 'Animals',
    category: 'animals',
    starValue: DEFAULT_ANIMALS_STARS,
    extras: {
      animalsTotalProblems: DEFAULT_ANIMALS_PROBLEMS,
    },
  },
}

const TEST_TYPES: TestType[] = [
  'math',
  'large-numbers',
  'positional-notation',
  'alphabet',
  'spelling',
  'animals',
]

const buildBaseTaskDocument = (
  childId: string,
  taskType: ChoreType | TestType,
  template: TaskTemplate
) => ({
  title: template.title,
  childId,
  category: template.category,
  taskType,
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  starValue: template.starValue,
  isRepeating: true,
  createdAt: serverTimestamp(),
  ...template.extras,
})

export type ChoreDocumentSettings = Partial<
  Pick<
    ChoreRecord,
    | 'title'
    | 'schoolDayEnabled'
    | 'nonSchoolDayEnabled'
    | 'starValue'
    | 'isRepeating'
    | 'imageKey'
  >
> &
  Partial<{
    dinnerDurationSeconds: number
    dinnerTotalBites: number
  }>

export const buildChoreDocument = (
  childId: string,
  choreType: ChoreType,
  settings: ChoreDocumentSettings = {}
) => {
  const document = {
    ...buildBaseTaskDocument(childId, choreType, CHORE_TEMPLATES[choreType]),
    choreType,
    nonSchoolDayEnabled:
      choreType === 'watertoiletcheck'
        ? false
        : (CHORE_TEMPLATES[choreType].extras?.nonSchoolDayEnabled ?? true),
    ...settings,
  }
  validateTaskFields(document)
  return document
}

export const buildTestDocument = (childId: string, testType: TestType) => ({
  ...buildBaseTaskDocument(childId, testType, TEST_TEMPLATES[testType]),
  testType,
})

const buildDefaultTest = (
  childId: string,
  testType: TestType,
  index: number
): TestRecord => {
  const template = TEST_TEMPLATES[testType]
  const base = {
    id: `default-${testType}-${childId}`,
    title: template.title,
    childId,
    category: template.category,
    schoolDayEnabled: true,
    nonSchoolDayEnabled: true,
    starValue: template.starValue,
    isRepeating: true,
    createdAt: new Date(index),
  }

  switch (testType) {
    case 'math':
      return {
        ...base,
        taskType: 'math',
        mathTotalProblems: DEFAULT_MATH_PROBLEMS,
        mathDifficulty: 'easy',
      }
    case 'large-numbers':
      return {
        ...base,
        taskType: 'large-numbers',
        largeNumbersTotalProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
      }
    case 'positional-notation':
      return {
        ...base,
        taskType: 'positional-notation',
        pvTotalProblems: DEFAULT_PV_PROBLEMS,
      }
    case 'alphabet':
      return {
        ...base,
        taskType: 'alphabet',
        alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
      }
    case 'spelling':
      return {
        ...base,
        taskType: 'spelling',
        spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
      }
    case 'animals':
      return {
        ...base,
        taskType: 'animals',
        animalsTotalProblems: DEFAULT_ANIMALS_PROBLEMS,
      }
  }
}

export const buildDefaultTests = (childId: string): TestRecord[] =>
  TEST_TYPES.map((testType, index) =>
    buildDefaultTest(childId, testType, index)
  )
