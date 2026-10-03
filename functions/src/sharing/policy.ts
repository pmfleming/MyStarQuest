import { HttpsError } from 'firebase-functions/v2/https'
import type { SharedOperation } from './protocol'

export function fail(message: string): never {
  throw new HttpsError('invalid-argument', message)
}
export function deny(message = 'You do not have access to this child.'): never {
  throw new HttpsError('permission-denied', message)
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fail('Expected an object.')
  return value as Record<string, unknown>
}
export function id(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[^/\s]{1,160}$/.test(value) ||
    value === '.' ||
    value === '..'
  )
    return fail('Invalid identifier.')
  return value
}
export function email(value: unknown) {
  if (
    typeof value !== 'string' ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  )
    return fail('Enter a valid email address.')
  return value.trim().toLowerCase()
}
export const completedFields: Record<string, string> = {
  standard: 'manageCompletedAt',
  eating: 'manageDinnerCompletedAt',
  watertoiletcheck: 'manageWaterToiletCompletedAt',
  math: 'manageMathCompletedAt',
  'large-numbers': 'manageLargeNumbersCompletedAt',
  fractions: 'manageFractionsCompletedAt',
  'positional-notation': 'managePVCompletedAt',
  alphabet: 'manageAlphabetCompletedAt',
  spelling: 'manageSpellingCompletedAt',
  animals: 'manageAnimalsCompletedAt',
}

type Validator = (value: unknown) => boolean
const text: Validator = (value) =>
  typeof value === 'string' && value.length <= 200
const boolean: Validator = (value) => typeof value === 'boolean'
const between =
  (min: number, max: number): Validator =>
  (value) =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
const oneOf =
  (...values: unknown[]): Validator =>
  (value) =>
    values.includes(value)
const taskType: Validator = (value) =>
  Object.hasOwn(completedFields, String(value))
const problemCount = between(1, 9)
const starCount = between(0, 999)
const taskRules: Record<string, Validator> = {
  title: text,
  category: text,
  imageKey: text,
  isRepeating: boolean,
  schoolDayEnabled: boolean,
  nonSchoolDayEnabled: boolean,
  mathDifficulty: oneOf('easy', 'hard'),
  taskType,
  testType: taskType,
  choreType: taskType,
  starValue: problemCount,
  dinnerDurationSeconds: between(1, 86400),
  dinnerTotalBites: between(1, 20),
  fractionsMaxDenominator: between(2, 9),
  mathTotalProblems: problemCount,
  largeNumbersTotalProblems: problemCount,
  fractionsTotalProblems: problemCount,
  pvTotalProblems: problemCount,
  alphabetTotalProblems: problemCount,
  spellingTotalProblems: problemCount,
  animalsTotalProblems: problemCount,
}
const documentRules: Record<string, Record<string, Validator>> = {
  chores: taskRules,
  tests: taskRules,
  rewards: {
    title: text,
    costStars: starCount,
    isRepeating: boolean,
    imageKey: text,
  },
  children: {
    displayName: text,
    avatarToken: text,
    totalStars: starCount,
    themeId: oneOf('princess', 'teenie'),
    testFailureModeEnabled: boolean,
  },
}

export function documentPatch(
  collection: string,
  input: unknown,
  childId: string,
  admin: boolean
) {
  const data = record(input)
  if (collection === 'children' && !admin)
    deny('Only the admin can change the child profile.')
  const rules = documentRules[collection]
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'createdAt' && collection !== 'children') continue // Server controls creation time.
    if (
      key === 'childId' &&
      (collection === 'chores' || collection === 'tests')
    ) {
      if (value !== childId) deny()
    } else {
      if (!Object.hasOwn(rules, key))
        fail(`This field cannot be edited: ${key}`)
      if (!rules[key](value)) fail(`Invalid ${key}.`)
    }
    clean[key] = value
  }
  return clean
}

const finiteNumber: Validator = (value) =>
  typeof value === 'number' && Number.isFinite(value)
