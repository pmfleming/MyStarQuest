import type { Theme } from '../contexts/ThemeContext'
import { AsyncButton } from './ui/AsyncButton'
import globeIcon from '../assets/cities/earth.svg'
import TimeExplorerClockIcon, {
  type HeaderClock,
} from './TimeExplorerClockIcon'
import teenieGlobeIcon from '../assets/themes/teenie/globe-character.png'
import { getThemeAsset } from '../ui/themeAssets'
import type { ExplorerPanel } from '../features/dayNightExplorer/timeExplorerStorage'
import TimeExplorerCalendarIcon from './TimeExplorerCalendarIcon'
import type { ExplorerCityOption } from '../features/dayNightExplorer/dayNightExplorerOptions'
import TimeExplorerWeatherIcon from './TimeExplorerWeatherIcon'
import {
  WEATHER_LABELS,
  type WeatherScene,
} from '../lib/weather/weatherConditions'
type HeaderIconKind = 'clock' | 'calendar' | 'thermometer' | 'globe'

type Props = {
  theme: Theme
  clock: HeaderClock
  selectedDate: Date
  currentCity: Pick<ExplorerCityOption, 'label' | 'icon'>
  activePanels: ExplorerPanel[]
  weatherLabel: string
  weatherScene: WeatherScene
  togglePanel: (panel: ExplorerPanel) => void
  resetToNow: () => void | Promise<void>
}

export default function TimeExplorerControls({
  theme,
  clock,
  selectedDate,
  currentCity,
  activePanels,
  weatherLabel,
  weatherScene,
  togglePanel,
  resetToNow,
}: Props) {
  const dateLabel = `${selectedDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${selectedDate.getDate()}`
  const descriptions: Partial<Record<ExplorerPanel, string>> = {
    clock: `${clock.hoursLabel}:${clock.minutesLabel} ${clock.ampm}`,
    calendar: dateLabel,
    globe: `Selected city: ${currentCity.label}`,
    weather: `Current weather: ${WEATHER_LABELS[weatherScene]}`,
  }
  const renderIcon = (kind: HeaderIconKind) => {
    if (kind === 'clock') {
      return (
        <TimeExplorerClockIcon
          clock={clock}
          illustrated={theme.id === 'teenie'}
        />
      )
    }
    if (kind === 'calendar') {
      return (
        <TimeExplorerCalendarIcon
          dateLabel={dateLabel}
          illustrated={theme.id === 'teenie'}
        />
      )
    }
    if (kind === 'globe') {
      return (
        <span className="relative block h-16 w-16 max-w-full shrink-0">
          <img
            src={theme.id === 'teenie' ? teenieGlobeIcon : globeIcon}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-contain"
          />
          <img
            src={currentCity.icon}
            alt=""
            aria-hidden="true"
            className="absolute -right-0.5 -bottom-0.5 h-5 w-5 object-contain"
            style={{
              filter:
                'drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white)',
            }}
          />
        </span>
      )
    }
    return <TimeExplorerWeatherIcon themeId={theme.id} scene={weatherScene} />
  }

  return (
    <div
      role="group"
      aria-label="Time Explorer controls"
      className="flex items-stretch p-1"
      style={{
        containerType: 'inline-size',
        borderRadius: 22,
        border: `2px solid ${theme.colors.accent}66`,
        background: theme.colors.surface,
      }}
    >
      <div
        role="group"
        aria-label="Time Explorer views"
        className="grid min-w-0 flex-1 grid-cols-4 gap-1"
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
            title={
              descriptions[option.value]
                ? `${option.label}: ${descriptions[option.value]}`
                : option.label
            }
            aria-description={descriptions[option.value]}
            aria-pressed={activePanels.includes(option.value)}
            onClick={() => togglePanel(option.value)}
            className="flex min-w-0 items-center justify-center rounded-2xl p-0.5 transition active:scale-95"
            style={{
              minHeight: 72,
              background: activePanels.includes(option.value)
                ? theme.colors.primary
                : 'transparent',
              color: activePanels.includes(option.value)
                ? '#fff'
                : theme.colors.text,
            }}
          >
            {renderIcon(option.icon)}
          </button>
        ))}
      </div>
      <div
        className="ml-1 flex shrink-0 items-stretch border-l pl-1"
        style={{
          width: '20%',
          borderColor: `${theme.colors.accent}88`,
        }}
      >
        <AsyncButton
          type="button"
          onClick={resetToNow}
          aria-label="Reset all to now"
          title="Back to now"
          className="flex min-h-[72px] w-full items-center justify-center rounded-2xl p-0.5 transition active:scale-95 disabled:opacity-60"
          style={{
            background: `${theme.colors.primary}10`,
            boxShadow: `inset 0 0 0 1.5px ${theme.colors.primary}55`,
            color: theme.colors.primary,
          }}
        >
          <img
            src={getThemeAsset(theme.id, 'nowIcon')}
            alt=""
            aria-hidden="true"
            className="h-14 w-14 max-w-full object-contain"
          />
        </AsyncButton>
      </div>
    </div>
  )
}
