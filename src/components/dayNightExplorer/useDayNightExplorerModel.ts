import { useCallback, useMemo, useRef, useState } from 'react'
import {
  useSelectedDate,
  useSolarTimes,
} from '../../contexts/SelectedDateContext'
import type { Theme } from '../../contexts/ThemeContext'
import { getSunPosition } from '../../lib/solar'
import { getSeason } from '../../lib/seasons'
import {
  buildExplorerInstant,
  getClockTimeForInstant,
  getInitialExplorerClockTime,
} from '../../lib/dayNightExplorer/dayNightExplorerCalendar'
import {
  getExplorerBackgroundBlend,
  getExplorerBackdropColor,
  getImageForTime,
  resolveBackgroundImage,
} from '../../lib/dayNightExplorer/dayNightExplorerBackdrop'
import { formatTime } from '../../lib/dayNightExplorer/dayNightExplorerMath'
import {
  EXPLORER_FOCUS_OPTIONS,
  EXPLORER_CITY_OPTIONS,
  getExplorerCityOption,
  type ExplorerCityId,
  type ExplorerDisplayMode,
  type ExplorerFocusId,
} from '../../lib/dayNightExplorer/dayNightExplorerOptions'
import type { ClockViewModel } from './Clock'
import useExplorerClock from './useExplorerClock'
import useSolarSystem3D from './useSolarSystem3D'

type UseDayNightExplorerModelResult = {
  planet: {
    globeReady: boolean
    canvasRef: ReturnType<typeof useSolarSystem3D>['canvasRef']
    options: typeof EXPLORER_FOCUS_OPTIONS
    activeFocusId: ExplorerFocusId
    onSelect: (focusId: ExplorerFocusId) => void
  }
  clock: ClockViewModel
}

const TOTAL_DAY_MS = 24 * 60 * 60 * 1000
const LUNAR_ORBIT_MS = 27.321661 * TOTAL_DAY_MS

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

const getMoonOrbitProgress = (instant: Date) => {
  return (
    (((instant.getTime() % LUNAR_ORBIT_MS) + LUNAR_ORBIT_MS) % LUNAR_ORBIT_MS) /
    LUNAR_ORBIT_MS
  )
}

export default function useDayNightExplorerModel(
  theme: Theme
): UseDayNightExplorerModelResult {
  const { selectedDate } = useSelectedDate()
  const season = getSeason(selectedDate)
  const [displayMode, setDisplayMode] =
    useState<ExplorerDisplayMode>('earth-focus')
  const [activeFocusId, setActiveFocusId] = useState<ExplorerFocusId>('earth')
  const [activeCalculationCityId, setActiveCalculationCityId] =
    useState<ExplorerCityId>('amsterdam')

  const calculationCity = getExplorerCityOption(activeCalculationCityId)
  const calculationLocation = calculationCity.location

  const solarTimes = useSolarTimes(calculationLocation)
  const initialClockTime = useMemo(
    () => getInitialExplorerClockTime(calculationLocation),
    [calculationLocation]
  )

  const onUpdateRef = useRef<(minutes: number, seconds: number) => void>(null!)

  const clock = useExplorerClock({
    initialMinutes: initialClockTime.totalMinutes,
    initialSeconds: initialClockTime.seconds,
    onUpdate: useCallback(
      (m: number, s: number) => onUpdateRef.current?.(m, s),
      []
    ),
  })

  const currentInstant = useMemo(
    () =>
      buildExplorerInstant(
        selectedDate,
        clock.minutes,
        clock.seconds,
        calculationLocation
      ),
    [calculationLocation, clock.minutes, clock.seconds, selectedDate]
  )
  const sunPosition = useMemo(
    () => getSunPosition(currentInstant),
    [currentInstant]
  )
  const planetSceneState = useMemo(
    () => ({
      displayMode,
      earthRotationDeg: getEarthRotationDeg(clock.minutes, clock.seconds),
      earthOrbitProgress: getYearProgress(selectedDate),
      moonOrbitProgress: getMoonOrbitProgress(currentInstant),
      activeFocusId,
      cityOptions: EXPLORER_CITY_OPTIONS,
      sunPosition,
      monthLabelFontFamily: theme.fontFamily,
    }),
    [
      activeFocusId,
      clock.minutes,
      clock.seconds,
      currentInstant,
      displayMode,
      selectedDate,
      sunPosition,
      theme.fontFamily,
    ]
  )

  const { canvasRef, globeReady, updateSceneState } =
    useSolarSystem3D(planetSceneState)

  // Direct visual updates during dragging (bypassing React re-renders)
  onUpdateRef.current = useCallback(
    (nextMinutes: number, nextSeconds: number) => {
      // 1. Digital Clock direct DOM updates
      const formatted = formatTime(nextMinutes)
      if (clock.digitalHourRef.current) {
        clock.digitalHourRef.current.textContent = formatted.h
      }
      if (clock.digitalMinuteRef.current) {
        clock.digitalMinuteRef.current.textContent = formatted.m
      }
      if (clock.digitalSecondRef.current) {
        clock.digitalSecondRef.current.textContent = String(
          Math.floor(nextSeconds)
        ).padStart(2, '0')
      }
      if (clock.digitalAmpmRef.current) {
        clock.digitalAmpmRef.current.textContent = formatted.ampm
      }

      // 2. Planet scene direct updates
      const ephemeralInstant = buildExplorerInstant(
        selectedDate,
        nextMinutes,
        nextSeconds,
        calculationLocation
      )
      const ephemeralSunPosition = getSunPosition(ephemeralInstant)
      updateSceneState({
        displayMode,
        earthRotationDeg: getEarthRotationDeg(nextMinutes, nextSeconds),
        earthOrbitProgress: getYearProgress(selectedDate),
        moonOrbitProgress: getMoonOrbitProgress(ephemeralInstant),
        activeFocusId,
        cityOptions: EXPLORER_CITY_OPTIONS,
        sunPosition: ephemeralSunPosition,
        monthLabelFontFamily: theme.fontFamily,
      })
    },
    [
      activeFocusId,
      calculationLocation,
      displayMode,
      selectedDate,
      clock.digitalHourRef,
      clock.digitalMinuteRef,
      clock.digitalSecondRef,
      clock.digitalAmpmRef,
      theme.fontFamily,
      updateSceneState,
    ]
  )

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
      clock.syncClockTime(
        getClockTimeForInstant(currentInstant, nextCity.location)
      )
      setActiveCalculationCityId(focusId)
      setActiveFocusId(focusId)
    },
    [clock, currentInstant, displayMode]
  )

  const filteredOptions = useMemo(() => {
    // Show Sun icon when in Earth focus (to switch to Solar)
    // Show Earth icon when in Solar focus (to switch to Earth)
    const topId = displayMode === 'earth-focus' ? 'sun' : 'earth'
    return EXPLORER_FOCUS_OPTIONS.filter((option) => {
      if (option.id === 'sun' || option.id === 'earth') {
        return option.id === topId
      }
      return true
    })
  }, [displayMode])

  const formattedTime = formatTime(clock.minutes)
  const activityImage = getImageForTime(clock.minutes, theme.activityImages)
  const explorerBackdropColor = getExplorerBackdropColor(
    clock.minutes,
    solarTimes
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
    planet: {
      globeReady,
      canvasRef,
      options: filteredOptions,
      activeFocusId,
      onSelect: handleFocusSelection,
    },
    clock: {
      activityImage,
      explorerBackdropColor,
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
