import { timeToMinutes } from '../lib/calendarSchedule'
import { uiTokens } from '../tokens'

const clockNumbers = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1
  const angle = (hour / 12) * Math.PI * 2
  const dx = Math.sin(angle)
  const dy = -Math.cos(angle)
  // Place the hours around the rectangular face along the hands' angles.
  const distance = Math.min(48 / Math.abs(dx), 33 / Math.abs(dy))
  return { hour, x: 64 + dx * distance, y: 48 + dy * distance }
})

export default function AgendaTime({
  value,
  label,
  dateLabel,
}: {
  value: string
  label: 'From' | 'To' | 'At'
  dateLabel?: string
}) {
  const minutes = timeToMinutes(value)
  const hours = Math.floor(minutes / 60) % 24
  const displayTime = `${hours % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`

  return (
    <div className="day-agenda__time">
      <svg
        className="day-agenda__clock day-agenda__clock--time"
        viewBox="0 0 128 96"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          className="day-agenda__clock-face"
          x="3"
          y="3"
          width="122"
          height="90"
          rx={(128 * uiTokens.listItemRadius) / uiTokens.surfaceMaxWidth}
        />
        <g
          className="day-agenda__clock-numbers"
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {clockNumbers.map(({ hour, x, y }) => (
            <text key={hour} x={x} y={y} fontSize={hour % 3 === 0 ? 16 : 12}>
              {hour}
            </text>
          ))}
        </g>
        <g strokeLinecap="round">
          <g color="#3174d3" transform={`rotate(${(minutes % 720) / 2} 64 48)`}>
            <line
              x1="64"
              y1="48"
              x2="64"
              y2="34"
              stroke="currentColor"
              strokeWidth="5"
            />
            <path d="M58 35 L64 28 L70 35 Z" fill="currentColor" />
          </g>
          <g color="#2d640b" transform={`rotate(${(minutes % 60) * 6} 64 48)`}>
            <line
              x1="64"
              y1="48"
              x2="64"
              y2="26"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path d="M59 27 L64 20 L69 27 Z" fill="currentColor" />
          </g>
        </g>
        <circle cx="64" cy="48" r="3.5" fill="currentColor" />
      </svg>
      <time
        className="day-agenda__digital"
        dateTime={value === '24:00' ? '00:00' : value}
        aria-label={`${label} ${dateLabel ? `${dateLabel}, ` : ''}${displayTime}${value === '24:00' ? ', end of day' : ''}`}
      >
        {displayTime}
      </time>
      {dateLabel && <span className="day-agenda__time-label">{dateLabel}</span>}
    </div>
  )
}
