import { getTodayDescriptor } from '../lib/today'
import { manageCompletedAtFieldByType, taskTypeSchema } from '../data/types'
import {
  activityKey,
  type CollectionName,
  type LocalDocument,
  type OfflineState,
} from './model'

function testProgress(
  data: LocalDocument,
  patch: LocalDocument,
  today: string
) {
  if (data.lastAttemptDateKey !== today) return
  const complete = data.lastAttemptOutcome === 'success'
  const type = taskTypeSchema.safeParse(data.taskType)
  if (type.success)
    patch[manageCompletedAtFieldByType[type.data]] = complete
      ? data.lastAttemptedAt
      : null
  return {
    patch: {
      ...patch,
      lastAttemptDateKey: today,
      lastAttemptedAt: data.lastAttemptedAt,
      lastAttemptOutcome: data.lastAttemptOutcome,
    },
    complete,
  }
}

function choreProgress(patch: LocalDocument, today: string) {
  let complete = false
  for (const [field, value] of Object.entries(patch)) {
    if (!field.endsWith('At') || typeof value !== 'number') continue
    const date = new Date(value)
    if (
      !Number.isFinite(date.getTime()) ||
      getTodayDescriptor(date).dateKey !== today
    )
      return
    complete ||= field.endsWith('CompletedAt') && value > 0
  }
  return { patch, complete }
}

// Preserve the existing website's progress when it first adopts durable actions.
// Subsequent snapshots must not overwrite this device's completions or resets.
export function importWebProgress(
  state: OfflineState,
  collection: CollectionName,
  documents: Record<string, LocalDocument>
) {
  if (collection !== 'chores' && collection !== 'tests') return
  if (state.importedWebCollections?.includes(collection)) return
  state.importedWebCollections = [
    ...(state.importedWebCollections ?? []),
    collection,
  ]
  const today = getTodayDescriptor().dateKey
  for (const [id, data] of Object.entries(documents)) {
    const key = activityKey(collection, id, today)
    if (state.activities[key]) continue
    const patch = Object.fromEntries(
      Object.entries(data).filter(([field]) => field.startsWith('manage'))
    )
    const progress =
      collection === 'tests'
        ? testProgress(data, patch, today)
        : choreProgress(patch, today)
    if (progress) state.activities[key] = progress
  }
}
