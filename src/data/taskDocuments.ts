import { TEST_TEMPLATES } from '../../functions/src/sharing/defaultTests'
import { serverTimestamp } from 'firebase/firestore'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
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
