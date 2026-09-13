import { useId, type ReactNode } from 'react'
import type { WeatherExploration } from '../../hooks/useWeatherExploration'
import {
  getWeatherWindLevel,
  type WeatherLevel,
} from '../../lib/weather/weatherVisuals'
import WeatherOptionImage from './WeatherOptionImage'
import { useTheme } from '../../contexts/ThemeContext'
import StepperButton from '../ui/StepperButton'
import WeatherThermometer from './WeatherThermometer'
import { uiTokens } from '../../tokens'

const levels: { level: WeatherLevel; label: string }[] = [
  { level: 1, label: 'Light' },
  { level: 2, label: 'Moderate' },
  { level: 3, label: 'Heavy' },
]
const precipitationLevels: WeatherLevel[] = [0, 1, 2, 3]
const windOptions = [
  { speed: 0, label: 'Calm' },
  { speed: 10, label: 'Light' },
  { speed: 25, label: 'Moderate' },
  { speed: 45, label: 'Strong' },
]
const compactButtonStyle = { width: 44, height: 44, fontSize: '1.5rem' }

function CycleControl({
  label,
  value,
  onClick,
  children,
}: {
  label: string
  value: string
  onClick: () => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className="weather-cycle-control">
      <button
        type="button"
        className="weather-cycle-button"
        aria-label={`Cycle ${label.toLowerCase()}`}
        aria-describedby={id}
        onClick={onClick}
      >
        {children}
      </button>
      <output
        id={id}
        className="sr-only"
        aria-label={`${label} value`}
        aria-live="polite"
      >
        {value}
      </output>
    </div>
  )
}

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
  const { theme } = useTheme()
  return (
    <div className="weather-step-control" role="group" aria-labelledby={id}>
      <span id={id} className="sr-only">
        {label}
      </span>
      <div className="weather-step-value">{children}</div>
      <div className="weather-step-buttons">
        <StepperButton
          theme={theme}
          direction="prev"
          ariaLabel={downLabel}
          disabled={downDisabled}
          onClick={onDown}
          style={compactButtonStyle}
        />
        <StepperButton
          theme={theme}
          direction="next"
          ariaLabel={upLabel}
          disabled={upDisabled}
          onClick={onUp}
          style={compactButtonStyle}
        />
      </div>
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
  const windIndex = getWeatherWindLevel(windSpeed ?? 0)
  const windOption = windOptions[windIndex]!
  const precipitationIndex = visuals.precipitationLevel
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
    <div
      className="weather-controls"
      style={{
        width: uiTokens.controlRowWidth,
        color: theme.colors.primary,
        fontFamily: theme.fonts.heading,
      }}
    >
      <StepControl
        label="Temperature"
        upLabel="Increase temperature"
        downLabel="Decrease temperature"
        onUp={() => changeTemperature(1)}
        onDown={() => changeTemperature(-1)}
        upDisabled={temperature >= 45}
        downDisabled={temperature <= -20}
      >
        <WeatherThermometer theme={theme} temperature={visuals.temperature} />
        <output
          className="weather-temperature-value"
          aria-label="Temperature value"
        >
          {visuals.temperature === null ? '—' : `${visuals.temperature}°C`}
        </output>
      </StepControl>
      <CycleControl
        label="Wind"
        value={windSpeed === null ? '—' : `${windSpeed} km/h`}
        onClick={() =>
          adjust({
            windSpeed: windOptions[(windIndex + 1) % windOptions.length]!.speed,
          })
        }
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
      </CycleControl>
      <CycleControl
        label="Precipitation"
        value={visuals.available ? precipitationLabel : '—'}
        onClick={() =>
          adjust({
            precipitationLevel:
              precipitationLevels[
                (precipitationIndex + 1) % precipitationLevels.length
              ]!,
          })
        }
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
      </CycleControl>
    </div>
  )
}
