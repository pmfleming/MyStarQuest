import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readTimeExplorerState,
  saveTimeExplorerState,
  TIME_EXPLORER_STORAGE_KEY,
} from '../../src/features/dayNightExplorer/timeExplorerStorage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Time Explorer saved state', () => {
  it.each(['{bad json'])('uses defaults for damaged storage: %s', (raw) => {
    localStorage.setItem(TIME_EXPLORER_STORAGE_KEY, raw)
    expect(readTimeExplorerState()).toMatchObject({
      activePanels: ['globe', 'clock'],
      activeCalculationCityId: 'amsterdam',
      exploration: null,
      weather: null,
    })
  })

  it('rejects invalid settings without losing valid fields', () => {
    localStorage.setItem(
      TIME_EXPLORER_STORAGE_KEY,
      JSON.stringify({
        activePanels: ['weather', 'weather'],
        activeCalculationCityId: 'unknown',
        displayMode: 'solar-focus',
        exploration: { dateKey: '2026-02-30', minutes: 500, seconds: 0 },
        weather: {
          cityId: 'amsterdam',
          draft: { visuals: { precipitationLevel: 99 } },
        },
      })
    )
    expect(readTimeExplorerState()).toMatchObject({
      activePanels: ['globe', 'clock'],
      activeCalculationCityId: 'amsterdam',
      displayMode: 'solar-focus',
      exploration: null,
      weather: null,
    })
  })

  it('remains usable when browser storage is blocked or full', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(readTimeExplorerState().activePanels).toEqual(['globe', 'clock'])
    expect(() =>
      saveTimeExplorerState({ activePanels: ['calendar'] })
    ).not.toThrow()
  })
})
