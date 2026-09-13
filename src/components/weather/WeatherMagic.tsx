import type { ThemeId } from '../../ui/themeOptions'

const palettes = {
  princess: { wind: '#8953ce', accent: '#ffd56a', rain: '#5e9eea' },
  teenie: { wind: '#c54b9d', accent: '#ff8dcc', rain: '#59cddd' },
}
const ribbon = 'M2 20C22 7 36 29 56 16S84 3 89 14C94 27 71 29 73 17'

function Sparkle({
  themeId,
  x,
  y,
}: {
  themeId: ThemeId
  x: number
  y: number
}) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d={
        themeId === 'princess'
          ? 'M0-6 2-2 6 0 2 2 0 6-2 2-6 0-2-2Z'
          : 'M0 5-5 0C-9-5-2-8 0-3 2-8 9-5 5 0Z'
      }
      fill={palettes[themeId].accent}
      stroke="white"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  )
}

export function WindRibbon({ themeId }: { themeId: ThemeId }) {
  return (
    <g fill="none" strokeLinecap="round">
      <path d={ribbon} stroke="white" strokeOpacity=".85" strokeWidth="6" />
      <path d={ribbon} stroke={palettes[themeId].wind} strokeWidth="3" />
      <path
        d="M9 32Q25 23 40 31T63 30"
        stroke={palettes[themeId].accent}
        strokeWidth="2"
      />
      <Sparkle themeId={themeId} x={23} y={8} />
      <Sparkle themeId={themeId} x={86} y={34} />
    </g>
  )
}

export function RainDrop({
  themeId,
  frozen = false,
  sparkle = false,
}: {
  themeId: ThemeId
  frozen?: boolean
  sparkle?: boolean
}) {
  return (
    <g>
      <path
        d="M0-7C-2-3-5 1-5 4a5 5 0 0 0 10 0C5 1 2-3 0-7Z"
        fill={frozen ? '#bcecff' : palettes[themeId].rain}
        stroke="white"
        strokeWidth="1.2"
      />
      <path
        d="M-2 1q-2 3 0 5"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".8"
      />
      {sparkle && <Sparkle themeId={themeId} x={8} y={-5} />}
    </g>
  )
}
