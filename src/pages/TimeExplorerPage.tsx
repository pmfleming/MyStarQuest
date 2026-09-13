import { useMemo, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import TopIconButton from '../components/ui/TopIconButton'
import SchoolCalendar from '../components/SchoolCalendar'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { getThemeAsset, hasIllustratedTheme } from '../ui/themeAssets'
import SpinningPlanet from '../components/dayNightExplorer/SpinningPlanet'
import Clock from '../components/dayNightExplorer/Clock'
import useDayNightExplorerModel from '../components/dayNightExplorer/useDayNightExplorerModel'
import '../components/dayNightExplorer/dayNightExplorer.css'
import { useCurrentWeather } from '../hooks/useCurrentWeather'
import { getWeatherVisuals } from '../lib/weather/weatherVisuals'
import {
  getWeatherDescription,
  formatTemperature,
} from '../lib/weather/weatherConditions'
import WeatherPanel from '../components/weather/WeatherPanel'
import { WeatherScene } from '../components/weather/WeatherScene'

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
  const weatherVisuals = useMemo(
    () => getWeatherVisuals(weather.data),
    [weather.data]
  )
  const weatherLabel = `Show weather: ${explorer.weatherCity.label}${weather.data ? `, ${getWeatherDescription(weather.data)}, ${formatTemperature(weather.data.temperature)}` : ''}`

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
            icon={
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <WeatherScene
                  themeId={theme.id}
                  visuals={weatherVisuals}
                  label=""
                  decorative
                  compact
                />
              </div>
            }
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
              <SchoolCalendar theme={theme} />
            ) : (
              <WeatherPanel
                theme={theme}
                city={explorer.weatherCity}
                weather={weather}
                onRetry={weather.retry}
              />
            )}
          </div>
        </div>
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
