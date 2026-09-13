import type {
  PrecipitationKind,
  WeatherLevel,
} from '../../lib/weather/weatherVisuals'
import type { ThemeId } from '../../ui/themeOptions'
import { themes } from '../../contexts/ThemeContext'
import { useSelectedDate } from '../../contexts/SelectedDateContext'
import { getSeason } from '../../lib/seasons'
import { resolveBackgroundImage } from '../../features/dayNightExplorer/dayNightExplorerBackdrop'

export default function WeatherOptionImage({
  themeId,
  kind,
  level,
  label,
  unavailable = false,
}: {
  themeId: ThemeId
  kind: PrecipitationKind | 'wind'
  level: WeatherLevel
  label: string
  unavailable?: boolean
}) {
  const { selectedDate } = useSelectedDate()
  const background = resolveBackgroundImage(
    themes[themeId].explorerBackgroundImages,
    'daytime',
    getSeason(selectedDate)
  )
  return (
    <div
      className="weather-option-image"
      role="img"
      aria-label={label}
      data-option-theme={themeId}
    >
      {background && (
        <img
          className="weather-option-environment"
          src={background}
          alt=""
          aria-hidden="true"
        />
      )}
      {!unavailable && (
        <svg
          className="weather-option-effects"
          viewBox="0 0 100 90"
          aria-hidden="true"
        >
          {kind === 'wind'
            ? Array.from({ length: level * 2 }, (_, i) => (
                <path
                  key={i}
                  d={`M${i % 2 === 0 ? -8 : 50} ${24 + i * 11}q18-8 35 0t27-3`}
                  fill="none"
                  stroke="#386a90"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))
            : kind !== 'none' &&
              Array.from({ length: level * 6 }, (_, i) => {
                const x = 6 + ((i * 31) % 88),
                  y = 8 + ((i * 19) % 78)
                const snow =
                  kind === 'snow' || (kind === 'sleet' && i % 2 === 0)
                return snow ? (
                  <path
                    key={i}
                    d={`M${x - 3} ${y}h6M${x} ${y - 3}v6M${x - 2} ${y - 2}l4 4M${x - 2} ${y + 2}l4-4`}
                    stroke="white"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                ) : kind === 'hail' ? (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill="#eefaff"
                    stroke="#8fb6d7"
                    strokeWidth=".7"
                  />
                ) : (
                  <path
                    key={i}
                    d={`M${x + 1} ${y - 3}l-2 5`}
                    stroke={kind === 'freezing-rain' ? '#e9fcff' : '#2871b4'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )
              })}
          {kind === 'freezing-rain' && (
            <path
              d="M3 86h94M8 86l4-7 4 7M77 86l5-10 5 10"
              stroke="#d9f7ff"
              strokeWidth="3"
              fill="#d9f7ff"
            />
          )}
        </svg>
      )}
      {unavailable && (
        <span className="weather-option-unknown" aria-hidden="true">
          ?
        </span>
      )}
    </div>
  )
}
