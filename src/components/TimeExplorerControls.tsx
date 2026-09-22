import type { Theme } from '../contexts/ThemeContext'
import { AsyncButton } from './ui/AsyncButton'
import globeIcon from '../assets/cities/earth.svg'
import teenieClockIcon from '../assets/themes/teenie/clock-character.png'
import teenieWeatherIcon from '../assets/themes/teenie/weather-character.png'
import teenieGlobeIcon from '../assets/themes/teenie/globe-character.png'
import { getThemeAsset, hasIllustratedTheme } from '../ui/themeAssets'
import type { ExplorerPanel } from '../features/dayNightExplorer/timeExplorerStorage'
type HeaderIconKind = 'clock' | 'calendar' | 'thermometer' | 'globe'

const TEENIE_HEADER_ICONS = {
  clock: teenieClockIcon,
  thermometer: teenieWeatherIcon,
  globe: teenieGlobeIcon,
}

const DEFAULT_HEADER_ICONS = {
  clock: '🕒',
  calendar: '📅',
  thermometer: '🌡️',
  globe: '🌍',
} satisfies Record<HeaderIconKind, string>

type Props = {
  theme: Theme
  activePanels: ExplorerPanel[]
  weatherLabel: string
  togglePanel: (panel: ExplorerPanel) => void
  resetToNow: () => void | Promise<void>
}

export default function TimeExplorerControls({
  theme,
  activePanels,
  weatherLabel,
  togglePanel,
  resetToNow,
}: Props) {
  const renderIcon = (kind: HeaderIconKind) => {
    if (hasIllustratedTheme(theme.id)) {
      const src =
        theme.id === 'teenie' && kind !== 'calendar'
          ? TEENIE_HEADER_ICONS[kind]
          : kind === 'globe'
            ? globeIcon
            : getThemeAsset(theme.id, `${kind}Icon`)
      return (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 max-w-full object-contain"
        />
      )
    }

    return (
      <span
        aria-hidden="true"
        style={{
          fontSize: 'clamp(2.5rem, 15cqi, 3.5rem)',
          lineHeight: 1,
        }}
      >
        {DEFAULT_HEADER_ICONS[kind]}
      </span>
    )
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
            title={option.label}
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
