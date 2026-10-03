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
const fields = new Set([
  'title',
  'childId',
  'category',
  'taskType',
  'testType',
  'choreType',
  'starValue',
  'isRepeating',
  'imageKey',
  'schoolDayEnabled',
  'nonSchoolDayEnabled',
  'dinnerDurationSeconds',
  'dinnerTotalBites',
  'mathTotalProblems',
  'mathDifficulty',
  'largeNumbersTotalProblems',
  'fractionsTotalProblems',
  'fractionsMaxDenominator',
  'pvTotalProblems',
  'alphabetTotalProblems',
  'spellingTotalProblems',
  'animalsTotalProblems',
  'createdAt',
])
const rewardFields = new Set([
  'title',
  'costStars',
  'isRepeating',
  'imageKey',
  'createdAt',
])
const profileFields = new Set([
  'displayName',
  'avatarToken',
  'totalStars',
  'themeId',
  'testFailureModeEnabled',
])
const types = new Set([
  'standard',
  'eating',
  'watertoiletcheck',
  'math',
  'large-numbers',
  'fractions',
  'positional-notation',
  'alphabet',
  'spelling',
  'animals',
])
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

export function documentPatch(
  collection: string,
  input: unknown,
  childId: string,
  admin: boolean
) {
  const data = record(input)
  if (collection === 'children' && !admin)
    deny('Only the admin can change the child profile.')
  const allowed =
    collection === 'children'
      ? profileFields
      : collection === 'rewards'
        ? rewardFields
        : fields
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) fail(`This field cannot be edited: ${key}`)
    if (key === 'createdAt') continue // Server controls creation time.
    if (key === 'childId' && value !== childId) deny()
    if (
      ['title', 'displayName', 'category', 'imageKey', 'avatarToken'].includes(
        key
      ) &&
      (typeof value !== 'string' || value.length > 200)
    )
      fail(`Invalid ${key}.`)
    if (
      [
        'isRepeating',
        'schoolDayEnabled',
        'nonSchoolDayEnabled',
        'testFailureModeEnabled',
      ].includes(key) &&
      typeof value !== 'boolean'
    )
      fail(`Invalid ${key}.`)
    if (key === 'themeId' && value !== 'princess' && value !== 'teenie')
      fail('Invalid theme.')
    if (key === 'mathDifficulty' && value !== 'easy' && value !== 'hard')
      fail('Invalid difficulty.')
    if (
      ['taskType', 'testType', 'choreType'].includes(key) &&
      !types.has(String(value))
    )
      fail('Invalid activity type.')
    if (
      [
        'starValue',
        'costStars',
        'totalStars',
        'dinnerDurationSeconds',
        'dinnerTotalBites',
        'mathTotalProblems',
        'largeNumbersTotalProblems',
        'fractionsTotalProblems',
        'fractionsMaxDenominator',
        'pvTotalProblems',
        'alphabetTotalProblems',
        'spellingTotalProblems',
        'animalsTotalProblems',
      ].includes(key)
    ) {
      const min = ['costStars', 'totalStars'].includes(key)
        ? 0
        : key === 'fractionsMaxDenominator'
          ? 2
          : 1
      const max =
        key === 'dinnerDurationSeconds'
          ? 86400
          : key === 'dinnerTotalBites'
            ? 20
            : ['costStars', 'totalStars'].includes(key)
              ? 999
              : 9
      if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < min ||
        value > max
      )
        fail(`Invalid ${key}.`)
    }
    clean[key] = value
  }
  return clean
}

export function activityPatch(
  input: unknown,
  taskType: string,
  now: number,
  dateKey: string,
  occurredAt = now
) {
  const data = record(input)
  const allowed = new Set([
    completedFields[taskType],
    'lastAttemptedAt',
    'lastAttemptDateKey',
    'lastAttemptOutcome',
    `manage${taskType === 'positional-notation' ? 'PV' : taskType === 'large-numbers' ? 'LargeNumbers' : taskType[0].toUpperCase() + taskType.slice(1)}LastOutcome`,
  ])
  if (taskType === 'eating')
    [
      'manageDinnerRemainingSeconds',
      'manageDinnerBitesLeft',
      'manageDinnerTimerStartedAt',
    ].forEach((key) => allowed.add(key))
  if (taskType === 'watertoiletcheck')
    ['manageWaterLevel', 'manageToiletStatus'].forEach((key) =>
      allowed.add(key)
    )
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) fail(`Invalid activity state: ${key}`)
    if (key.endsWith('At')) {
      if (
        value !== null &&
        (typeof value !== 'number' || !Number.isFinite(value))
      )
        fail('Invalid activity time.')
      clean[key] =
        value === null
          ? null
          : key === 'manageDinnerTimerStartedAt'
            ? occurredAt
            : now
    } else if (key === 'lastAttemptDateKey') clean[key] = value ? dateKey : ''
    else if (key.endsWith('Outcome')) {
      if (value !== null && value !== 'success' && value !== 'failure')
        fail('Invalid outcome.')
      clean[key] = value
    } else if (key === 'manageWaterLevel') {
      if (!['full', 'twothirds', 'onethird', 'empty'].includes(String(value)))
        fail('Invalid water level.')
      clean[key] = value
    } else if (key === 'manageToiletStatus') {
      if (value !== 'notpeepee' && value !== 'didpeepee')
        fail('Invalid toilet state.')
      clean[key] = value
    } else {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 86400
      )
        fail('Invalid activity value.')
      clean[key] = value
    }
  }
  return clean
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
