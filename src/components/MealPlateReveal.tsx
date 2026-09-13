import { useId } from 'react'

type MealPlateRevealProps = {
  hungryImage: string
  fullImage: string
  dividerColor: string
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
  plateImage,
  totalBites,
  bitesLeft,
  slicePath,
}: MealPlateRevealProps) {
  const clipId = useId()

  return (
    <g>
      <defs>
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
            <image
              href={fullImage}
              x="44"
              y="44"
              width="132"
              height="132"
              preserveAspectRatio="xMidYMid meet"
              style={{
                opacity: cleared ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
              }}
            />
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
