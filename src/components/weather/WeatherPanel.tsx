import { memo } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import type { ExplorerCityOption } from '../../lib/dayNightExplorer/dayNightExplorerOptions'
import type { WeatherSnapshot } from '../../lib/weather/weatherStore'
import {
  getWeatherDescription,
  formatTemperature,
} from '../../lib/weather/weatherConditions'
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
  const visuals = getWeatherVisuals(data)
  const description = data
    ? getWeatherDescription(data)
    : loading
      ? 'Finding today’s weather…'
      : 'Weather unavailable'
  const timeZone = city.location.timeZone
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(weather.now)
  const updated = data
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(data.observedAt)
    : null
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
        visuals={visuals}
        label={`${theme.id === 'princess' ? 'Princess' : 'Heartsping'} outdoors: ${description}`}
      />
      <div className="weather-panel-copy">
        <div>
          <h2 style={{ fontFamily: theme.fonts.heading, fontSize: '1.35rem' }}>
            Weather now · {city.label}
          </h2>
          <p style={{ fontSize: '.9rem' }}>{date}</p>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <p
            className="weather-panel-temperature"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.heading,
            }}
          >
            {formatTemperature(data?.temperature)}
          </p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 8 }}>
            {description}
          </p>
        </div>
        {data && (
          <dl className="weather-panel-details">
            <div>
              <dt>Feels like</dt>
              <dd>{formatTemperature(data.feelsLike)}</dd>
            </div>
            <div>
              <dt>Wind</dt>
              <dd>
                {data.windSpeed == null
                  ? '—'
                  : `${Math.round(data.windSpeed)} km/h`}
              </dd>
            </div>
            <div>
              <dt>Today’s high</dt>
              <dd>{formatTemperature(data.high)}</dd>
            </div>
            <div>
              <dt>Today’s low</dt>
              <dd>{formatTemperature(data.low)}</dd>
            </div>
          </dl>
        )}
        <p className="weather-panel-status" role="status">
          {loading
            ? data
              ? 'Updating weather…'
              : 'Loading weather…'
            : error
              ? data
                ? 'Showing the last available weather.'
                : error
              : stale
                ? 'Showing the last available weather.'
                : updated
                  ? `Last updated ${updated}`
                  : 'Try again to load today’s weather.'}
          {updated && (stale || error) ? ` Last updated ${updated}.` : ''}
        </p>
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
        <a
          className="weather-panel-status"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          style={{ color: theme.colors.text, textDecoration: 'underline' }}
        >
          Weather estimates by Open-Meteo
        </a>
      </div>
    </section>
  )
})
