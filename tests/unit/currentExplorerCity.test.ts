import { afterEach, expect, it, vi } from 'vitest'
import {
  getCurrentExplorerCity,
  getNearbyExplorerCity,
} from '../../src/features/dayNightExplorer/currentExplorerCity'

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'geolocation')
})

it('recognizes the three metro areas and defaults to Amsterdam outside them', () => {
  expect(getNearbyExplorerCity({ latitude: 52.31, longitude: 4.77 })).toBe(
    'amsterdam'
  )
  expect(getNearbyExplorerCity({ latitude: 53.43, longitude: -6.25 })).toBe(
    'dublin'
  )
  expect(getNearbyExplorerCity({ latitude: 25.08, longitude: 121.23 })).toBe(
    'taipei'
  )
  expect(getNearbyExplorerCity({ latitude: 51.51, longitude: -0.13 })).toBe(
    'amsterdam'
  )
  expect(getNearbyExplorerCity({ latitude: 24, longitude: 121.56 })).toBe(
    'amsterdam'
  )
})

it.each(['denied', 'stalled'] as const)(
  'uses Amsterdam when geolocation is %s',
  async (failure) => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          reject: PositionErrorCallback
        ) => {
          if (failure === 'denied')
            reject({ code: 1 } as GeolocationPositionError)
        },
      },
    })
    const pending = getCurrentExplorerCity()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await pending).toBe('amsterdam')
  }
)
