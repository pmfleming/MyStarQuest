import { memo, useId, type CSSProperties } from 'react'
import type { ThemeId } from '../../ui/themeOptions'
import {
  getWeatherWardrobe,
  getWeatherEnvironment,
  weatherCharacterAnchors,
} from '../../ui/weatherAssets'
import {
  getWeatherOutfit,
  type WeatherVisuals,
} from '../../lib/weather/weatherVisuals'
import './weather.css'
import { RainDrop, WindRibbon } from './WeatherMagic'

function Character({
  source,
  cell,
  themeId,
}: {
  source: string
  cell: number
  themeId: ThemeId
}) {
  const clipId = useId()
  const [footX, footY] = weatherCharacterAnchors[themeId][cell]!
  // This atlas outfit is offset left of its nominal cell; exclude its neighbour.
  const [x, y, width, height] =
    themeId === 'teenie' && cell === 2
      ? [192, 0, 98, 101]
      : [(cell % 4) * 100, Math.floor(cell / 4) * 100, 100, 100]
  return (
    <svg
      viewBox="0 -2 100 104"
      preserveAspectRatio="xMidYMax meet"
      className="weather-character"
      data-weather-character
      aria-hidden="true"
    >
      <g transform={`translate(${50 - footX} ${100 - footY})`}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <rect
              x={x}
              y={y}
              width={width}
              height={Math.min(height, footY - y + 0.5)}
            />
          </clipPath>
        </defs>
        <image
          href={source}
          width="400"
          height="500"
          preserveAspectRatio="none"
          clipPath={`url(#${clipId})`}
        />
      </g>
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
  themeId,
}: {
  visuals: WeatherVisuals
  front: boolean
  themeId: ThemeId
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
    const style: CSSProperties &
      Record<'--fall-delay' | '--wind-drift', string> = {
      '--fall-delay': `${-(index % 11) / 5}s`,
      '--wind-drift': `${drift}px`,
    }
    return (
      <g
        key={index}
        className={`weather-particle weather-particle--${kind}`}
        style={style}
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
          <g
            transform={`translate(${x} ${y}) rotate(${-12 - drift}) scale(.8)`}
          >
            <RainDrop
              themeId={themeId}
              frozen={kind === 'freezing-rain'}
              sparkle={index % 8 === 0}
            />
          </g>
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
  const windDuration = 8 - visuals.windLevel * 1.5
  const windGustCount = visuals.windLevel * 2
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
      <Precipitation visuals={visuals} front={false} themeId={themeId} />
      <div
        className="weather-character-space"
        style={{ filter: visuals.isDay ? undefined : 'brightness(.78)' }}
      >
        <Character
          source={character}
          cell={outfit.band * 2 + Number(outfit.waterproof)}
          themeId={themeId}
        />
      </div>
      <Precipitation visuals={visuals} front themeId={themeId} />
      {visuals.windLevel > 0 && (
        <svg
          className="weather-layer weather-wind"
          viewBox="0 0 400 400"
          data-weather-wind={visuals.windLevel}
          aria-hidden="true"
        >
          {Array.from({ length: windGustCount }, (_, i) => (
            <g
              key={i}
              transform={`translate(0 ${12 + (i * 340) / (windGustCount - 1)})`}
            >
              <g
                className="weather-wind-gust"
                style={{
                  animationDuration: `${windDuration}s`,
                  animationDelay: `${(-i * windDuration) / windGustCount}s`,
                  transform: `translateX(${(i % 2) * 245 - 20}px)`,
                }}
              >
                <g transform="scale(1.2)">
                  <WindRibbon themeId={themeId} />
                </g>
              </g>
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
