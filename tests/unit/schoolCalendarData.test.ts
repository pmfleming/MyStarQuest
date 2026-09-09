import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { loadSchoolCalendar } from '../../src/lib/schoolCalendarData'
import { CACHE_KEY, CACHE_TS_KEY } from '../../src/lib/schoolCalendarCache'

const events = { '2026-09-09': { isNonSchoolDay: true } }
const request = () => loadSchoolCalendar(new AbortController().signal)
const response = (value: unknown) => ({ ok: true, json: async () => value })

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('uses a valid fresh cache without fetching', async () => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(events))
  localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  expect(await request()).toEqual(events)
  expect(fetch).not.toHaveBeenCalled()
})

it('replaces invalid cached data and still returns valid events when cache writes fail', async () => {
  localStorage.setItem(CACHE_KEY, 'null')
  localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  vi.mocked(fetch).mockResolvedValue(response(events) as Response)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Quota exceeded')
  })
  expect(await request()).toEqual(events)
  expect(fetch).toHaveBeenCalledOnce()
})

it('rejects an invalid response without caching it and allows a later retry', async () => {
  vi.mocked(fetch)
    .mockResolvedValueOnce(
      response({ '2026-09-09': { isNonSchoolDay: 'false' } }) as Response
    )
    .mockResolvedValueOnce(response(events) as Response)
  await expect(request()).rejects.toThrow()
  expect(localStorage.getItem(CACHE_KEY)).toBeNull()
  expect(await request()).toEqual(events)
  expect(JSON.parse(localStorage.getItem(CACHE_KEY)!)).toEqual(events)
})

it('does not cache a response that completes after cancellation', async () => {
  let resolveBody!: (value: unknown) => void
  const body = new Promise((resolve) => {
    resolveBody = resolve
  })
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => body } as Response)
  const controller = new AbortController()
  const pending = loadSchoolCalendar(controller.signal)
  controller.abort()
  resolveBody(events)
  await expect(pending).rejects.toThrow()
  expect(localStorage.getItem(CACHE_KEY)).toBeNull()
})
