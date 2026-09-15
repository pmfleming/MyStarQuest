import {
  activityKey,
  projectDocuments,
  type CollectionName,
  type LocalDocument,
  type OfflineState,
} from './model'

export function deviceDocuments(
  state: OfflineState,
  collection: CollectionName,
  dateKey: string
) {
  const documents = projectDocuments(state, collection)
  const result: Record<string, LocalDocument> = {}
  for (const [id, document] of Object.entries(documents)) {
    if (collection !== 'tests' && state.consumed[`${collection}/${id}`])
      continue
    if (collection !== 'chores' && collection !== 'tests') {
      result[id] = document
      continue
    }
    // Definitions are shared. Progress is exclusively this device's current day,
    // independent of midnight cloud jobs and other devices' completion fields.
    const clean = Object.fromEntries(
      Object.entries(document).filter(([key]) => !key.startsWith('manage'))
    )
    result[id] = {
      ...clean,
      lastAttemptedAt: null,
      lastAttemptDateKey: '',
      lastAttemptOutcome: null,
      manageCompletedAt: null,
      manageDinnerRemainingSeconds: document.dinnerDurationSeconds ?? 600,
      manageDinnerBitesLeft: document.dinnerTotalBites ?? 2,
      manageDinnerTimerStartedAt: null,
      manageDinnerCompletedAt: null,
      manageWaterLevel: 'full',
      manageToiletStatus: 'notpeepee',
      manageWaterToiletCompletedAt: null,
      ...state.activities[activityKey(collection, id, dateKey)]?.patch,
    }
  }
  return result
}
