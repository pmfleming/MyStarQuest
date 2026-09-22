import { lazy, Suspense, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import { AsyncButton } from '../components/ui/AsyncButton'
import globeIcon from '../assets/cities/earth.svg'
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

type ExplorerPanel = 'clock' | 'calendar' | 'weather' | 'globe'
type HeaderIconKind = 'clock' | 'calendar' | 'thermometer' | 'globe'

const DEFAULT_HEADER_ICONS = {
  clock: '🕒',
  calendar: '📅',
  thermometer: '🌡️',
  globe: '🌍',
} satisfies Record<HeaderIconKind, string>

const TimeExplorerPage = () => {
  const { theme } = useTheme()
  const [activePanels, setActivePanels] = useState<ExplorerPanel[]>([
    'globe',
    'clock',
  ])
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

  const renderIcon = (kind: HeaderIconKind) => {
    if (hasIllustratedTheme(theme.id)) {
      return (
        <img
          src={
            kind === 'globe'
              ? globeIcon
              : getThemeAsset(theme.id, `${kind}Icon`)
          }
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
          className="grid grid-cols-4 gap-1 p-1"
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
              {
                value: 'globe',
                label: 'Globe',
                icon: 'globe',
                ariaLabel: 'Show globe',
              },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.ariaLabel}
              aria-pressed={activePanels.includes(option.value)}
              onClick={() => togglePanel(option.value)}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition active:scale-95"
              style={{
                minHeight: 72,
                background: activePanels.includes(option.value)
                  ? theme.colors.primary
                  : 'transparent',
                color: activePanels.includes(option.value)
                  ? '#fff'
                  : theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: 'clamp(0.75rem, 3vw, 1rem)',
                fontWeight: 700,
              }}
            >
              {renderIcon(option.icon)}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <AsyncButton
          type="button"
          onClick={resetToNow}
          aria-label="Reset all to now"
          title="Reset weather, calendar, clock, and globe to now"
          className="flex min-h-11 items-center justify-center gap-2 self-end rounded-2xl px-4 py-2 transition active:scale-95"
          style={{
            background: theme.colors.surface,
            border: `2px solid ${theme.colors.accent}`,
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontWeight: 700,
          }}
        >
          <img
            src={getThemeAsset(theme.id, 'resetIcon')}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 object-contain"
          />
          <span>Reset to now</span>
        </AsyncButton>
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
