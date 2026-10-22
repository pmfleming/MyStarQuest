import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelectedDate } from '../../contexts/SelectedDateContext'
import { buildDateKey, getTodayDescriptor } from '../../lib/today'
import {
  readTimeExplorerState,
  saveTimeExplorerState,
} from './timeExplorerStorage'
import {
  buildExplorerInstant,
  getClockTimeForInstant,
  getInitialExplorerClockTime,
  getDateAtOrbitProgress,
} from './dayNightExplorerCalendar'
import {
  getExplorerCityOption,
  type ExplorerCityId,
  type ExplorerDisplayMode,
  type ExplorerFocusId,
} from './dayNightExplorerOptions'
import useExplorerClock from './useExplorerClock'
import { getCurrentExplorerCity } from './currentExplorerCity'

// Own the persisted exploration, city/date transitions and nightly location reset.
// Scene rendering consumes this session without managing its storage lifecycle.
export function useExplorerSession(
  onUpdate: (minutes: number, seconds: number) => void
) {
  const { selectedDate, setSelectedDateKey, nightlyResetKey } =
    useSelectedDate()
  const [savedState] = useState(readTimeExplorerState)
  const [locationResetKey, setLocationResetKey] = useState(
    savedState.exploration ? nightlyResetKey : ''
  )
  const pendingDateRestore = useRef<string | undefined>(
    savedState.exploration?.dateKey ??
      getTodayDescriptor(
        new Date(),
        getExplorerCityOption(savedState.activeCalculationCityId).location
          .timeZone
      ).dateKey
  )
  const [displayMode, setDisplayMode] = useState<ExplorerDisplayMode>(
    savedState.displayMode
  )
  const [activeFocusId, setActiveFocusId] = useState<ExplorerFocusId>(
    savedState.activeFocusId
  )
  const [activeCalculationCityId, setActiveCalculationCityId] =
    useState<ExplorerCityId>(savedState.activeCalculationCityId)

  const calculationCity = getExplorerCityOption(activeCalculationCityId)
  const calculationLocation = calculationCity.location

  const initialClockTime = useMemo(
    () => getInitialExplorerClockTime(calculationLocation),
    [calculationLocation]
  )

  const clock = useExplorerClock({
    initialMinutes:
      savedState.exploration?.minutes ?? initialClockTime.totalMinutes,
    initialSeconds: savedState.exploration?.seconds ?? initialClockTime.seconds,
    onUpdate,
  })
  const getClockTime = clock.getClockTime
  const syncClockTime = clock.syncClockTime
  const syncInstant = useCallback(
    (instant: Date, cityId: ExplorerCityId) => {
      const { location } = getExplorerCityOption(cityId)
      setSelectedDateKey(getTodayDescriptor(instant, location.timeZone).dateKey)
      syncClockTime(getClockTimeForInstant(instant, location))
    },
    [setSelectedDateKey, syncClockTime]
  )
  const resetToNow = useCallback(() => {
    syncInstant(new Date(), activeCalculationCityId)
  }, [activeCalculationCityId, syncInstant])
  useEffect(() => {
    if (locationResetKey === nightlyResetKey) return
    let active = true
    const cancel = () => {
      active = false
      setLocationResetKey(nightlyResetKey)
    }
    void getCurrentExplorerCity().then((cityId) => {
      if (!active) return
      const now = new Date()
      pendingDateRestore.current = undefined
      setActiveCalculationCityId(cityId)
      setActiveFocusId(cityId)
      syncInstant(now, cityId)
      setLocationResetKey(nightlyResetKey)
    })
    // A late location fix must not undo a new exploration chosen by the user.
    document.addEventListener('pointerdown', cancel, { once: true })
    document.addEventListener('keydown', cancel, { once: true })
    return () => {
      active = false
      document.removeEventListener('pointerdown', cancel)
      document.removeEventListener('keydown', cancel)
    }
  }, [nightlyResetKey, locationResetKey, syncInstant])
  const dateKey = buildDateKey(selectedDate)
  useEffect(() => {
    if (pendingDateRestore.current && pendingDateRestore.current !== dateKey) {
      setSelectedDateKey(pendingDateRestore.current)
      return
    }
    pendingDateRestore.current = undefined
    const save = () =>
      saveTimeExplorerState({
        displayMode,
        activeFocusId,
        activeCalculationCityId,
        explorationResetKey: locationResetKey,
        exploration: { dateKey, ...getClockTime() },
      })
    save()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      save()
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [
    dateKey,
    displayMode,
    activeFocusId,
    activeCalculationCityId,
    clock.minutes,
    clock.seconds,
    getClockTime,
    locationResetKey,
    setSelectedDateKey,
  ])

  const handleFocusSelection = useCallback(
    (focusId: ExplorerFocusId) => {
      if (focusId === 'sun' || focusId === 'earth') {
        // Toggle display mode
        const nextDisplayMode: ExplorerDisplayMode =
          displayMode === 'earth-focus' ? 'solar-focus' : 'earth-focus'
        setDisplayMode(nextDisplayMode)

        // Update active focus id to match the new display mode (sun for solar, earth for earth)
        setActiveFocusId(nextDisplayMode === 'solar-focus' ? 'sun' : 'earth')
        return
      }

      const { minutes, seconds } = getClockTime()
      const currentInstant = buildExplorerInstant(
        selectedDate,
        minutes,
        seconds,
        calculationLocation
      )
      syncInstant(currentInstant, focusId)
      setActiveCalculationCityId(focusId)
      setActiveFocusId(focusId)
    },
    [calculationLocation, displayMode, getClockTime, selectedDate, syncInstant]
  )

  const handleOrbitChange = useCallback(
    (year: number, progress: number) => {
      setSelectedDateKey(buildDateKey(getDateAtOrbitProgress(year, progress)))
    },
    [setSelectedDateKey]
  )
  return {
    clock,
    selectedDate,
    calculationCity,
    displayMode,
    activeFocusId,
    resetToNow,
    handleFocusSelection,
    handleOrbitChange,
  }
}
