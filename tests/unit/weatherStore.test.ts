import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXPLORER_CITY_OPTIONS } from '../../src/features/dayNightExplorer/dayNightExplorerOptions'

const amsterdam = EXPLORER_CITY_OPTIONS[0]!
const dublin = EXPLORER_CITY_OPTIONS[1]!
let store: typeof import('../../src/lib/weather/weatherStore')
const cleanup: (() => void)[] = []
const response = (temperature = 18) => ({
  ok: true,
  json: async () => ({
    current: {
      time: Date.now() / 1000,
      temperature_2m: temperature,
      weather_code: 0,
      is_day: 1,
    },
  }),
})

beforeEach(async () => {
  localStorage.clear()
  vi.useFakeTimers().setSystemTime(new Date('2026-09-13T12:00:00Z'))
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.resetModules()
  store = await import('../../src/lib/weather/weatherStore')
})
afterEach(async () => {
  cleanup.splice(0).forEach((fn) => fn())
  await Promise.resolve()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('weather cache and subscriptions', () => {
  it('isolates city requests and recovers stale data before it expires', async () => {
    let resolveAmsterdam!: (value: unknown) => void
    const fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAmsterdam = resolve
          })
      )
      .mockResolvedValue(response(10))
    vi.stubGlobal('fetch', fetch)
    const off = store.subscribeWeather(amsterdam, vi.fn())
    off()
    cleanup.push(store.subscribeWeather(dublin, vi.fn()))
    await vi.advanceTimersByTimeAsync(0)
    expect(fetch.mock.calls[0]![1].signal.aborted).toBe(true)
    resolveAmsterdam(response(30))
    await vi.advanceTimersByTimeAsync(0)
    expect(store.getWeatherSnapshot(dublin).data?.temperature).toBe(10)
    expect(store.getWeatherSnapshot(amsterdam).data).toBeNull()
    fetch.mockRejectedValue(new Error('offline'))
    await vi.advanceTimersByTimeAsync(15 * 60_000)
    expect(store.getWeatherSnapshot(dublin)).toMatchObject({
      stale: true,
      error: 'Could not update the weather.',
    })
    fetch.mockResolvedValueOnce(response(20))
    await store.retryWeather(dublin)
    expect(store.getWeatherSnapshot(dublin)).toMatchObject({
      stale: false,
      error: null,
      data: { temperature: 20 },
    })
    await vi.advanceTimersByTimeAsync(2 * 60 * 60_000)
    expect(store.getWeatherSnapshot(dublin).data).toBeNull()
  })
})
