import { AsyncButton } from '../ui/AsyncButton'
import { memo } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import type { WeatherCity } from '../../lib/weather/weatherData'
import type { WeatherSnapshot } from '../../lib/weather/weatherStore'
import { getWeatherDescription } from '../../lib/weather/weatherConditions'
import {
  getExplorationDescription,
  type WeatherExploration,
} from '../../hooks/useWeatherExploration'
import WeatherControls from './WeatherControls'
import { WeatherScene } from './WeatherScene'
import { getThemeAsset } from '../../ui/themeAssets'

type Props = {
  theme: Theme
  city: WeatherCity
  weather: WeatherSnapshot
  exploration: WeatherExploration
  onRetry: () => void | Promise<void>
}

export default memo(function WeatherPanel({
  theme,
  city,
  weather,
  exploration,
  onRetry,
}: Props) {
  const { data, loading, error, stale } = weather
  const description = exploration.isExploring
    ? `Your weather: ${getExplorationDescription(exploration)}`
    : data
      ? getWeatherDescription(data)
      : loading
        ? 'Finding today’s weather…'
        : 'Weather unavailable'
  return (
    <section
      className="weather-panel"
      aria-label={`Weather in ${city.label}`}
      style={{
        borderColor: theme.colors.accent,
        background: theme.colors.surface,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        accentColor: theme.colors.primary,
      }}
    >
      <WeatherScene
        themeId={theme.id}
        visuals={exploration.visuals}
        label={`${theme.id === 'princess' ? 'Princess' : 'Heartsping'} outdoors: ${description}`}
      />
      <WeatherControls exploration={exploration} />
      <div className="weather-controls-footer">
        <span className="sr-only" role="status">
          {exploration.isExploring
            ? 'Your weather'
            : loading
              ? 'Loading weather…'
              : error || stale
                ? data
                  ? 'Last available weather'
                  : 'Weather unavailable'
                : 'Current weather'}
        </span>
        {exploration.isExploring && (
          <AsyncButton
            type="button"
            aria-label="Reset to current"
            title="Reset to current"
            onClick={exploration.reset}
          >
            <img
              src={getThemeAsset(theme.id, 'resetIcon')}
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
            />
          </AsyncButton>
        )}
      </div>
      {(error || (!loading && !data)) && (
        <AsyncButton
          type="button"
          className="weather-panel-retry"
          style={{
            color: theme.colors.primary,
            background: theme.colors.surface,
          }}
          onClick={onRetry}
        >
          Try again
        </AsyncButton>
      )}
    </section>
  )
})
