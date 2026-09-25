import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readTimeExplorerState,
  saveTimeExplorerState,
} from '../../src/features/dayNightExplorer/timeExplorerStorage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('Time Explorer saved state', () => {
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
