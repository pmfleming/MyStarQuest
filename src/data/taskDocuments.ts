import { serverTimestamp } from 'firebase/firestore'
import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_ALPHABET_STARS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_MATH_STARS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_PV_STARS,
  DEFAULT_TOILET_STATUS,
  DEFAULT_WATER_LEVEL,
  DEFAULT_WATER_TOILET_STARS,
  isAlphabetTask,
  isEatingTask,
  isMathTask,
  isPositionalNotationTask,
  isWaterToiletTask,
  type ChoreType,
  type ChoreRecord,
  type TaskRecord,
  type TestRecord,
  type TestType,
} from './types'

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
}

const TEST_TYPES: TestType[] = ['math', 'positional-notation', 'alphabet']

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
) => ({
  ...buildBaseTaskDocument(childId, choreType, CHORE_TEMPLATES[choreType]),
  choreType,
  nonSchoolDayEnabled:
    choreType === 'watertoiletcheck'
      ? false
      : (CHORE_TEMPLATES[choreType].extras?.nonSchoolDayEnabled ?? true),
  ...settings,
})

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
  }
}

export const buildDefaultTests = (childId: string): TestRecord[] =>
  TEST_TYPES.map((testType, index) =>
    buildDefaultTest(childId, testType, index)
  )

const buildTodoBase = (task: TaskRecord, childId: string, dateKey: string) => ({
  title: task.title,
  childId,
  sourceTaskId: task.id,
  sourceTaskType: task.taskType,
  starValue: task.starValue,
  schoolDayEnabled: task.schoolDayEnabled,
  nonSchoolDayEnabled: task.nonSchoolDayEnabled,
  autoAdded: false,
  dateKey,
  createdAt: serverTimestamp(),
  completedAt: null,
})

export const buildChoreTodoDocument = (
  task: TaskRecord,
  childId: string,
  dateKey: string
) => ({
  ...buildTodoBase(task, childId, dateKey),
  sourceChoreId: task.id,
  sourceChoreType: task.taskType,
  ...taskSpecificTodoFields(task),
})

export const buildTestTodoDocument = (
  test: TestRecord,
  childId: string,
  dateKey: string
) => ({
  ...buildTodoBase(test, childId, dateKey),
  sourceTestId: test.id,
  sourceTestType: test.taskType,
  ...taskSpecificTodoFields(test),
})

const taskSpecificTodoFields = (task: TaskRecord): Record<string, unknown> => {
  if (isEatingTask(task)) {
    return {
      dinnerDurationSeconds: task.dinnerDurationSeconds,
      dinnerRemainingSeconds: task.dinnerDurationSeconds,
      dinnerTotalBites: task.dinnerTotalBites,
      dinnerBitesLeft: task.dinnerTotalBites,
    }
  }

  if (isMathTask(task)) {
    return {
      mathTotalProblems: task.mathTotalProblems,
      mathDifficulty: task.mathDifficulty,
      mathLastOutcome: null,
    }
  }

  if (isAlphabetTask(task)) {
    return {
      alphabetTotalProblems: task.alphabetTotalProblems,
      alphabetLastOutcome: null,
    }
  }

  if (isPositionalNotationTask(task)) {
    return {
      pvTotalProblems: task.pvTotalProblems,
      pvLastOutcome: null,
    }
  }

  if (isWaterToiletTask(task)) {
    return {
      waterLevel: DEFAULT_WATER_LEVEL,
      toiletStatus: DEFAULT_TOILET_STATUS,
    }
  }

  return {}
}
