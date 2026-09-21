import { z } from 'zod'
import {
  clampStars,
  collectionSchema,
  documentSchema,
  mergeActivity,
  recordData,
  starBalance,
  starDelta,
  type Action,
  type LocalDocument,
  type PendingAction,
} from './model'

export interface SyncTransaction {
  get: (path: string) => Promise<LocalDocument | undefined>
  set: (path: string, data: LocalDocument) => void
  delete: (path: string) => void
}
const receiptSchema = z.object({
  collection: collectionSchema,
  entityId: z.string(),
  document: documentSchema.nullable(),
})
export type SyncReceipt = z.infer<typeof receiptSchema>
export class SyncConflict extends Error {}

function stampBalance(
  document: LocalDocument,
  previous: LocalDocument | undefined,
  operation: PendingAction,
  totalStars = starBalance(document)
) {
  return {
    ...document,
    totalStars,
    offlineBalanceRevision: Number(previous?.offlineBalanceRevision ?? 0) + 1,
    offlineDeviceSequences: {
      ...recordData(previous?.offlineDeviceSequences),
      [operation.deviceId]: operation.sequence,
    },
  }
}

async function applyDocument(
  transaction: SyncTransaction,
  root: string,
  operation: PendingAction,
  action: Extract<Action, { kind: 'document' }>
): Promise<SyncReceipt> {
  const path = `${root}/${action.collection}/${action.entityId}`
  const previous = await transaction.get(path)
  if (action.mode === 'patch' && !previous)
    throw new SyncConflict(
      'This item was deleted on another device. Its pending edit needs attention.'
    )
  let document: LocalDocument | null = null
  if (action.mode === 'delete') transaction.delete(path)
  else {
    document = {
      ...(action.mode === 'patch' ? previous : {}),
      ...action.data,
      offlineRevision: Number(previous?.offlineRevision ?? 0) + 1,
    }
    if (action.collection === 'children')
      document = stampBalance(document, previous, operation)
    transaction.set(path, document)
  }
  return { collection: action.collection, entityId: action.entityId, document }
}

async function applyActivity(
  transaction: SyncTransaction,
  root: string,
  operation: PendingAction,
  action: Exclude<Action, { kind: 'document' }>
): Promise<SyncReceipt> {
  const path = `${root}/children/${action.childId}`
  const child = await transaction.get(path)
  if (!child)
    throw new SyncConflict(
      'This child was deleted on another device. Pending activities are kept on this device.'
    )
  const before = starBalance(child)
  const after = clampStars(before + starDelta(action))
  const audit = {
    childId: action.childId,
    deviceId: operation.deviceId,
    occurredAt: operation.occurredAt,
    createdAt: new Date(),
  }
  if (action.kind === 'redeem') {
    transaction.set(`${root}/redemptions/${operation.id}`, {
      ...audit,
      rewardId: action.entityId,
      rewardTitle: action.title,
      costStars: action.cost,
      chargedStars: before - after,
    })
  } else {
    const statePath = `${root}/deviceActivities/${operation.deviceId}_${action.collection}_${encodeURIComponent(action.entityId)}_${action.dateKey}`
    const previous = await transaction.get(statePath)
    transaction.set(statePath, {
      childId: action.childId,
      deviceId: operation.deviceId,
      taskId: action.entityId,
      collection: action.collection,
      dateKey: action.dateKey,
      ...mergeActivity(previous, action),
      consumed:
        (action.consume && action.complete) || previous?.consumed === true,
      sequence: operation.sequence,
    })
    if (action.complete)
      transaction.set(`${root}/starEvents/${operation.id}`, {
        ...audit,
        taskId: action.entityId,
        taskCollection: action.collection,
        dateKey: action.dateKey,
        delta: after - before,
      })
  }
  const document = stampBalance(child, child, operation, after)
  transaction.set(path, document)
  return { collection: 'children', entityId: action.childId, document }
}

// Receipt and business writes are atomic. A replay never repeats their effects.
export async function applyOperation(
  transaction: SyncTransaction,
  userId: string,
  operation: PendingAction
): Promise<SyncReceipt> {
  const root = `users/${userId}`
  const receiptPath = `${root}/syncReceipts/${operation.id}`
  const saved = await transaction.get(receiptPath)
  if (saved) return receiptSchema.parse(saved.result)
  const { action } = operation
  const result = await (action.kind === 'document'
    ? applyDocument(transaction, root, operation, action)
    : applyActivity(transaction, root, operation, action))
  transaction.set(receiptPath, {
    deviceId: operation.deviceId,
    sequence: operation.sequence,
    result,
  })
  return result
}
