import type { CSSProperties } from 'react'
import type { SharingTreat } from '../../data/sharingFriends'

type Drop = { index: number; count: number; bowl: number }

const LOOSE_PILE = [
  [46, 64],
  [24, 50],
  [74, 58],
  [38, 25],
  [61, 24],
  [18, 22],
] as const

function droppedStyle({ index, count, bowl }: Drop): CSSProperties {
  const columns = count > 12 ? 8 : count > 6 ? 4 : 3
  const rows = Math.ceil(count / columns)
  // Fill from the centre out, alternating sides, with stable scatter. Existing
  // tokens keep their identity when another lands or is taken back.
  const order =
    columns === 3
      ? [1, 0, 2]
      : columns === 4
        ? [1, 3, 0, 2]
        : [3, 5, 1, 7, 2, 6, 0, 4]
  const column = order[index % columns]!
  const row = Math.floor(index / columns)
  const seed = (index * 37 + bowl * 19) % 101
  const loose = count <= 6 ? LOOSE_PILE[index] : undefined
  const x = loose
    ? bowl % 2
      ? 100 - loose[0]
      : loose[0]
    : ((column + 0.5) / columns) * 100
  const y = loose ? loose[1] : 100 - ((row + 0.5) / rows) * 100
  return {
    // Leave room for rotated corners while letting the larger tokens overlap.
    left: `clamp(calc(var(--sharing-token-size) * 0.72 + 2px), ${x}%, calc(100% - var(--sharing-token-size) * 0.72 - 2px))`,
    top: `${30 + y * 0.5}%`,
    '--sharing-tilt': `${(seed % 101) - 50}deg`,
    '--sharing-scatter-x': `${(seed % 5) - 2}px`,
    '--sharing-scatter-y': `${((seed * 3) % 5) - 2}px`,
  } as CSSProperties
}

export default function SharingToken({
  treat,
  drop,
}: {
  treat: SharingTreat
  drop?: Drop
}) {
  return (
    <img
      className={drop ? 'sharing-token sharing-token-dropped' : 'sharing-token'}
      style={drop ? droppedStyle(drop) : undefined}
      src={treat.src}
      alt=""
      draggable={false}
    />
  )
}
