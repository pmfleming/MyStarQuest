import { memo } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import type { ExplorerCityOption } from '../../lib/dayNightExplorer/dayNightExplorerOptions'
import type { WeatherSnapshot } from '../../lib/weather/weatherStore'
import { getWeatherDescription } from '../../lib/weather/weatherConditions'
import { getWeatherVisuals } from '../../lib/weather/weatherVisuals'
import { WeatherScene } from './WeatherScene'

type Props = {
  theme: Theme
  city: ExplorerCityOption
  weather: WeatherSnapshot
  onRetry: () => void
}

export default memo(function WeatherPanel({
  theme,
  city,
  weather,
  onRetry,
}: Props) {
  const { data, loading, error, stale } = weather
  const description = data
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
      }}
    >
      <WeatherScene
        themeId={theme.id}
        visuals={getWeatherVisuals(data)}
        label={`${theme.id === 'princess' ? 'Princess' : 'Heartsping'} outdoors: ${description}`}
      />
      <span className="sr-only" role="status">
        {loading
          ? 'Loading weather…'
          : error || stale
            ? data
              ? 'Showing the last available weather.'
              : 'Weather unavailable'
            : ''}
      </span>
      {(error || (!loading && !data)) && (
        <button
          type="button"
          className="weather-panel-retry"
          style={{
            color: theme.colors.primary,
            background: theme.colors.surface,
          }}
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </section>
  )
})
