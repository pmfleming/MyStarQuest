import { describe, expect, it } from 'vitest'
import {
  getDateAtOrbitProgress,
  getYearProgress,
} from '../../../src/features/dayNightExplorer/dayNightExplorerCalendar'
import { getOrbitProgressDelta } from '../../../src/features/dayNightExplorer/solarSystemGeometry'
import { buildDateKey } from '../../../src/lib/today'

describe('Earth orbit calendar', () => {
  it.each([2024])(
    'round trips every day in %i, including leap days and DST',
    (year) => {
      for (let month = 0; month < 12; month++) {
        const days = new Date(year, month + 1, 0).getDate()
        for (let day = 1; day <= days; day++) {
          const date = new Date(year, month, day)
          expect(
            buildDateKey(getDateAtOrbitProgress(year, getYearProgress(date)))
          ).toBe(buildDateKey(date))
        }
      }
    }
  )

  it('moves continuously across the year boundary in either direction', () => {
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