const activityRules: Record<string, Validator> = {
  manageWaterLevel: (value) =>
    ['full', 'twothirds', 'onethird', 'empty'].includes(String(value)),
  manageToiletStatus: oneOf('notpeepee', 'didpeepee'),
}
const extraActivityFields: Record<string, string[]> = {
  eating: [
    'manageDinnerRemainingSeconds',
    'manageDinnerBitesLeft',
    'manageDinnerTimerStartedAt',
  ],
  watertoiletcheck: ['manageWaterLevel', 'manageToiletStatus'],
}
function activityValue(
  key: string,
  value: unknown,
  now: number,
  dateKey: string,
  occurredAt: number
) {
  if (key.endsWith('At')) {
    if (value === null) return null
    if (!finiteNumber(value)) fail('Invalid activity time.')
    return key === 'manageDinnerTimerStartedAt' ? occurredAt : now
  }
  if (key === 'lastAttemptDateKey') return value ? dateKey : ''
  if (key.endsWith('Outcome')) {
    if (!oneOf(null, 'success', 'failure')(value)) fail('Invalid outcome.')
  } else if (activityRules[key]) {
    if (!activityRules[key](value)) fail(`Invalid activity state: ${key}`)
  } else if (!finiteNumber(value) || Number(value) < 0 || Number(value) > 86400)
    fail('Invalid activity value.')
  return value
}
export function activityPatch(
  input: unknown,
  taskType: string,
  now: number,
  dateKey: string,
  occurredAt = now
) {
  const outcomeTypes: Record<string, string> = {
    'positional-notation': 'PV',
    'large-numbers': 'LargeNumbers',
  }
  const outcomeType =
    outcomeTypes[taskType] ?? taskType[0].toUpperCase() + taskType.slice(1)
  const allowed = new Set([
    completedFields[taskType],
    'lastAttemptedAt',
    'lastAttemptDateKey',
    'lastAttemptOutcome',
    `manage${outcomeType}LastOutcome`,
    ...(extraActivityFields[taskType] ?? []),
  ])
  return Object.fromEntries(
    Object.entries(record(input)).map(([key, value]) => {
      if (!allowed.has(key)) fail(`Invalid activity state: ${key}`)
      return [key, activityValue(key, value, now, dateKey, occurredAt)]
    })
  )
}

export function parseOperation(input: unknown): SharedOperation {
  const op = record(input)
  id(op.id)
  id(op.deviceId)
  if (
    !Number.isSafeInteger(op.sequence) ||
    Number(op.sequence) < 1 ||
    !Number.isFinite(op.occurredAt)
  )
    fail('Invalid operation sequence.')
  const action = record(op.action)
  id(action.entityId)
  if (action.kind === 'document') {
    if (
      !['children', 'chores', 'tests', 'rewards'].includes(
        String(action.collection)
      ) ||
      !['put', 'patch', 'delete'].includes(String(action.mode))
    )
      fail('Invalid document action.')
    record(action.data)
  } else if (action.kind === 'activity') {
    id(action.childId)
    if (
      !['chores', 'tests'].includes(String(action.collection)) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(String(action.dateKey))
    )
      fail('Invalid activity.')
    if (
      ![action.complete, action.reset, action.consume].every(
        (v) => typeof v === 'boolean'
      )
    )
      fail('Invalid activity flags.')
    if (
      !Number.isSafeInteger(action.generation) ||
      Number(action.generation) < 0 ||
      !Number.isSafeInteger(action.revision) ||
      Number(action.revision) < 0
    )
      fail('Refresh this activity before saving.')
    record(action.patch)
  } else if (action.kind === 'redeem') id(action.childId)
  else fail('Unsupported action.')
  if (JSON.stringify(op).length > 32_000) fail('Operation too large.')
  return op as SharedOperation
}

export function awardFor(
  task: Record<string, unknown>,
  patch: Record<string, unknown>
) {
  if (task.taskType === 'watertoiletcheck') {
    const water = patch.manageWaterLevel ?? 'full'
    const toilet = patch.manageToiletStatus ?? 'notpeepee'
    return (
      (water === 'empty' ? 1 : water === 'full' ? -1 : 0) +
      (toilet === 'didpeepee' ? 1 : -5)
    )
  }
  return Math.max(0, Math.min(999, Number(task.starValue) || 0))
}
