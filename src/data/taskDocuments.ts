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
  DEFAULT_FRACTIONS_PROBLEMS,
  DEFAULT_FRACTIONS_STARS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_MATH_STARS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_PV_STARS,
  DEFAULT_SPELLING_PROBLEMS,
  DEFAULT_SPELLING_STARS,
  DEFAULT_WATER_TOILET_STARS,
  TEST_TYPES,
  type ChoreType,
  type ChoreRecord,
  type TestRecord,
  type TestType,
} from './types'
import { validateTaskFields } from './taskLimits'

type TaskTemplate = {
  title: string
  category?: string
  starValue: number
}

const CHORE_TEMPLATES = {
  standard: {
    title: 'New Chore',
    category: '',
    starValue: 1,
  },
  eating: {
    title: 'Dinner',
    category: 'eating',
    starValue: DEFAULT_DINNER_STARS,
    dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
    dinnerTotalBites: DEFAULT_DINNER_BITES,
  },
  watertoiletcheck: {
    title: 'Water & Toilet Check',
    category: 'watertoiletcheck',
    starValue: DEFAULT_WATER_TOILET_STARS,
  },
} satisfies Record<
  ChoreType,
  TaskTemplate &
    Partial<{ dinnerDurationSeconds: number; dinnerTotalBites: number }>
>

const TEST_TEMPLATES = {
  fractions: {
    title: 'Fractions',
    starValue: DEFAULT_FRACTIONS_STARS,
    taskType: 'fractions',
    fractionsTotalProblems: DEFAULT_FRACTIONS_PROBLEMS,
  },
  math: {
    title: 'Arithmetic',
    starValue: DEFAULT_MATH_STARS,
    taskType: 'math',
    mathTotalProblems: DEFAULT_MATH_PROBLEMS,
    mathDifficulty: 'easy',
  },
  'large-numbers': {
    title: 'Large Numbers',
    starValue: DEFAULT_LARGE_NUMBERS_STARS,
    taskType: 'large-numbers',
    largeNumbersTotalProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
  },
  'positional-notation': {
    title: 'Positional Notation',
    starValue: DEFAULT_PV_STARS,
    taskType: 'positional-notation',
    pvTotalProblems: DEFAULT_PV_PROBLEMS,
  },
  alphabet: {
    title: 'Alphabet Match',
    starValue: DEFAULT_ALPHABET_STARS,
    taskType: 'alphabet',
    alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
  },
  spelling: {
    title: 'Spelling',
    starValue: DEFAULT_SPELLING_STARS,
    taskType: 'spelling',
    spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
  },
  animals: {
    title: 'Who am I?',
    starValue: DEFAULT_ANIMALS_STARS,
    taskType: 'animals',
    animalsTotalProblems: DEFAULT_ANIMALS_PROBLEMS,
  },
} satisfies {
  [Type in TestType]: TaskTemplate &
    Omit<Extract<TestRecord, { taskType: Type }>, keyof TestRecord> & {
      taskType: Type
    }
}

const buildBaseTaskDocument = (
  childId: string,
  taskType: ChoreType | TestType,
  template: TaskTemplate
) => ({
  category: taskType,
  ...template,
  childId,
  taskType,
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  isRepeating: true,
  createdAt: serverTimestamp(),
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
    nonSchoolDayEnabled: choreType !== 'watertoiletcheck',
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
  return {
    id: `default-${testType}-${childId}`,
    ...TEST_TEMPLATES[testType],
    category: testType,
    childId,
    schoolDayEnabled: true,
    nonSchoolDayEnabled: true,
    isRepeating: true,
    createdAt: new Date(index),
  }
}

export const buildDefaultTests = (childId: string): TestRecord[] =>
  TEST_TYPES.map((testType, index) =>
    buildDefaultTest(childId, testType, index)
  )
