import { useCallback, useMemo, useState } from 'react'
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
import {
  formatTime,
  getExplorerRenderScene,
} from '../../lib/dayNightExplorer/dayNightExplorerMath'
import {
  EXPLORER_FOCUS_OPTIONS,
  getExplorerCityOption,
  type ExplorerCityId,
  type ExplorerFocusId,
  type ExplorerRenderMode,
} from '../../lib/dayNightExplorer/dayNightExplorerOptions'
import type { ClockViewModel } from './Clock'
import useExplorerClock from './useExplorerClock'
import usePlanetaryGlobe from './usePlanetaryGlobe'

type UseDayNightExplorerModelResult = {
  planet: {
    globeReady: boolean
    renderMode: ExplorerRenderMode
    canvasRef: ReturnType<typeof usePlanetaryGlobe>['canvasRef']
    options: typeof EXPLORER_FOCUS_OPTIONS
    activeFocusId: ExplorerFocusId
    onSelect: (focusId: ExplorerFocusId) => void
  }
  clock: ClockViewModel
}

export default function useDayNightExplorerModel(
  theme: Theme
): UseDayNightExplorerModelResult {
  const { selectedDate } = useSelectedDate()
  const season = getSeason(selectedDate)
  const [activeFocusId, setActiveFocusId] = useState<ExplorerFocusId>('sun')
  const [activeCalculationCityId, setActiveCalculationCityId] =
    useState<ExplorerCityId>('amsterdam')

  const calculationCity = getExplorerCityOption(activeCalculationCityId)
  const calculationLocation = calculationCity.location
  const focusedCity =
    activeFocusId === 'sun'
      ? calculationCity
      : getExplorerCityOption(activeFocusId)
  const renderMode: ExplorerRenderMode =
    activeFocusId === 'sun' ? 'rotating-earth' : 'moving-terminator'

  const solarTimes = useSolarTimes(calculationLocation)
  const initialClockTime = useMemo(
    () => getInitialExplorerClockTime(calculationLocation),
    [calculationLocation]
  )
  const clock = useExplorerClock({
    initialMinutes: initialClockTime.totalMinutes,
    initialSeconds: initialClockTime.seconds,
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
  const renderScene = useMemo(
    () =>
      getExplorerRenderScene({
        renderMode,
        observerLatitude: 0,
        observerLongitude: focusedCity.location.longitude,
        sunPosition,
      }),
    [focusedCity.location.longitude, renderMode, sunPosition]
  )
  const { canvasRef, globeReady } = usePlanetaryGlobe(renderScene, sunPosition)

  const handleFocusSelection = useCallback(
    (focusId: ExplorerFocusId) => {
      if (focusId === 'sun') {
        setActiveFocusId('sun')
        return
      }

      const nextCity = getExplorerCityOption(focusId)
      clock.syncClockTime(
        getClockTimeForInstant(currentInstant, nextCity.location)
      )
      setActiveCalculationCityId(focusId)
      setActiveFocusId(focusId)
    },
    [clock, currentInstant]
  )

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
      renderMode,
      canvasRef,
      options: EXPLORER_FOCUS_OPTIONS,
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
      onPointerDown: clock.handlePointerDown,
      onAdjust: clock.adjustMinutes,
    },
  }
}
