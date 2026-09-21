import { lazy, Suspense, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import { AsyncButton } from '../components/ui/AsyncButton'
import ResourceLoadingIcon from '../components/ui/ResourceLoadingIcon'
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
            width: '32px',
            height: '32px',
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
    <TabContent theme={theme} title="Time Explorer">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        <div
          role="group"
          aria-label="Time Explorer views"
          className="grid grid-cols-3 gap-1 p-1"
          style={{
            borderRadius: 22,
            border: `2px solid ${theme.colors.accent}66`,
            background: theme.colors.surface,
          }}
        >
          {(
            [
              {
                value: 'clock',
                label: 'Clock',
                icon: 'clock',
                ariaLabel: 'Show clock',
              },
              {
                value: 'calendar',
                label: 'Calendar',
                icon: 'calendar',
                ariaLabel: 'Show calendar',
              },
              {
                value: 'weather',
                label: 'Weather',
                icon: 'thermometer',
                ariaLabel: weatherLabel,
              },
            ] as const
          ).map((option) => (
            <AsyncButton
              key={option.value}
              aria-label={option.ariaLabel}
              aria-pressed={activePanel === option.value}
              onClick={() => setActivePanel(option.value)}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition active:scale-95"
              style={{
                minHeight: 72,
                background:
                  activePanel === option.value
                    ? theme.colors.primary
                    : 'transparent',
                color:
                  activePanel === option.value ? '#fff' : theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {renderIcon(option.icon)}
              <span>{option.label}</span>
            </AsyncButton>
          ))}
        </div>
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
            ) : (
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
        </div>
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
