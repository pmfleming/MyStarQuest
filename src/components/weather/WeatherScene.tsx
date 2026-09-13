import { memo, type CSSProperties } from 'react'
import type { ThemeId } from '../../ui/themeOptions'
import {
  getWeatherWardrobe,
  getWeatherEnvironment,
} from '../../ui/weatherAssets'
import {
  getWeatherOutfit,
  type WeatherVisuals,
} from '../../lib/weather/weatherVisuals'
import './weather.css'

function Character({ source, cell }: { source: string; cell: number }) {
  return (
    <svg
      viewBox={`${(cell % 4) * 100} ${Math.floor(cell / 4) * 100} 100 100`}
      preserveAspectRatio="xMidYMax meet"
      className="weather-character"
      data-weather-character
      aria-hidden="true"
    >
      <image
        href={source}
        width="400"
        height="500"
        preserveAspectRatio="none"
      />
    </svg>
  )
}

const Cloud = ({
  x,
  y,
  scale,
  shade,
}: {
  x: number
  y: number
  scale: number
  shade: string
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${scale})`}
    d="M8 46C-7 27 7 9 25 13C29-8 61-11 72 10C89 2 112 16 110 35C136 36 137 64 113 65H22C6 65 0 56 8 46Z"
    fill={shade}
    stroke="white"
    strokeOpacity=".18"
    strokeWidth="2"
  />
)

function Precipitation({
  visuals,
  front,
}: {
  visuals: WeatherVisuals
  front: boolean
}) {
  const count = [0, 20, 44, 80][visuals.precipitationLevel] ?? 0
  if (!count || visuals.precipitation === 'none') return null
  const particles = Array.from({ length: count }, (_, index) => {
    if ((index % 2 === 0) !== front) return null
    const x = ((index * 97 + 17) % 420) - 10
    const y = ((index * 71 + 29) % 500) - 70
    const kind =
      visuals.precipitation === 'sleet'
        ? index % 3 === 0
          ? 'snow'
          : 'rain'
        : visuals.precipitation
    const drift = visuals.windLevel * 8
    return (
      <g
        key={index}
        className={`weather-particle weather-particle--${kind}`}
        style={
          {
            '--fall-delay': `${-(index % 11) / 5}s`,
            '--wind-drift': `${drift}px`,
          } as CSSProperties
        }
      >
        {kind === 'snow' ? (
          <path
            d={`M${x - 4} ${y}h8M${x} ${y - 4}v8M${x - 3} ${y - 3}l6 6M${x - 3} ${y + 3}l6-6`}
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : kind === 'hail' ? (
          <circle
            cx={x}
            cy={y}
            r={3 + (index % 2)}
            fill="#edf9ff"
            stroke="#a9cadf"
          />
        ) : (
          <path
            d={`M${x} ${y}l${2 + drift / 4} ${9 + visuals.precipitationLevel * 3}`}
            stroke={kind === 'freezing-rain' ? '#e6fcff' : '#9cd8fa'}
            strokeWidth={kind === 'freezing-rain' ? 2.2 : 1.8}
            strokeLinecap="round"
          />
        )}
      </g>
    )
  })
  return (
    <svg
      className="weather-layer weather-precipitation"
      viewBox="0 0 400 400"
      aria-hidden="true"
      data-weather-precipitation={visuals.precipitation}
      data-level={visuals.precipitationLevel}
    >
      {particles}
    </svg>
  )
}

type WeatherSceneProps = {
  themeId: ThemeId
  visuals: WeatherVisuals
  label: string
  decorative?: boolean
  compact?: boolean
}

export const WeatherScene = memo(function WeatherScene({
  themeId,
  visuals,
  label,
  decorative = false,
  compact = false,
}: WeatherSceneProps) {
  const outfit = getWeatherOutfit(visuals)
  const character = getWeatherWardrobe(themeId)
  const snow =
    visuals.precipitationLevel > 0 &&
    (visuals.precipitation === 'snow' || visuals.precipitation === 'sleet')
  const wet = visuals.precipitationLevel > 0 && !snow
  const dark = visuals.isDay ? (visuals.cloudLevel === 3 ? 0.26 : 0) : 0.6
  const cloudShade = visuals.thunder
    ? '#647083'
    : visuals.cloudLevel === 3
      ? '#a8b1be'
      : '#f4f8ff'
  return (
    <div
      className="weather-scene"
      data-compact={compact}
      data-available={visuals.available}
      data-outfit-band={outfit.band}
      data-outfit-waterproof={outfit.waterproof}
      role={decorative ? undefined : 'img'}
      aria-label={
        decorative
          ? undefined
          : `${label}${visuals.available ? `. Wearing ${outfit.description}.` : ''}`
      }
      aria-hidden={decorative || undefined}
    >
      <img
        className="weather-layer weather-environment"
        src={getWeatherEnvironment(themeId)}
        alt=""
        decoding="async"
      />
      <div
        className="weather-layer"
        style={{ background: `rgba(14, 25, 62, ${dark})` }}
      />
      {visuals.available && (
        <svg className="weather-layer" viewBox="0 0 400 400" aria-hidden="true">
          {visuals.cloudLevel < 3 &&
            (visuals.isDay ? (
              <g
                fill="#ffe26d"
                stroke="#ffd044"
                strokeWidth="4"
                strokeLinecap="round"
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <path
                    key={index}
                    d="M78 27V17"
                    transform={`rotate(${index * 45} 78 65)`}
                  />
                ))}
                <circle cx="78" cy="65" r="27" />
              </g>
            ) : (
              <g fill="#fff2bd">
                <path d="M98 32a32 32 0 1 0 10 55A34 34 0 0 1 98 32Z" />
                {[150, 220, 300, 355].map((x, i) => (
                  <circle key={x} cx={x} cy={25 + (i % 2) * 35} r="2" />
                ))}
              </g>
            ))}
          {visuals.cloudLevel > 0 && (
            <Cloud
              x={visuals.cloudLevel === 1 ? 235 : 68}
              y={37}
              scale={visuals.cloudLevel === 1 ? 0.8 : 1.1}
              shade={cloudShade}
            />
          )}
          {visuals.cloudLevel >= 2 && (
            <Cloud x={235} y={50} scale={1.1} shade={cloudShade} />
          )}
          {visuals.cloudLevel === 3 && (
            <>
              <Cloud x={-18} y={10} scale={1.35} shade={cloudShade} />
              <Cloud x={132} y={-8} scale={1.5} shade={cloudShade} />
            </>
          )}
          {visuals.thunder && (
            <path
              d="M307 105l-26 39h18l-20 41 46-53h-20l22-27Z"
              fill="#ffe885"
              stroke="#fff5c9"
              strokeWidth="2"
            />
          )}
          {snow && (
            <path
              d="M0 349Q65 330 110 350T220 346T330 347T400 342V400H0Z"
              fill="#edf4fa"
              opacity={visuals.precipitationLevel === 3 ? 0.97 : 0.75}
            />
          )}
          {wet && (
            <g
              fill={
                visuals.precipitation === 'freezing-rain'
                  ? '#d3effb'
                  : '#75bbda'
              }
              opacity=".7"
            >
              <ellipse cx="83" cy="364" rx="49" ry="9" />
              <ellipse cx="320" cy="355" rx="35" ry="7" />
            </g>
          )}
        </svg>
      )}
      <Precipitation visuals={visuals} front={false} />
      <div
        className="weather-character-space"
        style={{ filter: visuals.isDay ? undefined : 'brightness(.78)' }}
      >
        <Character
          source={character}
          cell={outfit.band * 2 + Number(outfit.waterproof)}
        />
      </div>
      <Precipitation visuals={visuals} front />
      {visuals.windLevel > 0 && (
        <svg
          className="weather-layer weather-wind"
          viewBox="0 0 400 400"
          data-weather-wind={visuals.windLevel}
          aria-hidden="true"
        >
          {Array.from({ length: visuals.windLevel * 2 }, (_, i) => (
            <g
              key={i}
              transform={`translate(${(i % 2) * 245 - 20} ${130 + i * 37})`}
            >
              <path
                d="M0 10Q30-1 65 10T125 4"
                stroke="#ffffff"
                strokeOpacity=".85"
                strokeWidth="2"
                fill="none"
              />
              {visuals.windLevel >= 2 && (
                <path d="M28 20Q38 4 52 17Q43 32 28 20Z" fill="#d5a24d" />
              )}
            </g>
          ))}
        </svg>
      )}
      {visuals.fog && <div className="weather-layer weather-fog" />}
      {!visuals.available && (
        <span className="weather-unknown" aria-hidden="true">
          ?
        </span>
      )}
    </div>
  )
})
