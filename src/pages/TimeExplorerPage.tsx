import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useSelectedDate } from '../contexts/SelectedDateContext'
import TabContent from '../components/TabContent'
import TimeExplorerControls from '../components/TimeExplorerControls'
import WhimsicalViewTransition from '../components/WhimsicalViewTransition'
import {
  readTimeExplorerState,
  saveTimeExplorerState,
  type ExplorerPanel,
} from '../features/dayNightExplorer/timeExplorerStorage'
import ContentLoadingSkeleton from '../components/ui/ContentLoadingSkeleton'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { getThemeAsset } from '../ui/themeAssets'
import SpinningPlanet from '../features/dayNightExplorer/SpinningPlanet'
import Clock from '../features/dayNightExplorer/Clock'
import useDayNightExplorerModel from '../features/dayNightExplorer/useDayNightExplorerModel'
import '../features/dayNightExplorer/dayNightExplorer.css'
import { useCurrentWeather } from '../hooks/useCurrentWeather'
import {
  useWeatherExploration,
  getExplorationDescription,
} from '../hooks/useWeatherExploration'
import {
  getWeatherDescription,
  getWeatherScene,
  formatTemperature,
} from '../lib/weather/weatherConditions'
const WeatherPanel = lazy(() => import('../components/weather/WeatherPanel'))
const SchoolCalendar = lazy(() => import('../components/SchoolCalendar'))

const TimeExplorerPage = () => {
  const { theme } = useTheme()
  const { selectedDate } = useSelectedDate()
  const [activePanels, setActivePanels] = useState<ExplorerPanel[]>(
    () => readTimeExplorerState().activePanels
  )
  useEffect(() => {
    saveTimeExplorerState({ activePanels })
  }, [activePanels])
  const [renderedPanels, setRenderedPanels] = useState(activePanels)
  const [animatePanelMounts, setAnimatePanelMounts] = useState(false)
  const [revealedPanel, setRevealedPanel] = useState<ExplorerPanel | null>(null)
  if (activePanels.some((panel) => !renderedPanels.includes(panel))) {
    setRenderedPanels([...new Set([...renderedPanels, ...activePanels])])
  }
  const finishExit = (panel: ExplorerPanel) => {
    if (!activePanels.includes(panel)) {
      setRenderedPanels((current) => current.filter((value) => value !== panel))
    }
  }
  // Keep the WebGL scene alive until its closing animation has finished.
  const globeVisible = renderedPanels.includes('globe')
  const explorer = useDayNightExplorerModel(theme, globeVisible)
  const togglePanel = (panel: ExplorerPanel) => {
    setAnimatePanelMounts(true)
    setRevealedPanel(activePanels.includes(panel) ? null : panel)
    setActivePanels((current) =>
      current.includes(panel)
        ? current.filter((value) => value !== panel)
        : [...current.slice(-1), panel]
    )
  }
  const weather = useCurrentWeather(explorer.weatherCity)
  const exploration = useWeatherExploration(
    explorer.weatherCity.id,
    weather.data
  )
  const resetToNow = () => {
    explorer.resetToNow()
    exploration.reset()
    return weather.retry()
  }
  const weatherLabel = `Show weather: ${explorer.weatherCity.label}${exploration.isExploring ? `, Your weather, ${getExplorationDescription(exploration)}` : weather.data ? `, ${getWeatherDescription(weather.data)}, ${formatTemperature(weather.data.temperature)}` : ''}`

  return (
    <TabContent
      theme={theme}
      collapseHeader={false}
      headerHeight={uiTokens.pageControlHeight}
      header={
        <header aria-label="Time Explorer controls">
          <TimeExplorerControls
            theme={theme}
            clock={explorer.clock}
            selectedDate={selectedDate}
            currentCity={explorer.weatherCity}
            activePanels={activePanels}
            weatherLabel={weatherLabel}
            weatherScene={
              weather.data ? getWeatherScene(weather.data) : 'unavailable'
            }
            togglePanel={togglePanel}
            resetToNow={resetToNow}
          />
        </header>
      }
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={
          {
            ...getSurfaceWidthConstraints(),
            '--explorer-panel-gap': `${uiTokens.singleVerticalSpace}px`,
            paddingBottom: '96px',
          } as CSSProperties
        }
      >
        {globeVisible && (
          <WhimsicalViewTransition
            animateOnMount={animatePanelMounts}
            revealOnOpen={revealedPanel === 'globe'}
            open={activePanels.includes('globe')}
            onExited={() => finishExit('globe')}
          >
            <SpinningPlanet theme={theme} {...explorer.planet} />
          </WhimsicalViewTransition>
        )}
        {renderedPanels.includes('clock') && (
          <WhimsicalViewTransition
            animateOnMount={animatePanelMounts}
            revealOnOpen={revealedPanel === 'clock'}
            open={activePanels.includes('clock')}
            onExited={() => finishExit('clock')}
          >
            <Clock theme={theme} clock={explorer.clock} />
          </WhimsicalViewTransition>
        )}
        {renderedPanels.includes('calendar') && (
          <WhimsicalViewTransition
            animateOnMount={animatePanelMounts}
            revealOnOpen={revealedPanel === 'calendar'}
            open={activePanels.includes('calendar')}
            onExited={() => finishExit('calendar')}
          >
            <Suspense
              fallback={
                <ContentLoadingSkeleton
                  icon={getThemeAsset(theme.id, 'calendarIcon')}
                  label="Loading calendar"
                />
              }
            >
              <SchoolCalendar theme={theme} />
            </Suspense>
          </WhimsicalViewTransition>
        )}
        {renderedPanels.includes('weather') && (
          <WhimsicalViewTransition
            animateOnMount={animatePanelMounts}
            revealOnOpen={revealedPanel === 'weather'}
            open={activePanels.includes('weather')}
            onExited={() => finishExit('weather')}
          >
            <Suspense
              fallback={
                <ContentLoadingSkeleton
                  icon={getThemeAsset(theme.id, 'thermometerIcon')}
                  label="Loading weather"
                />
              }
            >
              <WeatherPanel
                theme={theme}
                city={explorer.weatherCity}
                weather={weather}
                exploration={exploration}
                onRetry={weather.retry}
              />
            </Suspense>
          </WhimsicalViewTransition>
        )}
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
