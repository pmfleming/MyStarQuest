import { useCallback, useMemo, useState } from 'react'
import { useSelectedDate, useSolarTimes } from '../contexts/SelectedDateContext'
import type { Theme } from '../contexts/ThemeContext'
import { getSunPosition } from '../lib/solar'
import { getSeason } from '../lib/seasons'
import { uiTokens } from '../ui/tokens'
import ExplorerClockPanel from './dayNightExplorer/ExplorerClockPanel'
import ExplorerGlobe from './dayNightExplorer/ExplorerGlobe'
import ExplorerLocationSelector from './dayNightExplorer/ExplorerLocationSelector'
import './dayNightExplorer/dayNightExplorer.css'
import {
  buildExplorerInstant,
  getClockTimeForInstant,
  getInitialExplorerClockTime,
} from '../data/dayNightExplorer/dayNightExplorerCalendar'
import {
  getExplorerBackgroundBlend,
  getExplorerBackdropColor,
  getImageForTime,
  resolveBackgroundImage,
} from '../data/dayNightExplorer/dayNightExplorerBackdrop'
import { explorerUi } from '../data/dayNightExplorer/dayNightExplorer.constants'
import {
  formatTime,
  getExplorerRenderScene,
} from '../data/dayNightExplorer/dayNightExplorerMath'
import {
  EXPLORER_FOCUS_OPTIONS,
  getExplorerCityOption,
  type ExplorerCityId,
  type ExplorerFocusId,
  type ExplorerRenderMode,
} from '../data/dayNightExplorer/dayNightExplorerOptions'
import useExplorerClock from './dayNightExplorer/useExplorerClock'
import usePlanetaryGlobe from './dayNightExplorer/usePlanetaryGlobe'

type DayNightExplorerProps = {
  theme: Theme
}

export default function DayNightExplorer({ theme }: DayNightExplorerProps) {
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: explorerUi.explorerGap,
        width: '100%',
        maxWidth: uiTokens.contentMaxWidth,
        margin: '0 auto',
      }}
    >
      <div className="dne-globe-row">
        <ExplorerLocationSelector
          options={EXPLORER_FOCUS_OPTIONS}
          activeFocusId={activeFocusId}
          onSelect={handleFocusSelection}
        />

        <ExplorerGlobe
          theme={theme}
          globeReady={globeReady}
          isInteractive={renderMode === 'rotating-earth'}
          canvasRef={canvasRef}
        />
      </div>

      <ExplorerClockPanel
        theme={theme}
        activityImage={activityImage}
        explorerBackdropColor={explorerBackdropColor}
        explorerBaseBackgroundImage={explorerBaseBackgroundImage}
        explorerOverlayBackgroundImage={explorerOverlayBackgroundImage}
        overlayOpacity={explorerBackgroundBlend.overlayOpacity}
        isDragging={clock.isDragging}
        handTransition={clock.handTransition}
        hourAngle={clock.hourAngle}
        minuteAngle={clock.minuteAngle}
        secondAngle={clock.secondAngle}
        hoursLabel={formattedTime.h}
        minutesLabel={formattedTime.m}
        seconds={clock.seconds}
        ampm={formattedTime.ampm}
        svgRef={clock.svgRef}
        hourHandRef={clock.hourHandRef}
        minuteHandRef={clock.minuteHandRef}
        secondHandRef={clock.secondHandRef}
        onPointerDown={clock.handlePointerDown}
        onAdjust={clock.adjustMinutes}
      />
    </div>
  )
}
