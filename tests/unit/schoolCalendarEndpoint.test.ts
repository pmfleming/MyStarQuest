// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { fetchSchoolCalendarText } from '../../functions/src/schoolCalendar'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('times out when headers arrive but the calendar body stalls', async () => {
  vi.useFakeTimers()
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((milliseconds) => {
    const controller = new AbortController()
    setTimeout(
      () => controller.abort(new DOMException('Timed out', 'TimeoutError')),
      milliseconds
    )
    return controller.signal
  })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, { signal }: RequestInit) => ({
      ok: true,
      text: () =>
        new Promise((_resolve, reject) =>
          signal?.addEventListener('abort', () => reject(signal.reason))
        ),
    }))
  )
  const request = expect(
    fetchSchoolCalendarText('https://calendar.example/school.ics')
  ).rejects.toMatchObject({ name: 'TimeoutError' })
  await vi.advanceTimersByTimeAsync(8000)
  await request
})
