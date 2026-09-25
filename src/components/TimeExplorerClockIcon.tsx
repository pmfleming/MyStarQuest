import type { ClockViewModel } from '../features/dayNightExplorer/Clock'
import teenieClockIcon from '../assets/themes/teenie/clock-character.png'

export type HeaderClock = Pick<
  ClockViewModel,
  'hourAngle' | 'minuteAngle' | 'hoursLabel' | 'minutesLabel' | 'ampm'
>

export default function TimeExplorerClockIcon({
  clock,
  illustrated,
}: {
  clock: HeaderClock
  illustrated: boolean
}) {
  return (
    <svg
      // Align the held clock's center at 75% of the icon height.
      viewBox={illustrated ? '0 57.5 1254 1254' : '-115 -115 230 230'}
      aria-hidden="true"
      className="h-16 w-16 max-w-full shrink-0 overflow-visible"
    >
      {illustrated && (
        <image href={teenieClockIcon} width="1254" height="1254" />
      )}
      {/* Match the perspective of the clock held in the character artwork. */}
      <g
        transform={
          illustrated ? 'translate(670 998) scale(2.54 2.24)' : undefined
        }
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
