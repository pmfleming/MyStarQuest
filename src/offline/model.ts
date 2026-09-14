export type CollectionName = 'children' | 'chores' | 'tests' | 'rewards'
export type LocalDocument = Record<string, unknown>
export const collections: CollectionName[] = [
  'children',
  'chores',
  'tests',
  'rewards',
]

type DocumentAction = {
  kind: 'document'
  collection: CollectionName
  entityId: string
  mode: 'put' | 'patch' | 'delete'
  data: LocalDocument
}
type ActivityAction = {
  kind: 'activity'
  collection: 'chores' | 'tests'
  entityId: string
  childId: string
  dateKey: string
  patch: LocalDocument
  delta: number
  complete: boolean
  reset: boolean
  consume: boolean
}
type RedemptionAction = {
  kind: 'redeem'
  entityId: string
  childId: string
  title: string
  cost: number
  consume: boolean
}
export type Action = DocumentAction | ActivityAction | RedemptionAction
export type PendingAction = {
  id: string
  deviceId: string
  sequence: number
  occurredAt: number
  action: Action
}
export type ActivityState = { patch: LocalDocument; complete: boolean }
export type OfflineState = {
  version: 1
  deviceId: string
  sequence: number
  documents: Record<CollectionName, Record<string, LocalDocument>>
  pending: PendingAction[]
  activities: Record<string, ActivityState>
  consumed: Record<string, boolean>
}
export const emptyState = (): OfflineState => ({
  version: 1,
  deviceId: crypto.randomUUID(),
  sequence: 0,
  documents: { children: {}, chores: {}, tests: {}, rewards: {} },
  pending: [],
  activities: {},
  consumed: {},
})
export const activityKey = (collection: string, id: string, dateKey: string) =>
  `${collection}/${id}/${dateKey}`
export const clampStars = (value: number) =>
  Math.max(0, Number.isFinite(value) ? value : 0)

// A child snapshot can arrive before the transaction response. Its per-device
// watermark prevents projecting that same pending credit/debit a second time.
export function reflectedByChild(
  document: LocalDocument | undefined,
  operation: PendingAction
) {
  const marks = document?.offlineDeviceSequences
  return (
    typeof marks === 'object' &&
    marks !== null &&
    Number(Reflect.get(marks, operation.deviceId) ?? 0) >= operation.sequence
  )
}

export function projectDocuments(
  state: OfflineState,
  collection: CollectionName
) {
  const result = { ...state.documents[collection] }
  for (const operation of state.pending) {
    const action = operation.action
    if (action.kind === 'document' && action.collection === collection) {
      if (
        collection === 'children' &&
        reflectedByChild(result[action.entityId], operation)
      )
        continue
      if (action.mode === 'delete') delete result[action.entityId]
      else
        result[action.entityId] = {
          ...(action.mode === 'patch' ? result[action.entityId] : {}),
          ...action.data,
        }
    } else if (collection === 'children' && action.kind !== 'document') {
      const child = result[action.childId]
      if (!child || reflectedByChild(child, operation)) continue
      const delta = action.kind === 'redeem' ? -action.cost : action.delta
      result[action.childId] = {
        ...child,
        totalStars: clampStars(Number(child.totalStars ?? 0) + delta),
      }
    }
  }
  return result
}

export function enqueue(
  state: OfflineState,
  action: Action,
  now = Date.now()
): PendingAction | null {
  if (action.kind !== 'document') {
    if (!projectDocuments(state, 'children')[action.childId])
      throw new Error('Child is not saved on this device yet.')
    const value = action.kind === 'redeem' ? action.cost : action.delta
    if (!Number.isFinite(value) || (action.kind === 'redeem' && value < 0))
      throw new Error('Invalid star amount.')
  }
  if (action.kind === 'activity') {
    const key = activityKey(action.collection, action.entityId, action.dateKey)
    const previous = state.activities[key]
    if (action.complete && previous?.complete && !action.reset) return null
    state.activities[key] = {
      patch: { ...previous?.patch, ...action.patch },
      complete: action.reset
        ? false
        : action.complete || previous?.complete || false,
    }
    if (action.consume && action.complete)
      state.consumed[`${action.collection}/${action.entityId}`] = true
  }
  if (action.kind === 'redeem' && action.consume) {
    const key = `rewards/${action.entityId}`
    if (state.consumed[key])
      throw new Error('This reward was already used on this device.')
    state.consumed[key] = true
  }
  const operation = {
    id: crypto.randomUUID(),
    deviceId: state.deviceId,
    sequence: ++state.sequence,
    occurredAt: now,
    action,
  }
  state.pending.push(operation)
  return operation
}
