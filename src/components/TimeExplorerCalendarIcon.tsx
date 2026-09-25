import teenieCalendarIcon from '../assets/themes/teenie/calendar.webp'

export default function TimeExplorerCalendarIcon({
  dateLabel,
  illustrated,
}: {
  dateLabel: string
  illustrated: boolean
}) {
  return (
    <svg
      // Match the held clock's center at 75% of the icon height.
      viewBox={illustrated ? '0 -9 256 256' : '25 125.5 206 115'}
      aria-hidden="true"
      className="h-16 w-16 max-w-full shrink-0 overflow-visible"
    >
      {illustrated && (
        <image href={teenieCalendarIcon} width="256" height="256" />
      )}
      <rect
        x="36"
        y="144"
        width="184"
        height="78"
        rx="9"
        fill="#fffdf3"
        stroke="#39b9bb"
        strokeWidth="5"
      />
      <path
        d="M 50 153 H 206"
        stroke="#ace7df"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text
        x="128"
        y="197"
        textAnchor="middle"
        fill="#28526b"
        fontFamily="Arial, sans-serif"
        fontSize="39"
        fontWeight="700"
      >
        {dateLabel}
      </text>
    </svg>
  )
}
