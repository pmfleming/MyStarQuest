import seed from '../data/calendar/school-calendar.json'
import { snapshotStore } from './snapshotStore'
import { CALENDAR_REFRESH_MS } from './schoolCalendarCache'
import {
  fetchSchoolCalendar,
  parseCalendarSnapshot,
  readSavedSchoolCalendar,
  saveSchoolCalendar,
  type SchoolCalendarSnapshot,
} from './schoolCalendarData'
import { nativeSchoolCalendar } from './schoolCalendarNative'

const bundled = parseCalendarSnapshot(seed)
const newest = (saved?: SchoolCalendarSnapshot) =>
  saved && saved.checkedAt >= bundled.checkedAt ? saved : bundled

export function createSchoolCalendarStore(native = nativeSchoolCalendar) {
  const state = snapshotStore({
    ...newest(readSavedSchoolCalendar()),
    loadError: false,
  })
  let clients = 0
  let generation = 0
  let pending: Promise<void> | undefined
  let controller: AbortController | undefined
  let lastAttempt = 0
  let stop: (() => void) | undefined

  const accept = (next: SchoolCalendarSnapshot) => {
    if (next.checkedAt < state.getSnapshot().checkedAt) return
    saveSchoolCalendar(next)
    state.publish({ ...next, loadError: false })
  }

  const refresh = (force = false): Promise<void> => {
    if (pending) return pending
    const now = Date.now()
    if (
      navigator.onLine === false ||
      (!force && now >= lastAttempt && now - lastAttempt < 60_000)
    )
      return Promise.resolve()
    lastAttempt = now
    const currentGeneration = generation
    const request = new AbortController()
    controller = request
    const onAbort = () => rejectAbort(new Error('Calendar request interrupted'))
    let rejectAbort: (reason: Error) => void
    const aborted = new Promise<never>((_resolve, reject) => {
      rejectAbort = reject
      request.signal.addEventListener('abort', onAbort, { once: true })
    })
    const timeout = setTimeout(() => request.abort(), native ? 35_000 : 15_000)
    pending = (async () => {
      try {
        const next = await Promise.race([
          native ? native.refresh() : fetchSchoolCalendar(request.signal),
          aborted,
        ])
        if (generation === currentGeneration && !request.signal.aborted)
          accept(next)
      } catch {
        if (generation === currentGeneration)
          state.publish({ ...state.getSnapshot(), loadError: true })
      } finally {
        clearTimeout(timeout)
        request.signal.removeEventListener('abort', onAbort)
        if (generation === currentGeneration) {
          controller = undefined
          pending = undefined
        }
      }
    })()
    return pending
  }

  const start = () => {
    clients++
    if (clients === 1 && !stop) {
      const currentGeneration = ++generation
      // Re-read disk when returning to the calendar, including legacy cache migration.
      accept(newest(readSavedSchoolCalendar()))
      let removeNativeListener: (() => void) | undefined
      const readNative = async () => {
        try {
          const next = await native?.read()
          if (next && generation === currentGeneration) accept(next)
        } catch {
          /* Use the synchronous local or bundled copy. */
        }
      }
      if (native) {
        void native
          .subscribe((next) => {
            if (generation === currentGeneration) accept(next)
          })
          .then((remove) => {
            if (generation === currentGeneration) removeNativeListener = remove
            else remove()
          })
          .catch(() => {
            /* Resume still reads the native snapshot. */
          })
      }
      void readNative()
      void refresh(true)
      const wake = () => {
        if (document.visibilityState !== 'hidden') {
          void readNative()
          void refresh()
        }
      }
      const online = () => {
        void refresh(true)
      }
      const interval = setInterval(wake, CALENDAR_REFRESH_MS)
      window.addEventListener('online', online)
      document.addEventListener('visibilitychange', wake)
      stop = () => {
        generation++
        clearInterval(interval)
        window.removeEventListener('online', online)
        document.removeEventListener('visibilitychange', wake)
        removeNativeListener?.()
        controller?.abort()
        controller = undefined
        pending = undefined
      }
    }
    let released = false
    return () => {
      if (released) return
      released = true
      clients--
      // StrictMode immediately subscribes again: keep the same request/listeners.
      queueMicrotask(() => {
        if (!clients) {
          stop?.()
          stop = undefined
        }
      })
    }
  }

  return { ...state, start, refresh }
}

export const schoolCalendarStore = createSchoolCalendarStore()
