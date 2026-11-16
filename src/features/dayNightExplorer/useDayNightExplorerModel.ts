import { useExplorerSession } from './useExplorerSession'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSolarTimes } from '../../contexts/SelectedDateContext'
import type { Theme } from '../../contexts/ThemeContext'
import { getSunPosition } from '../../lib/solar'
import { getSeason } from '../../lib/seasons'
import {
  buildExplorerInstant,
  getYearProgress,
} from './dayNightExplorerCalendar'
import {
  getExplorerBackgroundBlend,
  getExplorerBackdropColor,
  getImageForTime,
  resolveBackgroundImage,
} from './dayNightExplorerBackdrop'
import {
  EXPLORER_FOCUS_OPTIONS,
  EXPLORER_CITY_OPTIONS,
  getExplorerCityOption,
  type ExplorerFocusId,
} from './dayNightExplorerOptions'
import type { ClockViewModel } from './Clock'
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

const getEarthRotationDeg = (minutes: number, seconds: number) => {
  const totalMinutes = ((minutes % 1440) + 1440) % 1440
  const dayProgress = (totalMinutes + seconds / 60) / 1440

  return dayProgress * 360
}

export default function useDayNightExplorerModel(
  theme: Theme,
  globeVisible = true
): UseDayNightExplorerModelResult {
  const onUpdateRef = useRef<
    ((minutes: number, seconds: number) => void) | null
  >(null)
  const {
    clock,
    selectedDate,
    calculationCity,
    displayMode,
    activeFocusId,
    resetToNow,
    handleFocusSelection,
    handleOrbitChange,
  } = useExplorerSession(
    useCallback(
      (minutes: number, seconds: number) =>
        onUpdateRef.current?.(minutes, seconds),
      []
    )
  )
  const calculationLocation = calculationCity.location
  const solarTimes = useSolarTimes(calculationLocation)
  const schedule = useCalendarSchedule()
  const { events: holidays } = useSchoolCalendar()
  const agenda = useMemo(
    () => getAgendaForDate(schedule, selectedDate, holidays),
    [schedule, selectedDate, holidays]
  )
  const season = getSeason(selectedDate)
  // React snapshots and smooth hand dragging use the same scene projection.
  const buildSceneState = useCallback(
    (minutes: number, seconds: number) => ({
      displayMode,
      earthRotationDeg: getEarthRotationDeg(minutes, seconds),
      earthOrbitProgress: getYearProgress(selectedDate),
      orbitYear: selectedDate.getFullYear(),
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
  const { getClockTime } = clock
  const planetSceneState = useMemo(() => {
    if (!globeVisible) return null
    const { minutes, seconds } = getClockTime()
    return buildSceneState(minutes, seconds)
  }, [buildSceneState, globeVisible, getClockTime])

  const { canvasRef, globeReady, globeFailed, retryGlobe, updateSceneState } =
    useSolarSystem3D(planetSceneState, globeVisible, handleOrbitChange)

  useEffect(() => {
    onUpdateRef.current = globeVisible
      ? (minutes, seconds) =>
          updateSceneState(buildSceneState(minutes, seconds))
      : null
  }, [buildSceneState, updateSceneState, globeVisible])

  const filteredOptions = useMemo(() => {
    // Show Sun icon when in Earth focus (to switch to Solar)
    // Show Earth icon when in Solar focus (to switch to Earth)
    const hiddenId = displayMode === 'earth-focus' ? 'earth' : 'sun'
    return EXPLORER_FOCUS_OPTIONS.filter((option) => option.id !== hiddenId)
  }, [displayMode])

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
      ...clock.view,
      activityImage,
      explorerBackdropColor: getExplorerBackdropColor(explorerBackgroundBlend),
      explorerBaseBackgroundImage,
      explorerOverlayBackgroundImage,
      overlayOpacity: explorerBackgroundBlend.overlayOpacity,
    },
  }
}
