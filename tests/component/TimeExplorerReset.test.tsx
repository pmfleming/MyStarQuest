import { act, fireEvent, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSelectedDate } from '../../src/contexts/SelectedDateContext'
import { SelectedDateProvider } from '../../src/contexts/SelectedDateProvider'
import { themes } from '../../src/contexts/ThemeContext'
import type { SolarSystemSceneState } from '../../src/features/dayNightExplorer/SolarSystem3DManager'
import { readTimeExplorerState } from '../../src/features/dayNightExplorer/timeExplorerStorage'
import useDayNightExplorerModel from '../../src/features/dayNightExplorer/useDayNightExplorerModel'
import { DEFAULT_CALENDAR_SCHEDULE } from '../../src/lib/calendarSchedule'

const scene = vi.hoisted(() => ({
  render: vi.fn(),
  update: vi.fn(),
  canvasRef: { current: null },
  retry: vi.fn(),
  holidays: {},
  onOrbitChange: null as null | ((year: number, progress: number) => void),
}))

const locate = vi.fn()
const atCity = (latitude: number, longitude: number) =>
  locate.mockImplementation((success: PositionCallback) =>
    success({ coords: { latitude, longitude } } as GeolocationPosition)
  )

vi.mock('../../src/hooks/useSchoolCalendar', () => ({
  useSchoolCalendar: () => ({ events: scene.holidays }),
}))
vi.mock('../../src/hooks/useCalendarSchedule', () => ({
  useCalendarSchedule: () => DEFAULT_CALENDAR_SCHEDULE,
}))
vi.mock('../../src/features/dayNightExplorer/useSolarSystem3D', () => ({
  default: (
    state: SolarSystemSceneState,
    enabled: boolean,
    onOrbitChange: (year: number, progress: number) => void
  ) => {
    scene.onOrbitChange = onOrbitChange
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
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-22T12:34:56Z'))
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: locate },
  })
  atCity(52.3676, 4.9041)
})
afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(navigator, 'geolocation')
})

