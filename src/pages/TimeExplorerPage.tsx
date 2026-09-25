import { lazy, Suspense, useEffect, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useSelectedDate } from '../contexts/SelectedDateContext'
import TabContent from '../components/TabContent'
import TimeExplorerControls from '../components/TimeExplorerControls'
import {
  readTimeExplorerState,
  saveTimeExplorerState,
  type ExplorerPanel,
} from '../features/dayNightExplorer/timeExplorerStorage'
import ResourceLoadingIcon from '../components/ui/ResourceLoadingIcon'
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
  const globeVisible = activePanels.includes('globe')
  const explorer = useDayNightExplorerModel(theme, globeVisible)
  const togglePanel = (panel: ExplorerPanel) => {
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
    <TabContent theme={theme} title="Time Explorer">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
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
        {globeVisible && <SpinningPlanet theme={theme} {...explorer.planet} />}
        {activePanels.includes('clock') && (
          <Clock theme={theme} clock={explorer.clock} />
        )}
        {activePanels.includes('calendar') && (
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <ResourceLoadingIcon
                  src={getThemeAsset(theme.id, 'calendarIcon')}
                  loading
                  label="Loading calendar"
                />
              </div>
            }
          >
            <SchoolCalendar theme={theme} />
          </Suspense>
        )}
        {activePanels.includes('weather') && (
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <ResourceLoadingIcon
                  src={getThemeAsset(theme.id, 'thermometerIcon')}
                  loading
                  label="Loading weather"
                />
              </div>
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
        )}
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
