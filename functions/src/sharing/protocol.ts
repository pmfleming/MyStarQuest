// Wire contract shared by the web client and callable functions.
export const taskCompletedFields = {
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
} as const

/** Persisted counters have historically accepted numeric strings and missing values. */
export const storedNumber = (
  data: Record<string, unknown> | undefined,
  field: string
) => Number(data?.[field] ?? 0)

export const waterToiletStars = (water: unknown, toilet: unknown) =>
  (water === 'empty' ? 1 : water === 'full' ? -1 : 0) +
  (toilet === 'didpeepee' ? 1 : -5)

export type ChildScope = {
  actorUid: string
  ownerUid: string
  childId: string
  membershipVersion: number
}
export type SharedAction =
  | {
      kind: 'document'
      collection: 'children' | 'chores' | 'tests' | 'rewards'
      entityId: string
      mode: 'put' | 'patch' | 'delete'
      data: Record<string, unknown>
    }
  | {
      kind: 'activity'
      collection: 'chores' | 'tests'
      entityId: string
      childId: string
      dateKey: string
      patch: Record<string, unknown>
      delta: number
      complete: boolean
      reset: boolean
      consume: boolean
      generation?: number
      revision?: number
    }
  | {
      kind: 'redeem'
      entityId: string
      childId: string
      title: string
      cost: number
      consume: boolean
    }
export type SharedOperation = {
  id: string
  deviceId: string
  sequence: number
  occurredAt: number
  action: SharedAction
}
export type SharedReceipt = {
  collection: 'children' | 'chores' | 'tests' | 'rewards'
  entityId: string
  document: Record<string, unknown> | null
  progress?: Record<string, unknown>
  progressKey?: string
  removed?: { collection: 'chores' | 'tests' | 'rewards'; entityId: string }
  history?: {
    collection: 'starEvents' | 'redemptions'
    id: string
    data: Record<string, unknown>
  }
  appliedDelta?: number
  starsBefore?: number
  title?: string
}
export type ParentEntry = { uid: string; email: string; status: string }
export type InvitationEntry = {
  id: string
  email: string
  state: string
  deliveryState: string
  expiresAt: number
}

export function sharedDateKey(time = Date.now(), timeZone = 'Europe/London') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(time))
}
export const progressKey = (collection: string, id: string, date: string) =>
  `${collection}_${encodeURIComponent(id)}_${date}`
