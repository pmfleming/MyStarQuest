import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useSelectedDate,
  useSolarTimes,
} from '../../contexts/SelectedDateContext'
import type { Theme } from '../../contexts/ThemeContext'
import { getSunPosition } from '../../lib/solar'
import { buildDateKey, getTodayDescriptor } from '../../lib/today'
import {
  readTimeExplorerState,
  saveTimeExplorerState,
} from './timeExplorerStorage'
import { getSeason } from '../../lib/seasons'
import {
  buildExplorerInstant,
  getClockTimeForInstant,
  getInitialExplorerClockTime,
} from './dayNightExplorerCalendar'
import {
  getExplorerBackgroundBlend,
  getExplorerBackdropColor,
  getImageForTime,
  resolveBackgroundImage,
} from './dayNightExplorerBackdrop'
import { formatTime } from './dayNightExplorerMath'
import {
  EXPLORER_FOCUS_OPTIONS,
  EXPLORER_CITY_OPTIONS,
  getExplorerCityOption,
  type ExplorerCityId,
  type ExplorerDisplayMode,
  type ExplorerFocusId,
} from './dayNightExplorerOptions'
import type { ClockViewModel } from './Clock'
import useExplorerClock from './useExplorerClock'
import useSolarSystem3D from './useSolarSystem3D'
import { useCalendarSchedule } from '../../hooks/useCalendarSchedule'
import { useSchoolCalendar } from '../../hooks/useSchoolCalendar'
import { getAgendaForDate } from '../../lib/calendarSchedule'

type UseDayNightExplorerModelResult = {
  resetToNow: () => void
  weatherCity: ReturnType<typeof getExplorerCityOption>
  planet: {
    globeReady: boolean
    globeFailed: boolean
    retryGlobe: () => void
    canvasRef: ReturnType<typeof useSolarSystem3D>['canvasRef']
    options: typeof EXPLORER_FOCUS_OPTIONS
    activeFocusId: ExplorerFocusId
    onSelect: (focusId: ExplorerFocusId) => void
  }
  clock: ClockViewModel
}

const getYearProgress = (date: Date) => {
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const nextYearStart = new Date(date.getFullYear() + 1, 0, 1)

  return (
    (date.getTime() - yearStart.getTime()) /
    (nextYearStart.getTime() - yearStart.getTime())
  )
}

const getEarthRotationDeg = (minutes: number, seconds: number) => {
  const totalMinutes = ((minutes % 1440) + 1440) % 1440
  const dayProgress = (totalMinutes + seconds / 60) / 1440

  return dayProgress * 360
}

