import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createSchoolCalendarStore } from '../../src/lib/schoolCalendarStore'
import {
  CALENDAR_REFRESH_MS,
  SNAPSHOT_KEY,
} from '../../src/lib/schoolCalendarCache'
import {
  readSavedSchoolCalendar,
  type SchoolCalendarSnapshot,
} from '../../src/lib/schoolCalendarData'
import seed from '../../src/data/calendar/school-calendar.json'

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

it('releases a stalled native refresh and accepts a later retry without late overwrite', async () => {
  let finish!: (value: SchoolCalendarSnapshot) => void
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
    read: async () => saved(),
    subscribe: async () => () => {},
  })
  const pending = store.refresh(true)
  await vi.advanceTimersByTimeAsync(35_000)
  await pending
  expect(store.getSnapshot().loadError).toBe(true)
  await store.refresh(true)
  expect(store.getSnapshot().data).toEqual(changed)
  finish(saved())
  await Promise.resolve()
  expect(store.getSnapshot().data).toEqual(changed)
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

it('has a bundled calendar on a first-ever offline launch', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  const store = createSchoolCalendarStore()
  expect(Object.keys(store.getSnapshot().data).length).toBeGreaterThan(100)
  expect(store.getSnapshot().data['2026-09-29']?.isNonSchoolDay).toBe(true)
  stops.push(store.start())
  await store.refresh()
  expect(fetch).not.toHaveBeenCalled()
})

it('shows the saved copy immediately while a refresh is pending, then replaces it including deletions', async () => {
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
})

it('retains the saved snapshot and check time after a schema failure', async () => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(saved()))
  vi.mocked(fetch).mockResolvedValue(response({ error: 'unavailable' }))
  const store = createSchoolCalendarStore()
  stops.push(store.start())
  await store.refresh()
  expect(store.getSnapshot()).toMatchObject({ ...saved(), loadError: true })
  expect(readSavedSchoolCalendar()).toEqual(saved())
})

it('receives native background updates and ignores an older native read', async () => {
  let deliver!: (value: SchoolCalendarSnapshot) => void
  let finishRead!: (value: SchoolCalendarSnapshot) => void
  const remove = vi.fn()
  const native = {
    read: vi.fn(
      () =>
        new Promise<SchoolCalendarSnapshot>((resolve) => {
          finishRead = resolve
        })
    ),
    refresh: vi
      .fn()
      .mockResolvedValue({ data: changed, checkedAt: Date.now() }),
    subscribe: vi.fn(async (listener: typeof deliver) => {
      deliver = listener
      return remove
    }),
  }
  const store = createSchoolCalendarStore(native)
  const stop = store.start()
  await store.refresh()
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

it('keeps fresh data in memory even when local storage cannot be written', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Full')
  })
  const store = createSchoolCalendarStore()
  stops.push(store.start())
  await store.refresh()
  expect(store.getSnapshot().data).toEqual(changed)
  expect(store.getSnapshot().loadError).toBe(false)
})

it('aborts a stalled web request and permits another update', async () => {
  vi.mocked(fetch).mockImplementationOnce(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options!.signal!.addEventListener('abort', () =>
          reject(new Error('Timeout'))
        )
      })
  )
  const store = createSchoolCalendarStore()
  stops.push(store.start())
  await vi.advanceTimersByTimeAsync(15_000)
  expect(store.getSnapshot().loadError).toBe(true)
  await store.refresh(true)
  expect(store.getSnapshot().data).toEqual(changed)
})
