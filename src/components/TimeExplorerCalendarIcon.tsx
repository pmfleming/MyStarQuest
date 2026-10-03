import teenieCalendarIcon from '../assets/themes/teenie/calendar.webp'
import princessCalendarIcon from '../assets/themes/princess/calendar-character.png'
import type { ThemeId } from '../ui/themeOptions'

export default function TimeExplorerCalendarIcon({
  dateLabel,
  themeId,
}: {
  dateLabel: string
  themeId: ThemeId
}) {
  const isPrincess = themeId === 'princess'
  const calendarImage = isPrincess ? princessCalendarIcon : teenieCalendarIcon
  return (
    <svg
      // Match the held clock's center at 75% of the icon height.
      viewBox="0 -9 256 256"
      aria-hidden="true"
      className="h-16 w-16 max-w-full shrink-0 overflow-visible"
    >
      <image href={calendarImage} width="256" height="256" />
      {!isPrincess && (
        <>
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
        </>
      )}
      <text
        x="128"
        y={isPrincess ? 209 : 197}
        textAnchor="middle"
        fill={isPrincess ? '#831843' : '#28526b'}
        fontFamily="Arial, sans-serif"
        fontSize="39"
        fontWeight="700"
      >
        {dateLabel}
      </text>
    </svg>
  )
}
