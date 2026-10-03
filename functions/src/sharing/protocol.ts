// Wire contract shared by the web client and callable functions.
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
export const SHARED_DATA_VERSION = 1

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
