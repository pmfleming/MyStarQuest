import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import seed from '../../src/data/calendar/school-calendar.json'
import {
  CALENDAR_REFRESH_MS,
  SNAPSHOT_KEY,
} from '../../src/lib/schoolCalendarCache'
import {
  readSavedSchoolCalendar,
  type SchoolCalendarSnapshot,
} from '../../src/lib/schoolCalendarData'
import { createSchoolCalendarStore } from '../../src/lib/schoolCalendarStore'

const original = {
  '2026-09-29': {
    isNonSchoolDay: true,
    summaries: ['Studiedag (leerlingen vrij)'],
  },
}
const changed = {
  '2026-10-01': { isNonSchoolDay: false, summaries: ['Schoolfotograaf'] },
}
const response = (data: unknown) =>
  ({ ok: true, json: async () => data }) as Response
const stops: (() => void)[] = []
const saved = (): SchoolCalendarSnapshot => ({
  data: original,
  checkedAt: seed.checkedAt + 1000,
})

it('recovers a stalled native refresh, ignores older results and accepts background updates', async () => {
  let finish!: (value: SchoolCalendarSnapshot) => void
  let finishRead!: (value: SchoolCalendarSnapshot) => void
  let deliver!: (value: SchoolCalendarSnapshot) => void
  const remove = vi.fn()
  const refresh = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<SchoolCalendarSnapshot>((resolve) => {
          finish = resolve
        })
    )
    .mockResolvedValue({ data: changed, checkedAt: Date.now() })
  const store = createSchoolCalendarStore({
    refresh,
    read: () =>
      new Promise((resolve) => {
        finishRead = resolve
      }),
    subscribe: async (listener) => {
      deliver = listener
      return remove
    },
  })
  const stop = store.start()
  const pending = store.refresh(true)
  await vi.advanceTimersByTimeAsync(35_000)
  await pending
  expect(store.getSnapshot().loadError).toBe(true)
  await store.refresh(true)
  expect(store.getSnapshot().data).toEqual(changed)
  finish(saved())
  finishRead(saved())
  await Promise.resolve()
  expect(store.getSnapshot().data).toEqual(changed)
  deliver({ data: original, checkedAt: Date.now() + 1000 })
  expect(store.getSnapshot().data).toEqual(original)
  expect(readSavedSchoolCalendar()?.data).toEqual(original)
  expect(fetch).not.toHaveBeenCalled()
  stop()
  await Promise.resolve()
  expect(remove).toHaveBeenCalledOnce()
})

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'Date',
    ],
  })
  vi.setSystemTime(seed.checkedAt + CALENDAR_REFRESH_MS * 2)
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(changed)))
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
})
afterEach(async () => {
  stops.splice(0).forEach((stop) => stop())
  await Promise.resolve()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

it('shows saved data during refresh, persists deletions and survives an invalid response', async () => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(saved()))
  let resolve!: (value: Response) => void
  vi.mocked(fetch).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  const store = createSchoolCalendarStore()
  stops.push(store.start())
  expect(store.getSnapshot().data).toEqual(original)
  resolve(response(changed))
  await store.refresh()
  expect(store.getSnapshot().data).toEqual(changed)
  expect(readSavedSchoolCalendar()?.data).toEqual(changed)
  // A new process/store reads the durable replacement, not the removed date.
  expect(createSchoolCalendarStore().getSnapshot().data).toEqual(changed)
  const accepted = readSavedSchoolCalendar()
  vi.mocked(fetch).mockResolvedValue(response({ error: 'unavailable' }))
  await store.refresh(true)
  expect(store.getSnapshot()).toMatchObject({ ...accepted, loadError: true })
  expect(readSavedSchoolCalendar()).toEqual(accepted)
})
