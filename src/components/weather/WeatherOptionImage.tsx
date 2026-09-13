import type {
  PrecipitationKind,
  WeatherLevel,
} from '../../lib/weather/weatherVisuals'
import type { ThemeId } from '../../ui/themeOptions'
import { themes } from '../../contexts/ThemeContext'
import { useSelectedDate } from '../../contexts/SelectedDateContext'
import { getSeason } from '../../lib/seasons'
import { resolveBackgroundImage } from '../../features/dayNightExplorer/dayNightExplorerBackdrop'
import { RainDrop, WindRibbon } from './WeatherMagic'

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
            ? Array.from({ length: level }, (_, i) => (
                <g
                  key={i}
                  transform={`translate(${i % 2 === 0 ? 0 : 8} ${8 + i * 21}) scale(.95)`}
                >
                  <WindRibbon themeId={themeId} />
                </g>
              ))
            : kind !== 'none' &&
              Array.from({ length: level * 3 }, (_, i) => {
                const x = 12 + ((i * 31) % 72),
                  y = 15 + ((i * 23) % 62)
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
                  <g key={i} transform={`translate(${x} ${y}) rotate(-12)`}>
                    <RainDrop
                      themeId={themeId}
                      frozen={kind === 'freezing-rain'}
                      sparkle={i % 3 === 0}
                    />
                  </g>
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
