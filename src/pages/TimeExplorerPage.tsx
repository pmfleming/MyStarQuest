import { lazy, Suspense, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import TopIconButton from '../components/ui/TopIconButton'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { getThemeAsset, hasIllustratedTheme } from '../ui/themeAssets'
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
  formatTemperature,
} from '../lib/weather/weatherConditions'
const WeatherPanel = lazy(() => import('../components/weather/WeatherPanel'))
const SchoolCalendar = lazy(() => import('../components/SchoolCalendar'))

type ExplorerPanel = 'clock' | 'calendar' | 'weather'
type HeaderIconKind = 'clock' | 'calendar' | 'thermometer'

const DEFAULT_HEADER_ICONS = {
  clock: '🕒',
  calendar: '📅',
  thermometer: '🌡️',
} satisfies Record<HeaderIconKind, string>

const TimeExplorerPage = () => {
  const { theme } = useTheme()
  const [activePanel, setActivePanel] = useState<ExplorerPanel>('clock')
  const explorer = useDayNightExplorerModel(theme)
  const weather = useCurrentWeather(explorer.weatherCity)
  const exploration = useWeatherExploration(
    explorer.weatherCity.id,
    weather.data
  )
  const weatherLabel = `Show weather: ${explorer.weatherCity.label}${exploration.isExploring ? `, Your weather, ${getExplorationDescription(exploration)}` : weather.data ? `, ${getWeatherDescription(weather.data)}, ${formatTemperature(weather.data.temperature)}` : ''}`

  const renderIcon = (kind: HeaderIconKind) => {
    if (hasIllustratedTheme(theme.id)) {
      return (
        <img
          src={getThemeAsset(theme.id, `${kind}Icon`)}
          alt=""
          aria-hidden="true"
          style={{
            width: '27px',
            height: '27px',
            objectFit: 'contain',
          }}
        />
      )
    }

    return (
      <span
        aria-hidden="true"
        style={{
          fontSize: '2rem',
          lineHeight: 1,
        }}
      >
        {DEFAULT_HEADER_ICONS[kind]}
      </span>
    )
  }

  return (
    <TabContent
      theme={theme}
      title="Time Explorer"
      headerRight={
        <div className="flex items-center gap-2">
          <TopIconButton
            theme={theme}
            ariaLabel="Show clock"
            onClick={() => setActivePanel('clock')}
            selected={activePanel === 'clock'}
            icon={renderIcon('clock')}
          />

          <TopIconButton
            theme={theme}
            ariaLabel="Show calendar"
            onClick={() => setActivePanel('calendar')}
            selected={activePanel === 'calendar'}
            icon={renderIcon('calendar')}
          />

          <TopIconButton
            theme={theme}
            ariaLabel={weatherLabel}
            onClick={() => setActivePanel('weather')}
            selected={activePanel === 'weather'}
            icon={renderIcon('thermometer')}
          />
        </div>
      }
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        <SpinningPlanet theme={theme} {...explorer.planet} />

        <div
          style={{
            width: '100%',
          }}
        >
          <div style={{ minWidth: 0, width: '100%' }}>
            {activePanel === 'clock' ? (
              <Clock theme={theme} clock={explorer.clock} />
            ) : activePanel === 'calendar' ? (
              <Suspense fallback={<div role="status">Opening calendar…</div>}>
                <SchoolCalendar theme={theme} />
              </Suspense>
            ) : (
              <Suspense fallback={<div role="status">Opening weather…</div>}>
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
        </div>
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
