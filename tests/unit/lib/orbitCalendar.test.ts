import { describe, expect, it } from 'vitest'
import { getDateAtOrbitProgress } from '../../../src/features/dayNightExplorer/dayNightExplorerCalendar'
import { getOrbitProgressDelta } from '../../../src/features/dayNightExplorer/solarSystemGeometry'
import { buildDateKey } from '../../../src/lib/today'

describe('Earth orbit calendar', () => {
  it('moves continuously across the year boundary in either direction', () => {
    expect(buildDateKey(getDateAtOrbitProgress(2024, (1 + 28 / 29) / 12))).toBe(
      '2024-02-29'
    )
    expect(buildDateKey(getDateAtOrbitProgress(2026, 0.25 - 0.00001))).toBe(
      '2026-04-01'
    )
    expect(buildDateKey(getDateAtOrbitProgress(2026, 1 - 0.00001))).toBe(
      '2027-01-01'
    )
    expect(getOrbitProgressDelta(0.99, 0.01)).toBeCloseTo(0.02)
    expect(getOrbitProgressDelta(0.01, 0.99)).toBeCloseTo(-0.02)
    expect(buildDateKey(getDateAtOrbitProgress(2026, 1))).toBe('2027-01-01')
    expect(buildDateKey(getDateAtOrbitProgress(2026, -1 / 12))).toBe(
      '2025-12-01'
    )
    expect(buildDateKey(getDateAtOrbitProgress(2026, 2.25))).toBe('2028-04-01')
  })
})