describe('shared explorer reset', () => {
  it('keeps the exact instant when changing city across midnight between React clock snapshots', async () => {
    const { result } = renderHook(
      () => ({
        explorer: useDayNightExplorerModel(themes.princess),
        date: useSelectedDate(),
      }),
      { wrapper: SelectedDateProvider }
    )
    await act(async () => {})
    act(() => result.current.explorer.clock.onAdjust(480))
    act(() => vi.advanceTimersByTime(2000))
    const before = scene.update.mock.lastCall![0].sunPosition
    act(() => result.current.explorer.planet.onSelect('taipei'))
    expect(result.current.date.selectedDateKey).toBe('2026-09-23')
    expect(result.current.explorer.clock).toMatchObject({
      hoursLabel: '04',
      minutesLabel: '34',
      seconds: 58,
      ampm: 'AM',
    })
    expect(scene.render.mock.lastCall![0].sunPosition).toEqual(before)
  })

  it('restores date, exact clock time, city and globe mode across sessions, including after reset', async () => {
    const useExplorer = () => ({
      explorer: useDayNightExplorerModel(themes.teenie, true),
      date: useSelectedDate(),
    })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <SelectedDateProvider>{children}</SelectedDateProvider>
      </StrictMode>
    )
    const first = renderHook(useExplorer, { wrapper })
    await act(async () => {})
    act(() => first.result.current.explorer.planet.onSelect('sun'))
    act(() => first.result.current.explorer.planet.onSelect('taipei'))
    act(() => {
      first.result.current.date.setSelectedDateKey('2025-02-14')
      first.result.current.explorer.clock.onAdjust(-180)
    })
    act(() => vi.advanceTimersByTime(2000))
    act(() => window.dispatchEvent(new Event('pagehide')))
    expect(readTimeExplorerState().exploration?.seconds).toBe(58)
    first.unmount()
    vi.setSystemTime(new Date('2026-09-22T13:02:03Z'))

    const second = renderHook(useExplorer, { wrapper })
    expect(second.result.current.date.selectedDateKey).toBe('2025-02-14')
    expect(second.result.current.explorer.clock).toMatchObject({
      hoursLabel: '05',
      minutesLabel: '34',
      seconds: 58,
      ampm: 'PM',
    })
    expect(second.result.current.explorer.weatherCity.id).toBe('taipei')
    expect(scene.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        displayMode: 'solar-focus',
        activeFocusId: 'taipei',
      }),
      true
    )
    act(() => second.result.current.explorer.resetToNow())
    second.unmount()

    const third = renderHook(useExplorer, { wrapper })
    expect(third.result.current.date.selectedDateKey).toBe('2026-09-22')
    expect(third.result.current.explorer.clock).toMatchObject({
      hoursLabel: '09',
      minutesLabel: '02',
      seconds: 3,
      ampm: 'PM',
    })
    expect(third.result.current.explorer.weatherCity.id).toBe('taipei')
    third.unmount()
  })

  it('resets at the nightly boundary and catches up after suspension or reopening', async () => {
    vi.setSystemTime(new Date('2026-09-22T23:04:59Z'))
    const useExplorer = () => ({
      explorer: useDayNightExplorerModel(themes.teenie, false),
      date: useSelectedDate(),
    })
    const wrapper = SelectedDateProvider
    const first = renderHook(useExplorer, { wrapper })
    await act(async () => {})
    act(() => first.result.current.explorer.planet.onSelect('taipei'))
    act(() => {
      first.result.current.date.setSelectedDateKey('2025-02-14')
      first.result.current.explorer.clock.onAdjust(-180)
    })
    expect(first.result.current.date.selectedDateKey).toBe('2025-02-14')
    atCity(25.03, 121.56)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(first.result.current.date.selectedDateKey).toBe('2026-09-23')
    expect(first.result.current.explorer.clock).toMatchObject({
      hoursLabel: '07',
      minutesLabel: '05',
      seconds: 0,
      ampm: 'AM',
    })
    act(() => {
      first.result.current.date.setSelectedDateKey('2025-02-14')
      first.result.current.explorer.clock.onAdjust(60)
    })
    // No timer ticks while suspended; resuming after DST uses London 00:05.
    vi.setSystemTime(new Date('2026-10-26T00:06:17Z'))
    atCity(53.35, -6.26)
    await act(async () => document.dispatchEvent(new Event('visibilitychange')))
    expect(first.result.current.date.selectedDateKey).toBe('2026-10-26')
    expect(first.result.current.explorer.clock).toMatchObject({
      hoursLabel: '12',
      minutesLabel: '06',
      seconds: 17,
      ampm: 'AM',
    })
    expect(first.result.current.explorer.weatherCity.id).toBe('dublin')
    first.unmount()
    vi.setSystemTime(new Date('2026-10-27T00:09:22Z'))
    atCity(40.71, -74.01)
    expect(readTimeExplorerState().exploration).toBeNull()
    const reopened = renderHook(useExplorer, { wrapper })
    await act(async () => {})
    expect(reopened.result.current.date.selectedDateKey).toBe('2026-10-27')
    expect(reopened.result.current.explorer.clock).toMatchObject({
      hoursLabel: '01',
      minutesLabel: '09',
      seconds: 22,
      ampm: 'AM',
    })
    expect(reopened.result.current.explorer.weatherCity.id).toBe('amsterdam')
    reopened.unmount()
  })

  it('ignores a late location fix after the user starts a new exploration', async () => {
    let finish!: PositionCallback
    locate.mockImplementation((success: PositionCallback) => {
      finish = success
    })
    const { result, unmount } = renderHook(
      () => ({
        explorer: useDayNightExplorerModel(themes.princess),
        date: useSelectedDate(),
      }),
      { wrapper: SelectedDateProvider }
    )
    fireEvent.pointerDown(document.body)
    act(() => {
      result.current.explorer.planet.onSelect('taipei')
      result.current.date.setSelectedDateKey('2025-02-14')
    })
    await act(async () =>
      finish({
        coords: { latitude: 53.35, longitude: -6.26 },
      } as GeolocationPosition)
    )
    expect(result.current.explorer.weatherCity.id).toBe('taipei')
    expect(result.current.date.selectedDateKey).toBe('2025-02-14')
    unmount()
  })
})
