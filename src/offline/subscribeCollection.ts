import { subscribeDayChange } from '../lib/dayChange'
import { snapshotDocument } from './firebaseTransport'
import { subscribeHistoryWindow } from './historyQueries'
import type { HistoryWindow } from './historyRetention'
import type { ReadCollection } from './model'
import { offlineRuntime } from './runtime'

type Documents = ReturnType<ReturnType<typeof offlineRuntime>['documents']>
export function subscribeOfflineCollection({
  userId,
  collectionName,
  historyWindow,
  receive,
  onError,
}: {
  userId: string
  collectionName: ReadCollection
  historyWindow?: HistoryWindow
  receive: (documents: Documents, ready: boolean) => void
  onError?: (error: unknown) => void
}) {
  const runtime = offlineRuntime(userId)
  const historyName =
    collectionName === 'starEvents' || collectionName === 'redemptions'
      ? collectionName
      : undefined
  const window = historyName ? historyWindow : undefined
  let disposed = false
  let previousDocuments: Documents | undefined
  let previousHistory: Documents | undefined
  // Keep the mounted reader's period even if another tab replaces the disk cache.
  let retainedHistory: Documents | undefined
  let stopHistory: (() => void) | undefined
  const publish = () => {
    if (disposed) return
    const state = runtime.store.getSnapshot()
    const documents = runtime.documents(collectionName)
    if (state?.revoked) retainedHistory = undefined
    const saved = historyName
      ? runtime.store.getSnapshot()?.historyWindows?.[historyName]
      : undefined
    if (
      !state?.revoked &&
      !retainedHistory &&
      window &&
      saved &&
      saved.childId === window.childId &&
      saved.start <= window.start &&
      saved.end >= window.end
    )
      retainedHistory = documents
    if (documents === previousDocuments && retainedHistory === previousHistory)
      return
    previousDocuments = documents
    previousHistory = retainedHistory
    receive(
      retainedHistory
        ? [
            ...new Map(
              [...retainedHistory, ...documents].map((doc) => [doc.id, doc])
            ).values(),
          ]
        : documents,
      state?.revoked === true || !window || retainedHistory !== undefined
    )
  }
  const report = (error: unknown) => {
    if (!disposed) onError?.(error)
  }
  const unsubscribeErrors = runtime.subscribeErrors(() => {
    const error = runtime.getError()
    if (error) report(error)
  })
  const unsubscribe = runtime.store.subscribe(publish)
  void runtime.store
    .open()
    .then(() => {
      publish()
      if (disposed || !historyName || !window) return
      if (!retainedHistory && navigator.onLine === false)
        report(new Error('Connect to load history for this period.'))
      stopHistory = subscribeHistoryWindow(
        userId,
        historyName,
        window,
        (documents, fromCache) => {
          if (disposed || fromCache || runtime.store.getSnapshot()?.revoked)
            return
          retainedHistory = Object.entries(documents).map(([id, data]) => ({
            id,
            data: snapshotDocument(data),
          }))
          void runtime.store
            .mergeHistory(historyName, documents, window)
            .then(publish)
            .catch(report)
        },
        report,
        window.childId
      )
    })
    .catch(report)
  const stopDay =
    collectionName === 'chores' || collectionName === 'tests'
      ? subscribeDayChange(runtime.dateKey, publish)
      : undefined
  return () => {
    disposed = true
    unsubscribe()
    unsubscribeErrors()
    stopDay?.()
    stopHistory?.()
  }
}
