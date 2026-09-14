import { z } from 'zod'

export const collectionSchema = z.enum([
  'children',
  'chores',
  'tests',
  'rewards',
])
export const collections = collectionSchema.options
export type CollectionName = z.infer<typeof collectionSchema>
export const documentSchema = z.record(z.string(), z.unknown())
export type LocalDocument = z.infer<typeof documentSchema>
const activitySchema = z.object({
  patch: documentSchema,
  complete: z.boolean(),
})
const entityId = z.string().min(1)
const actionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('document'),
    collection: collectionSchema,
    entityId,
    mode: z.enum(['put', 'patch', 'delete']),
    data: documentSchema,
  }),
  z.object({
    kind: z.literal('activity'),
    collection: z.enum(['chores', 'tests']),
    entityId,
    childId: entityId,
    dateKey: z.string(),
    patch: documentSchema,
    delta: z.number().finite(),
    complete: z.boolean(),
    reset: z.boolean(),
    consume: z.boolean(),
  }),
  z.object({
    kind: z.literal('redeem'),
    entityId,
    childId: entityId,
    title: z.string(),
    cost: z.number().finite().nonnegative(),
    consume: z.boolean(),
  }),
])
export const offlineStateSchema = z.object({
  version: z.literal(1),
  deviceId: entityId,
  sequence: z.number().int().nonnegative(),
  documents: z.record(collectionSchema, z.record(z.string(), documentSchema)),
  pending: z.array(
    z.object({
      id: entityId,
      deviceId: entityId,
      sequence: z.number().int().positive(),
      occurredAt: z.number().finite(),
      action: actionSchema,
    })
  ),
  activities: z.record(z.string(), activitySchema),
  consumed: z.record(z.string(), z.boolean()),
})
export type Action = z.infer<typeof actionSchema>
export type OfflineState = z.infer<typeof offlineStateSchema>
export type PendingAction = OfflineState['pending'][number]
type ActivityAction = Extract<Action, { kind: 'activity' }>
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
export const starDelta = (action: Exclude<Action, { kind: 'document' }>) =>
  action.kind === 'redeem' ? -action.cost : action.delta
export const starBalance = (child: LocalDocument) =>
  clampStars(Number(child.totalStars ?? 0))
const isRecord = (value: unknown): value is LocalDocument =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
export const recordData = (value: unknown): LocalDocument =>
  isRecord(value) ? value : {}

export function mergeActivity(
  previous: LocalDocument | undefined,
  action: ActivityAction
) {
  return {
    patch: { ...recordData(previous?.patch), ...action.patch },
    complete: !action.reset && (action.complete || previous?.complete === true),
  }
}

export function latestDocument(
  collection: CollectionName,
  previous: LocalDocument | undefined,
  incoming: LocalDocument
) {
  const revision =
    collection === 'children' ? 'offlineBalanceRevision' : 'offlineRevision'
  return Number(previous?.[revision] ?? 0) > Number(incoming[revision] ?? 0)
    ? (previous ?? incoming)
    : incoming
}

// A snapshot may precede its receipt. Skip effects already in that snapshot.
function reflectedByChild(
  document: LocalDocument | undefined,
  operation: PendingAction
) {
  return (
    Number(
      recordData(document?.offlineDeviceSequences)[operation.deviceId] ?? 0
    ) >= operation.sequence
  )
}

function projectOperation(
  documents: Record<string, LocalDocument>,
  collection: CollectionName,
  operation: PendingAction
) {
  const { action } = operation
  if (action.kind === 'document') {
    if (action.collection !== collection) return
    if (
      collection === 'children' &&
      reflectedByChild(documents[action.entityId], operation)
    )
      return
    if (action.mode === 'delete') delete documents[action.entityId]
    else
      documents[action.entityId] = {
        ...(action.mode === 'patch' ? documents[action.entityId] : {}),
        ...action.data,
      }
    return
  }
  if (collection !== 'children') return
  const child = documents[action.childId]
  if (child && !reflectedByChild(child, operation))
    documents[action.childId] = {
      ...child,
      totalStars: clampStars(starBalance(child) + starDelta(action)),
    }
}

export function projectDocuments(
  state: OfflineState,
  collection: CollectionName
) {
  const documents = { ...state.documents[collection] }
  state.pending.forEach((operation) =>
    projectOperation(documents, collection, operation)
  )
  return documents
}

export function enqueue(
  state: OfflineState,
  action: Action,
  now = Date.now()
): PendingAction | null {
  if (
    action.kind !== 'document' &&
    !projectDocuments(state, 'children')[action.childId]
  )
    throw new Error('Child is not saved on this device yet.')
  actionSchema.parse(action)
  if (action.kind === 'activity') {
    const key = activityKey(action.collection, action.entityId, action.dateKey)
    const previous = state.activities[key]
    if (action.complete && previous?.complete && !action.reset) return null
    state.activities[key] = mergeActivity(previous, action)
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
