import { useId } from 'react'

type MealPlateRevealProps = {
  hungryImage: string
  fullImage: string
  dividerColor: string
  successColors: [string, string]
  plateImage?: string
  totalBites: number
  bitesLeft: number
  slicePath: (
    index: number,
    count: number,
    center: number,
    radius: number
  ) => string
}

export default function MealPlateReveal({
  hungryImage,
  fullImage,
  dividerColor,
  successColors,
  plateImage,
  totalBites,
  bitesLeft,
  slicePath,
}: MealPlateRevealProps) {
  const clipId = useId()

  return (
    <g>
      <defs>
        <linearGradient id={`${clipId}-success`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={successColors[0]} />
          <stop offset="100%" stopColor={successColors[1]} />
        </linearGradient>
        {Array.from({ length: totalBites }, (_, index) => (
          <clipPath key={index} id={`${clipId}-${index}`}>
            <path d={slicePath(index, totalBites, 110, 66)} />
          </clipPath>
        ))}
      </defs>
      {plateImage ? (
        <image href={plateImage} x="18" y="18" width="184" height="184" />
      ) : (
        <circle
          cx="110"
          cy="110"
          r="92"
          fill="#fffafc"
          stroke={dividerColor}
          strokeWidth="8"
        />
      )}
      {Array.from({ length: totalBites }, (_, index) => {
        const cleared = index >= bitesLeft
        return (
          <g key={index} clipPath={`url(#${clipId}-${index})`}>
            <g
              style={{
                opacity: cleared ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
              }}
            >
              <rect
                x="44"
                y="44"
                width="132"
                height="132"
                fill={`url(#${clipId}-success)`}
              />
              <image
                href={fullImage}
                x="44"
                y="44"
                width="132"
                height="132"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
            <image
              href={hungryImage}
              x="44"
              y="44"
              width="132"
              height="132"
              preserveAspectRatio="xMidYMid meet"
              style={{
                opacity: cleared ? 0 : 1,
                transition: 'opacity 0.8s ease-in-out',
              }}
            />
            <path
              d={slicePath(index, totalBites, 110, 66)}
              fill="none"
              stroke={dividerColor}
              strokeWidth="1.25"
              style={{
                opacity: cleared ? 0 : 0.7,
                transition: 'opacity 0.8s ease-in-out',
              }}
            />
          </g>
        )
      })}
    </g>
  )
}
