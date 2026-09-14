import {
  clampStars,
  type LocalDocument,
  type PendingAction,
  type CollectionName,
} from './model'

export interface SyncTransaction {
  get: (path: string) => Promise<LocalDocument | undefined>
  set: (path: string, data: LocalDocument) => void
  delete: (path: string) => void
}
export type SyncReceipt = {
  collection: CollectionName
  entityId: string
  document: LocalDocument | null
}
export class SyncConflict extends Error {}

// Every receipt and business write commits together. If the response is lost,
// the same action ID returns its receipt without applying any second effect.
export async function applyOperation(
  transaction: SyncTransaction,
  userId: string,
  operation: PendingAction
): Promise<SyncReceipt> {
  const root = `users/${userId}`
  const receiptPath = `${root}/syncReceipts/${operation.id}`
  const saved = await transaction.get(receiptPath)
  if (saved) return saved.result as SyncReceipt
  const { action } = operation
  let result: SyncReceipt
  if (action.kind === 'document') {
    const path = `${root}/${action.collection}/${action.entityId}`
    const previous = await transaction.get(path)
    if (action.mode === 'patch' && !previous)
      throw new SyncConflict(
        'This item was deleted on another device. Its pending edit needs attention.'
      )
    const document: LocalDocument | null =
      action.mode === 'delete'
        ? null
        : {
            ...(action.mode === 'patch' ? previous : {}),
            ...action.data,
            offlineRevision: Number(previous?.offlineRevision ?? 0) + 1,
          }
    if (document && action.collection === 'children') {
      document.totalStars = clampStars(Number(document.totalStars ?? 0))
      document.offlineBalanceRevision =
        Number(previous?.offlineBalanceRevision ?? 0) + 1
      document.offlineDeviceSequences = {
        ...asRecord(previous?.offlineDeviceSequences),
        [operation.deviceId]: operation.sequence,
      }
    }
    if (document) transaction.set(path, document)
    else transaction.delete(path)
    result = {
      collection: action.collection,
      entityId: action.entityId,
      document,
    }
  } else {
    const childPath = `${root}/children/${action.childId}`
    const child = await transaction.get(childPath)
    if (!child)
      throw new SyncConflict(
        'This child was deleted on another device. Pending activities are kept on this phone.'
      )
    const currentStars = clampStars(Number(child.totalStars ?? 0))
    const delta = action.kind === 'redeem' ? -action.cost : action.delta
    const after = clampStars(currentStars + delta)
    const nextChild = {
      ...child,
      totalStars: after,
      offlineBalanceRevision: Number(child.offlineBalanceRevision ?? 0) + 1,
      offlineDeviceSequences: {
        ...asRecord(child.offlineDeviceSequences),
        [operation.deviceId]: operation.sequence,
      },
    }
    if (action.kind === 'activity') {
      const statePath = `${root}/deviceActivities/${operation.deviceId}_${action.collection}_${encodeURIComponent(action.entityId)}_${action.dateKey}`
      const previous = await transaction.get(statePath)
      transaction.set(statePath, {
        childId: action.childId,
        deviceId: operation.deviceId,
        taskId: action.entityId,
        collection: action.collection,
        dateKey: action.dateKey,
        patch: { ...asRecord(previous?.patch), ...action.patch },
        complete: action.reset
          ? false
          : action.complete || previous?.complete === true,
        consumed:
          (action.consume && action.complete) || previous?.consumed === true,
        sequence: operation.sequence,
      })
      if (action.complete)
        transaction.set(`${root}/starEvents/${operation.id}`, {
          childId: action.childId,
          taskId: action.entityId,
          taskCollection: action.collection,
          dateKey: action.dateKey,
          deviceId: operation.deviceId,
          delta: after - currentStars,
          occurredAt: operation.occurredAt,
          createdAt: new Date(),
        })
    } else {
      transaction.set(`${root}/redemptions/${operation.id}`, {
        childId: action.childId,
        rewardId: action.entityId,
        rewardTitle: action.title,
        costStars: action.cost,
        chargedStars: currentStars - after,
        deviceId: operation.deviceId,
        occurredAt: operation.occurredAt,
        createdAt: new Date(),
      })
    }
    transaction.set(childPath, nextChild)
    result = {
      collection: 'children',
      entityId: action.childId,
      document: nextChild,
    }
  }
  transaction.set(receiptPath, {
    deviceId: operation.deviceId,
    sequence: operation.sequence,
    result,
  })
  return result
}

function asRecord(value: unknown): LocalDocument {
  return typeof value === 'object' && value !== null
    ? (value as LocalDocument)
    : {}
}
