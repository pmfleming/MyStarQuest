import type { CSSProperties } from 'react'
import type { FractionFoodAsset } from '../ui/fractionFoodAssets'

type Props = {
  asset: FractionFoodAsset
  denominator: number
  selected: readonly number[]
  onToggle?: (index: number) => void
  disabled?: boolean
  foodOnly?: boolean
  animate?: boolean
  label?: string
}

const circlePoint = (turn: number, radius: number): [number, number] => {
  const angle = turn * Math.PI * 2 - Math.PI / 2
  return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)]
}

const foodSlices = (denominator: number) =>
  Array.from({ length: denominator }, (_, index) => {
    const [x2, y2] = circlePoint(index / denominator, 50)
    // Extend beyond the enclosing ellipse; it supplies the exact curved edge.
    const points = Array.from({ length: 33 }, (_, step) =>
      circlePoint((index + step / 32) / denominator, 100)
        .map((coordinate) => `${coordinate}%`)
        .join(' ')
    )
    return {
      index,
      cut: { x2, y2 },
      style: { clipPath: `polygon(50% 50%,${points.join(',')})` },
    }
  })

export default function FractionFood({
  asset,
  denominator,
  selected,
  onToggle,
  disabled,
  foodOnly = false,
  animate = false,
  label,
}: Props) {
  const slices = foodSlices(denominator)
  const { x, y, width, height } = asset.food
  const cropStyle = foodOnly
    ? { aspectRatio: `${width} / ${height}` }
    : undefined
  const foodStyle: CSSProperties = foodOnly
    ? { inset: 0 }
    : { left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }
  const imageStyle: CSSProperties | undefined = foodOnly
    ? {
        width: `${10000 / width}%`,
        maxWidth: 'none',
        left: `${(-100 * x) / width}%`,
        top: `${(-100 * y) / height}%`,
      }
    : undefined
  return (
    <div
      className={`fraction-food-scene ${foodOnly ? 'fraction-food-crop' : ''} ${animate ? 'fraction-demo' : ''}`}
      role={onToggle ? undefined : 'img'}
      aria-label={onToggle ? undefined : label}
      data-food={asset.label}
      style={cropStyle}
    >
      <div className="fraction-food-illustration" style={cropStyle}>
        <img
          className="fraction-food-character"
          src={asset.image}
          alt={onToggle ? asset.description : ''}
          style={imageStyle}
          draggable={false}
        />
        <div
          className={`fraction-food-pieces fraction-food-pieces--${denominator}`}
          style={foodStyle}
          role={onToggle ? 'group' : undefined}
          aria-label={
            onToggle
              ? `${denominator} equal pieces of ${asset.label.toLowerCase()}; tap to select`
              : undefined
          }
          aria-hidden={onToggle ? undefined : true}
        >
          {slices.map(({ index, style }) => {
            const chosen = selected.includes(index)
            const className = `fraction-food-piece ${chosen ? 'is-selected' : ''}`
            return onToggle ? (
              <button
                key={index}
                type="button"
                className={className}
                style={style}
                aria-label={`Piece ${index + 1} of ${denominator}`}
                aria-pressed={chosen}
                disabled={disabled}
                onClick={() => onToggle(index)}
              />
            ) : (
              <span className={className} key={index} style={style} />
            )
          })}
          <svg
            className="fraction-food-cuts"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {slices.map(({ index, cut }) => (
              <line key={index} x1="50" y1="50" {...cut} />
            ))}
          </svg>
        </div>
      </div>
      {onToggle && denominator > 4 && (
        <div
          className="fraction-piece-shortcuts"
          role="group"
          aria-label="Select slices by number"
        >
          {slices.map(({ index }) => (
            <button
              type="button"
              key={index}
              disabled={disabled}
              aria-label={`Select slice ${index + 1}`}
              aria-pressed={selected.includes(index)}
              onClick={() => onToggle(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
