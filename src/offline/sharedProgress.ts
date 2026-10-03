import { progressKey } from '../../functions/src/sharing/protocol'
import { activityKey, type OfflineState, type LocalDocument } from './model'

export function projectedSharedProgress(state: OfflineState) {
  const progress = { ...state.sharedProgress }
  for (const operation of state.pending) {
    const action = operation.action
    if (action.kind !== 'activity') continue
    const key = progressKey(action.collection, action.entityId, action.dateKey)
    const previous = progress[key]
    const child = state.documents.children[action.childId]
    const sequences = child?.offlineDeviceSequences as
      Record<string, number> | undefined
    if ((sequences?.[operation.deviceId] ?? 0) >= operation.sequence) continue
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
        : { ...((previous?.patch as object) ?? {}), ...action.patch },
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
      patch: (progress.patch ?? {}) as LocalDocument,
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
