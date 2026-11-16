import type { HistoryCollection, LocalDocument, OfflineState } from './model'
import { historyRange, type HistoryPeriod } from '../lib/calendarHistory'

const DAY_MS = 86_400_000
export type HistoryWindow = { start: number; end: number; childId?: string }
export function retainHistoryDocument(
  data: LocalDocument,
  window?: HistoryWindow,
  now = Date.now()
) {
  const value = data.dateKey ?? data.occurredAt ?? data.createdAt
  const time =
    value instanceof Date
      ? value.getTime()
      : typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Date.parse(value)
          : NaN
  return (
    !Number.isFinite(time) ||
    time >= now - 90 * DAY_MS ||
    !!(window && time >= window.start && time < window.end)
  )
}
export function calendarHistoryWindow(
  dateKey: string,
  period: HistoryPeriod
): HistoryWindow {
  const { start, end } = historyRange(
    dateKey,
    period === 'year' ? 'year' : 'month'
  )
  // Cover adjacent week days and every supported timezone without DST arithmetic.
  return {
    start: Date.parse(start) - 7 * DAY_MS,
    end: Date.parse(end) + 8 * DAY_MS,
  }
}
export function rememberRedemptions(
  state: OfflineState,
  documents: Record<string, LocalDocument>
) {
  let changed = false
  for (const redemption of Object.values(documents)) {
    const id = redemption.rewardId
    if (
      typeof id !== 'string' ||
      redemption.consume === false ||
      state.redeemedRewards?.[id]
    )
      continue
    state.redeemedRewards ??= {}
    state.redeemedRewards[id] = true
    changed = true
  }
  return changed
}
export function pruneHistory(state: OfflineState, now = Date.now()) {
  let changed = rememberRedemptions(state, state.history?.redemptions ?? {})
  for (const [name, documents] of Object.entries(state.history ?? {})) {
    const window = state.historyWindows?.[name as HistoryCollection]
    for (const [id, data] of Object.entries(documents)) {
      // Unrecognised legacy dates are retained rather than silently discarded.
      if (retainHistoryDocument(data, window, now)) continue
      delete documents[id]
      changed = true
    }
  }
  return changed
}
