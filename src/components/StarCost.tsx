import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'

type StarCostProps = {
  theme: Theme
  value: number
  onChange: (value: number) => void
  maxStars?: number
  label?: string
  className?: string
  showLabel?: boolean
}

const STAGE_SIZE = 180 // Diameter of the stage circle
const CONTAINER_RADIUS = STAGE_SIZE / 2
const PADDING = 25
const AVAILABLE_RADIUS = CONTAINER_RADIUS - PADDING

const STAR_PATH =
  'M12,1.5l3.09,6.26l6.91,1l-5,4.87l1.18,6.88L12,17.27l-6.18,3.25l1.18-6.88l-5-4.87l6.91-1L12,1.5z'

// Returns array of {x, y, scale} based on count
const getGeometricLayout = (count: number) => {
  const positions = []

  if (count === 0) return positions

  let radius = AVAILABLE_RADIUS
  let scale = 1.0
  let angleOffset = -Math.PI / 2 // Start at top (12 o'clock)

  // Shape definitions
  if (count === 1) {
    return [{ x: 0, y: 0, scale: 2.0 }] // Center, large
  }

  if (count === 2) {
    radius = AVAILABLE_RADIUS * 0.6
    scale = 1.4
    angleOffset = 0 // Horizontal line
  } else if (count === 3) {
    radius = AVAILABLE_RADIUS * 0.65
    scale = 1.2
    angleOffset = -Math.PI / 2 // Triangle pointing up
  } else if (count === 4) {
    radius = AVAILABLE_RADIUS * 0.7
    scale = 1.1
    angleOffset = -Math.PI / 4 // Square
  } else if (count === 5) {
    radius = AVAILABLE_RADIUS * 0.75
    scale = 1.0
    angleOffset = -Math.PI / 2 // Pentagon point up
  } else {
    // 6+
    radius = AVAILABLE_RADIUS * 0.8
    scale = 0.9
    angleOffset = -Math.PI / 2
  }

  // Calculate coordinates for Regular Polygon
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count + angleOffset

    positions.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      scale: scale,
    })
  }

  return positions
}

const StarCost = ({
  theme,
  value,
  onChange,
  maxStars = 10,
  label = 'Star Cost',
  className,
  showLabel = true,
}: StarCostProps) => {
  const layout = useMemo(() => getGeometricLayout(value), [value])

  const handleIncrement = () => {
    if (value < maxStars) {
      onChange(value + 1)
    }
  }

  const handleDecrement = () => {
    if (value > 0) {
      onChange(value - 1)
    }
  }

  return (
    <div className={className ? `star-cost ${className}` : 'star-cost'}>
      <style>
        {`
          .star-cost {
            text-align: center;
            width: 100%;
            max-width: ${uiTokens.contentMaxWidth}px;
            margin: 0 auto;
          }
          .star-cost-title {
            margin-bottom: 12px;
            font-weight: 700;
            font-size: 1.1rem;
            color: ${theme.colors.text};
          }
          .star-cost-box {
            position: relative;
            border: 5px solid ${theme.colors.primary};
            border-radius: 24px;
            background: ${theme.colors.surface};
            box-shadow: 0 8px 0 ${theme.colors.accent}, 0 10px 30px -10px ${theme.colors.primary}40;
            height: 180px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible;
            margin-bottom: ${uiTokens.singleVerticalSpace}px;
          }
          .star-stage {
            position: relative;
            width: ${STAGE_SIZE}px;
            height: ${STAGE_SIZE}px;
            border-radius: 50%;
          }
          .control-btn {
            position: absolute;
            top: 50%;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 3px solid ${theme.colors.primary};
            background: ${theme.colors.surface};
            color: ${theme.colors.primary};
            font-size: 1.8rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-bottom: 4px;
            box-shadow: 0 4px 0 ${theme.colors.accent};
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 100;
            -webkit-tap-highlight-color: transparent;
          }
          .btn-minus {
            left: 23px;
            transform: translate(-50%, -50%);
          }
          .btn-plus {
            right: 23px;
            transform: translate(50%, -50%);
          }
          .control-btn:hover:not(:disabled) {
            box-shadow: 0 6px 0 ${theme.colors.accent};
          }
          .btn-minus:hover:not(:disabled) {
            transform: translate(-50%, -50%) scale(1.1);
          }
          .btn-plus:hover:not(:disabled) {
            transform: translate(50%, -50%) scale(1.1);
          }
          .control-btn:active:not(:disabled) {
            box-shadow: 0 2px 0 ${theme.colors.accent};
          }
          .btn-minus:active:not(:disabled) {
            transform: translate(-50%, -50%) scale(0.95);
          }
          .btn-plus:active:not(:disabled) {
            transform: translate(50%, -50%) scale(0.95);
          }
          .control-btn:disabled {
            opacity: 0.4;
            cursor: default;
            background: #e5e7eb;
            color: #9ca3af;
            border-color: #d1d5db;
            box-shadow: 0 4px 0 #d1d5db;
          }
          .star-wrapper {
            position: absolute;
            width: 32px;
            height: 32px;
            margin-left: -16px;
            margin-top: -16px;
            transition: top 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                        left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.3s ease;
            animation: pop-enter 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            pointer-events: none;
          }
          .star-svg {
            width: 100%;
            height: 100%;
            fill: #fbbf24;
            stroke: #f59e0b;
            stroke-width: 1.5;
            stroke-linejoin: round;
            filter: drop-shadow(0 3px 3px rgba(0,0,0,0.2));
          }
          .moon-wrapper {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            animation: float-sleep 3s ease-in-out infinite;
            filter: drop-shadow(0 6px 6px rgba(0,0,0,0.2));
            pointer-events: none;
          }
          @keyframes pop-enter {
            0% { transform: scale(0) rotate(-90deg); opacity: 0; }
            60% { transform: scale(var(--target-scale)) rotate(10deg); opacity: 1; }
            100% { transform: scale(var(--target-scale)) rotate(0deg); }
          }
          @keyframes float-sleep {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-50%, -60%) rotate(5deg); }
          }
        `}
      </style>

      {showLabel && <div className="star-cost-title">{label}</div>}

      <div className="star-cost-box">
        {/* MINUS BTN */}
        <button
          type="button"
          className="control-btn btn-minus"
          onClick={handleDecrement}
          disabled={value === 0}
          aria-label="Decrease star cost"
        >
          −
        </button>

        <div className="star-stage">
          {/* MOON (0 State) */}
          {value === 0 && <div className="moon-wrapper">🌙</div>}

          {/* STARS */}
          {layout.map((pos, index) => {
            // Convert geometry (0,0 is center) to CSS % (50% is center)
            const leftPerc = (pos.x / STAGE_SIZE) * 100 + 50
            const topPerc = (pos.y / STAGE_SIZE) * 100 + 50
            const starStyle: CSSProperties & Record<string, number | string> = {
              left: `${leftPerc}%`,
              top: `${topPerc}%`,
              ['--target-scale']: pos.scale,
            }

            return (
              <div key={index} className="star-wrapper" style={starStyle}>
                <svg viewBox="0 0 24 24" className="star-svg">
                  <path d={STAR_PATH} />
                </svg>
              </div>
            )
          })}
        </div>

        {/* PLUS BTN */}
        <button
          type="button"
          className="control-btn btn-plus"
          onClick={handleIncrement}
          disabled={value >= maxStars}
          aria-label="Increase star cost"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default StarCost
