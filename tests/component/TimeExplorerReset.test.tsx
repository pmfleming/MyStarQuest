import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SelectedDateProvider } from '../../src/contexts/SelectedDateProvider'
import { useSelectedDate } from '../../src/contexts/SelectedDateContext'
import { themes } from '../../src/contexts/ThemeContext'
import useDayNightExplorerModel from '../../src/features/dayNightExplorer/useDayNightExplorerModel'
import { DEFAULT_CALENDAR_SCHEDULE } from '../../src/lib/calendarSchedule'
import { getSunPosition } from '../../src/lib/solar'
import type { SolarSystemSceneState } from '../../src/features/dayNightExplorer/SolarSystem3DManager'

const scene = vi.hoisted(() => ({
  render: vi.fn(),
  update: vi.fn(),
  canvasRef: { current: null },
  retry: vi.fn(),
  holidays: {},
}))

vi.mock('../../src/hooks/useSchoolCalendar', () => ({
  useSchoolCalendar: () => ({ events: scene.holidays }),
}))
vi.mock('../../src/hooks/useCalendarSchedule', () => ({
  useCalendarSchedule: () => DEFAULT_CALENDAR_SCHEDULE,
}))
vi.mock('../../src/features/dayNightExplorer/useSolarSystem3D', () => ({
  default: (state: SolarSystemSceneState, enabled: boolean) => {
    scene.render(state, enabled)
    return {
      canvasRef: scene.canvasRef,
      globeReady: true,
      globeFailed: false,
      retryGlobe: scene.retry,
      updateSceneState: scene.update,
    }
  },
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T12:34:56Z'))
  vi.clearAllMocks()
})
afterEach(() => vi.useRealTimers())

describe('shared explorer reset', () => {
  it.each([
    [
      'amsterdam',
      '2026-09-22T12:34:56Z',
      '2026-09-22',
      '02',
      '34',
      'PM',
      14 * 60 + 34,
    ],
    [
      'taipei',
      '2026-09-22T23:34:56Z',
      '2026-09-23',
      '07',
      '34',
      'AM',
      7 * 60 + 34,
    ],
  ] as const)(
    'resets date, clock, and hidden globe to now in %s',
    (city, instant, dateKey, hours, minutes, ampm, totalMinutes) => {
      const { result, rerender } = renderHook(
        ({ visible }) => ({
          explorer: useDayNightExplorerModel(themes.princess, visible),
          date: useSelectedDate(),
        }),
        { wrapper: SelectedDateProvider, initialProps: { visible: false } }
      )
      act(() => result.current.explorer.planet.onSelect(city))
      act(() => {
        result.current.date.setSelectedDateKey('2025-01-10')
        result.current.explorer.clock.onAdjust(180)
      })
      vi.setSystemTime(new Date(instant))
      act(() => result.current.explorer.resetToNow())

      expect(result.current.date.selectedDateKey).toBe(dateKey)
      expect(result.current.explorer.clock).toMatchObject({
        hoursLabel: hours,
        minutesLabel: minutes,
        seconds: 56,
        ampm,
      })
      expect(result.current.explorer.weatherCity.id).toBe(city)
      const expectedScene = expect.objectContaining({
        activeFocusId: city,
        earthRotationDeg: ((totalMinutes + 56 / 60) / 1440) * 360,
        sunPosition: getSunPosition(new Date(instant)),
      })
      expect(scene.render).toHaveBeenLastCalledWith(expectedScene, false)
      const yearStart = new Date(2026, 0, 1)
      const yearEnd = new Date(2027, 0, 1)
      expect(scene.render.mock.lastCall![0].earthOrbitProgress).toBe(
        (result.current.date.selectedDate.getTime() - yearStart.getTime()) /
          (yearEnd.getTime() - yearStart.getTime())
      )
      rerender({ visible: true })
      expect(scene.render).toHaveBeenLastCalledWith(expectedScene, true)
    }
  )
})
