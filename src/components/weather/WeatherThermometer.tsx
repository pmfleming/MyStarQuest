import { useId } from 'react'
import type { Theme } from '../../contexts/ThemeContext'

export default function WeatherThermometer({
  theme,
  temperature,
}: {
  theme: Theme
  temperature: number | null
}) {
  const id = useId()
  const level = Math.min(1, Math.max(0, ((temperature ?? -20) + 20) / 65))
  const hue = Math.round(
    220 * (1 - Math.min(1, Math.max(0, temperature ?? 0) / 35))
  )
  const color = temperature === null ? '#94a3b8' : `hsl(${hue} 78% 46%)`
  const top = 72 - level * 45
  return (
    <svg
      className="weather-thermometer"
      width="112"
      height="131"
      viewBox="0 0 96 112"
      aria-hidden="true"
      style={{ color }}
    >
      <defs>
        <linearGradient id={`${id}-frame`} x2="1" y2="1">
          <stop stopColor="white" />
          <stop offset="1" stopColor={theme.colors.accent} />
        </linearGradient>
        <linearGradient
          id={`${id}-liquid`}
          gradientUnits="userSpaceOnUse"
          x1="39"
          x2="54"
          y1="0"
          y2="0"
        >
          <stop stopColor="currentColor" />
          <stop offset=".65" stopColor="currentColor" />
          <stop offset="1" stopColor="white" stopOpacity=".7" />
        </linearGradient>
      </defs>
      <ellipse
        cx="46"
        cy="61"
        rx="33"
        ry="47"
        fill={theme.colors.accent}
        opacity=".18"
      />
      <ellipse
        cx="46"
        cy="61"
        rx="37"
        ry="49"
        fill="none"
        stroke={theme.colors.accent}
        strokeWidth="1.5"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      {theme.id === 'princess' ? (
        <g
          fill="#ffda75"
          stroke={theme.colors.primary}
          strokeWidth="1.3"
          strokeLinejoin="round"
        >
          <path d="m16 24 2.5 6 6 2.5-6 2.5-2.5 6-2.5-6L7 32.5l6.5-2.5Z" />
          <path d="m78 75 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
          <path d="m23 97 5 5-5 6-5-6Z" fill={theme.colors.accent} />
        </g>
      ) : (
        <g
          fill={theme.colors.accent}
          stroke={theme.colors.primary}
          strokeWidth="1.3"
          strokeLinejoin="round"
        >
          <path d="M17 38 9 30C3 23 14 20 17 26c3-6 14-3 8 4Z" />
          <path d="m79 90-7-7c-5-6 4-9 7-4 3-5 12-2 7 4Z" />
          <path d="m23 98 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" fill="white" />
        </g>
      )}
      <path
        d="M32 69V30a14 14 0 0 1 28 0v39a23 23 0 1 1-28 0Z"
        transform="translate(0 3)"
        fill={theme.colors.accent}
        opacity=".45"
      />
      <path
        d="M32 66V27a14 14 0 0 1 28 0v39a23 23 0 1 1-28 0Z"
        fill={`url(#${id}-frame)`}
        stroke={theme.colors.primary}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M46 29V80"
        stroke="white"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d={`M46 ${top}V80`}
        stroke={`url(#${id}-liquid)`}
        strokeWidth="10"
        strokeLinecap="round"
        opacity={temperature === null ? 0 : 1}
      />
      <circle cx="46" cy="84" r="14" fill={`url(#${id}-liquid)`} />
      <path
        d="M37 81q0-6 6-7"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".7"
      />
      <path
        d="M70 32h10M70 46h6M70 60h10"
        stroke={theme.colors.secondary}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {theme.id === 'princess' ? (
        <g>
          <path
            d="m35 13-2-9 8 5 5-8 5 8 8-5-2 9Z"
            fill="#ffda75"
            stroke={theme.colors.primary}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle
            cx="46"
            cy="10"
            r="2.5"
            fill={theme.colors.secondary}
            stroke="white"
            strokeWidth="1"
          />
        </g>
      ) : (
        <g>
          <path
            d="M46 17 36 8C28 0 43-3 46 4c3-7 18-4 10 4Z"
            fill={theme.colors.accent}
            stroke={theme.colors.primary}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="m39 5 3-1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  )
}
