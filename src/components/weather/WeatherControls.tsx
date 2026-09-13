import { useId, type ReactNode } from 'react'
import {
  getExplorationPrecipitation,
  type WeatherExploration,
} from '../../hooks/useWeatherExploration'
import {
  getWeatherWindLevel,
  type PrecipitationKind,
  type WeatherLevel,
} from '../../lib/weather/weatherVisuals'
import WeatherOptionImage from './WeatherOptionImage'
import { useTheme } from '../../contexts/ThemeContext'

const levels: { level: WeatherLevel; label: string }[] = [
  { level: 1, label: 'Light' },
  { level: 2, label: 'Moderate' },
  { level: 3, label: 'Heavy' },
]
const getPrecipitationOptions = (temperature: number) => {
  const kinds: PrecipitationKind[] = [
    getExplorationPrecipitation(temperature),
    'hail',
  ]
  if (temperature <= 0) kinds.push('freezing-rain')
  return [
    {
      kind: 'none' as PrecipitationKind,
      level: 0 as WeatherLevel,
    },
    ...kinds.flatMap((kind) =>
      levels.map(({ level }) => ({
        kind,
        level,
      }))
    ),
  ]
}
const windOptions = [
  { speed: 0, label: 'Calm' },
  { speed: 10, label: 'Light' },
  { speed: 25, label: 'Moderate' },
  { speed: 45, label: 'Strong' },
]

function StepControl({
  label,
  children,
  onUp,
  onDown,
  upDisabled,
  downDisabled,
  upLabel,
  downLabel,
}: {
  label: string
  children: ReactNode
  onUp: () => void
  onDown: () => void
  upDisabled: boolean
  downDisabled: boolean
  upLabel: string
  downLabel: string
}) {
  const id = useId()
  return (
    <div className="weather-step-control" role="group" aria-labelledby={id}>
      <span id={id} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        className="weather-step-arrow"
        aria-label={upLabel}
        disabled={upDisabled}
        onClick={onUp}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
      <div className="weather-step-value">{children}</div>
      <button
        type="button"
        className="weather-step-arrow"
        aria-label={downLabel}
        disabled={downDisabled}
        onClick={onDown}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  )
}

export default function WeatherControls({
  exploration,
}: {
  exploration: WeatherExploration
}) {
  const { visuals, windSpeed, adjust } = exploration
  const { theme } = useTheme()
  const temperature = visuals.temperature ?? 18
  const precipitationOptions = getPrecipitationOptions(temperature)
  const windIndex = getWeatherWindLevel(windSpeed ?? 0)
  const windOption = windOptions[windIndex]!
  const matchingIndex = precipitationOptions.findIndex(
    (option) =>
      option.kind === visuals.precipitation &&
      option.level === visuals.precipitationLevel
  )
  // Report observed weather as received, even outside the explorer's simple model.
  const precipitationIndex =
    matchingIndex < 0 ? visuals.precipitationLevel : matchingIndex
  const precipitationLabel =
    visuals.precipitationLevel === 0
      ? 'None'
      : `${levels[visuals.precipitationLevel - 1]!.label} ${visuals.precipitation.replace('-', ' ')}`
  const changeTemperature = (amount: number) => {
    const next = Math.round((temperature + amount) * 10) / 10
    adjust({
      temperature: amount > 0 ? Math.min(45, next) : Math.max(-20, next),
    })
  }
  return (
    <div className="weather-controls">
      <StepControl
        label="Temperature"
        upLabel="Increase temperature"
        downLabel="Decrease temperature"
        onUp={() => changeTemperature(1)}
        onDown={() => changeTemperature(-1)}
        upDisabled={temperature >= 45}
        downDisabled={temperature <= -20}
      >
        <output
          className="weather-temperature-value"
          aria-label="Temperature value"
        >
          {visuals.temperature === null ? '—' : `${visuals.temperature}°C`}
        </output>
      </StepControl>
      <StepControl
        label="Wind"
        upLabel="Increase wind"
        downLabel="Decrease wind"
        onUp={() =>
          adjust({ windSpeed: windOptions[Math.min(3, windIndex + 1)]!.speed })
        }
        onDown={() =>
          adjust({ windSpeed: windOptions[Math.max(0, windIndex - 1)]!.speed })
        }
        upDisabled={windIndex === 3}
        downDisabled={windSpeed !== null && windIndex === 0}
      >
        <WeatherOptionImage
          themeId={theme.id}
          kind="wind"
          level={windIndex}
          label={
            windSpeed === null ? 'Wind unavailable' : `${windOption.label} wind`
          }
          unavailable={windSpeed === null}
        />
        <output aria-label="Wind value">
          {windSpeed === null ? '—' : `${windSpeed} km/h`}
        </output>
      </StepControl>
      <StepControl
        label="Precipitation"
        upLabel="Next precipitation option"
        downLabel="Previous precipitation option"
        onUp={() =>
          adjust({
            precipitation:
              precipitationOptions[
                Math.min(
                  precipitationOptions.length - 1,
                  precipitationIndex + 1
                )
              ]!,
          })
        }
        onDown={() =>
          adjust({
            precipitation:
              precipitationOptions[Math.max(0, precipitationIndex - 1)]!,
          })
        }
        upDisabled={precipitationIndex === precipitationOptions.length - 1}
        downDisabled={visuals.available && precipitationIndex === 0}
      >
        <WeatherOptionImage
          themeId={theme.id}
          kind={visuals.precipitation}
          level={visuals.precipitationLevel}
          label={
            visuals.available ? precipitationLabel : 'Precipitation unavailable'
          }
          unavailable={!visuals.available}
        />
        <output aria-label="Precipitation value">
          {visuals.available ? precipitationLabel : '—'}
        </output>
      </StepControl>
    </div>
  )
}
