import { afterEach, expect, it, vi } from 'vitest'
import { getCurrentExplorerCity } from '../../src/features/dayNightExplorer/currentExplorerCity'

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'geolocation')
})

it('uses Amsterdam when geolocation stalls', async () => {
  vi.useFakeTimers()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: () => {},
    },
  })
  const pending = getCurrentExplorerCity()
  await vi.advanceTimersByTimeAsync(10_000)
  expect(await pending).toBe('amsterdam')
})
