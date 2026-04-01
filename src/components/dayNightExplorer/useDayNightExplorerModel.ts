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

  const { canvasRef, globeReady, sunPositionRef, renderSceneRef } =
    usePlanetaryGlobe(renderScene, sunPosition, clock.isDragging)

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

      // 2. Globe direct Ref updates
      const ephemeralInstant = buildExplorerInstant(
        selectedDate,
        nextMinutes,
        nextSeconds,
        calculationLocation
      )
      const ephemeralSunPosition = getSunPosition(ephemeralInstant)
      const ephemeralRenderScene = getExplorerRenderScene({
        renderMode,
        observerLatitude: 0,
        observerLongitude: focusedCity.location.longitude,
        sunPosition: ephemeralSunPosition,
      })

      if (sunPositionRef.current) {
        sunPositionRef.current = ephemeralSunPosition
      }
      if (renderSceneRef.current) {
        renderSceneRef.current = ephemeralRenderScene
      }
    },
    [
      selectedDate,
      calculationLocation,
      renderMode,
      focusedCity.location.longitude,
      clock.digitalHourRef,
      clock.digitalMinuteRef,
      clock.digitalSecondRef,
      clock.digitalAmpmRef,
      sunPositionRef,
      renderSceneRef,
    ]
  )

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
      digitalHourRef: clock.digitalHourRef,
      digitalMinuteRef: clock.digitalMinuteRef,
      digitalSecondRef: clock.digitalSecondRef,
      digitalAmpmRef: clock.digitalAmpmRef,
      onPointerDown: clock.handlePointerDown,
      onAdjust: clock.adjustMinutes,
    },
  }
}