export default function useDayNightExplorerModel(
  theme: Theme,
  globeVisible = true
): UseDayNightExplorerModelResult {
  const { selectedDate, setSelectedDateKey } = useSelectedDate()
  const schedule = useCalendarSchedule()
  const { events: holidays } = useSchoolCalendar()
  const agenda = useMemo(
    () => getAgendaForDate(schedule, selectedDate, holidays),
    [schedule, selectedDate, holidays]
  )
  const season = getSeason(selectedDate)
  const [savedState] = useState(readTimeExplorerState)
  const pendingDateRestore = useRef(savedState.exploration?.dateKey)
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

  const solarTimes = useSolarTimes(calculationLocation)
  const initialClockTime = useMemo(
    () => getInitialExplorerClockTime(calculationLocation),
    [calculationLocation]
  )

  const onUpdateRef = useRef<
    ((minutes: number, seconds: number) => void) | null
  >(null)

  const clock = useExplorerClock({
    initialMinutes:
      savedState.exploration?.minutes ?? initialClockTime.totalMinutes,
    initialSeconds: savedState.exploration?.seconds ?? initialClockTime.seconds,
    onUpdate: useCallback(
      (m: number, s: number) => onUpdateRef.current?.(m, s),
      []
    ),
  })
  const getClockTime = clock.getClockTime
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
    setSelectedDateKey,
  ])
  const syncClockTime = clock.syncClockTime
  const resetToNow = useCallback(() => {
    const now = new Date()
    setSelectedDateKey(
      getTodayDescriptor(now, calculationLocation.timeZone).dateKey
    )
    syncClockTime(getClockTimeForInstant(now, calculationLocation))
  }, [calculationLocation, setSelectedDateKey, syncClockTime])

  // React snapshots and smooth hand dragging use the same scene projection.
  const buildSceneState = useCallback(
    (minutes: number, seconds: number) => ({
      displayMode,
      earthRotationDeg: getEarthRotationDeg(minutes, seconds),
      earthOrbitProgress: getYearProgress(selectedDate),
      activeFocusId,
      cityOptions: EXPLORER_CITY_OPTIONS,
      sunPosition: getSunPosition(
        buildExplorerInstant(
          selectedDate,
          minutes,
          seconds,
          calculationLocation
        )
      ),
      monthLabelFontFamily: theme.fontFamily,
    }),
    [
      activeFocusId,
      calculationLocation,
      displayMode,
      selectedDate,
      theme.fontFamily,
    ]
  )
  const planetSceneState = useMemo(
    () => buildSceneState(clock.minutes, clock.seconds),
    [buildSceneState, clock.minutes, clock.seconds]
  )

  const { canvasRef, globeReady, globeFailed, retryGlobe, updateSceneState } =
    useSolarSystem3D(planetSceneState, globeVisible)

  useEffect(() => {
    onUpdateRef.current = (minutes, seconds) =>
      updateSceneState(buildSceneState(minutes, seconds))
  }, [buildSceneState, updateSceneState])

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

      const nextCity = getExplorerCityOption(focusId)
      const { minutes, seconds } = getClockTime()
      const currentInstant = buildExplorerInstant(
        selectedDate,
        minutes,
        seconds,
        calculationLocation
      )
      syncClockTime(getClockTimeForInstant(currentInstant, nextCity.location))
      setSelectedDateKey(
        getTodayDescriptor(currentInstant, nextCity.location.timeZone).dateKey
      )
      setActiveCalculationCityId(focusId)
      setActiveFocusId(focusId)
    },
    [
      calculationLocation,
      displayMode,
      getClockTime,
      selectedDate,
      setSelectedDateKey,
      syncClockTime,
    ]
  )

  const filteredOptions = useMemo(() => {
    // Show Sun icon when in Earth focus (to switch to Solar)
    // Show Earth icon when in Solar focus (to switch to Earth)
    const hiddenId = displayMode === 'earth-focus' ? 'earth' : 'sun'
    return EXPLORER_FOCUS_OPTIONS.filter((option) => option.id !== hiddenId)
  }, [displayMode])

  const formattedTime = formatTime(clock.minutes)
  const activityImage = getImageForTime(
    clock.minutes,
    theme.activityImages,
    agenda
  )
  const explorerBackgroundBlend = getExplorerBackgroundBlend(
    clock.minutes,
    solarTimes
  )
  const explorerBaseBackgroundImage = resolveBackgroundImage(
    theme.explorerBackgroundImages,
    explorerBackgroundBlend.base,
    season
  )
  const explorerOverlayBackgroundImage = resolveBackgroundImage(
    theme.explorerBackgroundImages,
    explorerBackgroundBlend.overlay,
    season
  )

  return {
    resetToNow,
    weatherCity: calculationCity,
    planet: {
      globeReady,
      globeFailed,
      retryGlobe,
      canvasRef,
      options: filteredOptions,
      activeFocusId,
      onSelect: handleFocusSelection,
    },
    clock: {
      activityImage,
      explorerBackdropColor: getExplorerBackdropColor(explorerBackgroundBlend),
      explorerBaseBackgroundImage,
      explorerOverlayBackgroundImage,
      overlayOpacity: explorerBackgroundBlend.overlayOpacity,
      isDragging: clock.isDragging,
      handTransition: clock.handTransition,
      hourAngle: clock.hourAngle,
      minuteAngle: clock.minuteAngle,
      secondAngle: clock.secondAngle,
      hoursLabel: formattedTime.h,
      minutesLabel: formattedTime.m,
      seconds: clock.seconds,
      ampm: formattedTime.ampm,
      svgRef: clock.svgRef,
      hourHandRef: clock.hourHandRef,
      minuteHandRef: clock.minuteHandRef,
      secondHandRef: clock.secondHandRef,
      digitalHourRef: clock.digitalHourRef,
      digitalMinuteRef: clock.digitalMinuteRef,
      digitalSecondRef: clock.digitalSecondRef,
      digitalAmpmRef: clock.digitalAmpmRef,
      onPointerDown: clock.handlePointerDown,
      onAdjust: clock.adjustMinutes,
    },
  }
}
