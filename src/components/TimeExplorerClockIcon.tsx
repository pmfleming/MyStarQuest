import type { ClockViewModel } from '../features/dayNightExplorer/Clock'

export type HeaderClock = Pick<
  ClockViewModel,
  | 'activityImage'
  | 'hourAngle'
  | 'minuteAngle'
  | 'hoursLabel'
  | 'minutesLabel'
  | 'ampm'
>

export default function TimeExplorerClockIcon({
  clock,
  illustrated,
}: {
  clock: HeaderClock
  illustrated: boolean
}) {
  const activityImage = illustrated ? clock.activityImage : null
  return (
    <svg
      // Keep the clock centered at 75% of the activity artwork's height.
      viewBox={activityImage ? '0 0 256 256' : '-115 -115 230 230'}
      aria-hidden="true"
      className="h-16 w-16 max-w-full shrink-0 overflow-visible"
    >
      {activityImage && <image href={activityImage} width="256" height="256" />}
      <g
        transform={activityImage ? 'translate(128 192) scale(0.52)' : undefined}
      >
        <circle r="100" fill="#fffaf0" stroke="#d59b22" strokeWidth="5" />
        {Array.from({ length: 12 }, (_, hour) => (
          <path
            key={hour}
            d="M 0 -82 V -90"
            transform={`rotate(${hour * 30})`}
            stroke="#74452d"
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
        <path
          d="M 0 8 V -48"
          transform={`rotate(${clock.hourAngle})`}
          stroke="#e92174"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M 0 8 V -70"
          transform={`rotate(${clock.minuteAngle})`}
          stroke="#008be8"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <circle r="10" fill="#ffc928" stroke="#d59b22" strokeWidth="3" />
      </g>
    </svg>
  )
}
