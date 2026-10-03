import { z } from 'zod'
import { progressKey } from '../../functions/src/sharing/protocol'

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
    generation: z.number().int().nonnegative().optional(),
    revision: z.number().int().nonnegative().optional(),
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
  importedWebCollections: z.array(collectionSchema).optional(),
  shared: z.boolean().optional(),
  sharedProgress: z.record(z.string(), documentSchema).optional(),
  revoked: z.boolean().optional(),
  rejected: z
    .array(z.object({ id: z.string(), message: z.string() }))
    .optional(),
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
  const targetCollection =
    action.kind === 'document' ? action.collection : 'children'
  if (collection !== targetCollection) return
  const id = action.kind === 'document' ? action.entityId : action.childId
  const current = documents[id]
  if (collection === 'children' && reflectedByChild(current, operation)) return

  if (action.kind !== 'document') {
    if (current)
      documents[id] = {
        ...current,
        totalStars: clampStars(starBalance(current) + starDelta(action)),
      }
  } else if (action.mode === 'delete') delete documents[id]
  else
    documents[id] = {
      ...(action.mode === 'patch' ? current : {}),
      ...action.data,
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
  if (state.revoked) throw new Error('Access to this child has ended.')
  if (state.shared && action.kind === 'activity') {
    const previous =
      projectedSharedProgress(state)[
        progressKey(action.collection, action.entityId, action.dateKey)
      ]
    action = {
      ...action,
      generation: Number(previous?.generation ?? 0),
      revision: Number(previous?.revision ?? 0),
    }
  }
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

function projectedSharedProgress(state: OfflineState) {
  const progress = { ...state.sharedProgress }
  for (const operation of state.pending) {
    const action = operation.action
    if (action.kind !== 'activity') continue
    const key = progressKey(action.collection, action.entityId, action.dateKey)
    const previous = progress[key]
    if (reflectedByChild(state.documents.children[action.childId], operation))
      continue
    if (action.generation !== Number(previous?.generation ?? 0)) continue
    if (Number(action.revision ?? 0) < Number(previous?.revision ?? 0)) continue
    progress[key] = {
      ...previous,
      collection: action.collection,
      entityId: action.entityId,
      dateKey: action.dateKey,
      generation: Number(previous?.generation ?? 0) + (action.reset ? 1 : 0),
      revision: Number(previous?.revision ?? 0) + 1,
      patch: action.reset
        ? {}
        : { ...recordData(previous?.patch), ...action.patch },
      complete:
        !action.reset && (action.complete || previous?.complete === true),
      consumed:
        !action.reset &&
        (previous?.consumed === true || (action.consume && action.complete)),
    }
  }
  return progress
}

export function rebuildSharedProgress(state: OfflineState) {
  if (!state.shared) return
  state.activities = {}
  state.consumed = {}
  for (const progress of Object.values(projectedSharedProgress(state))) {
    const collection = String(progress.collection),
      entityId = String(progress.entityId),
      dateKey = String(progress.dateKey)
    state.activities[activityKey(collection, entityId, dateKey)] = {
      patch: recordData(progress.patch),
      complete: progress.complete === true,
    }
    if (progress.consumed) state.consumed[`${collection}/${entityId}`] = true
  }
  for (const operation of state.pending)
    if (operation.action.kind === 'redeem' && operation.action.consume)
      state.consumed[`rewards/${operation.action.entityId}`] = true
}

export function mergeSharedProgress(
  state: OfflineState,
  documents: Record<string, LocalDocument>
) {
  state.sharedProgress = Object.fromEntries(
    Object.entries(documents).map(([key, document]) => {
      const previous = state.sharedProgress?.[key]
      return [
        key,
        previous &&
        Number(previous.revision ?? 0) > Number(document.revision ?? 0)
          ? previous
          : document,
      ]
    })
  )
  rebuildSharedProgress(state)
}
