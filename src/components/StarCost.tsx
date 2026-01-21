import { useMemo } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'

type StarCostProps = {
  theme: Theme
  value: number
  onChange: (value: number) => void
  maxStars?: number
  label?: string
  helperText?: string
  className?: string
  showLabel?: boolean
  showFeedback?: boolean
}

const STAR_SIZE = 48

const StarCost = ({
  theme,
  value,
  onChange,
  maxStars = 3,
  label = 'Star Cost',
  helperText,
  className,
  showLabel = true,
  showFeedback = true,
}: StarCostProps) => {
  const starIds = useMemo(
    () => Array.from({ length: maxStars }, (_, index) => index + 1),
    [maxStars]
  )

  const handleStarClick = (selectedRating: number) => {
    if (selectedRating === value) {
      onChange(0)
      return
    }
    onChange(selectedRating)
  }

  const feedbackText = () => {
    if (helperText) return helperText
    if (value === 0) return 'Tap a star to choose'
    if (value === 1) return 'Low cost'
    if (value === 2) return 'Medium cost'
    return 'High cost'
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
            border: 4px solid ${theme.colors.primary};
            border-radius: 24px;
            background: ${theme.colors.surface};
            box-shadow: 0 8px 0 ${theme.colors.accent};
            height: ${uiTokens.actionButtonHeight}px;
            padding: 0 20px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .star-cost-title {
            margin-bottom: 20px;
            font-weight: 700;
            font-size: 1.1rem;
          }
          .star-cost-container {
            display: inline-flex;
            gap: 12px;
            padding: 0;
            background-color: transparent;
            border-radius: 24px;
          }
          .star-cost-button {
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            outline: none;
            transition: transform 0.2s ease;
            width: ${STAR_SIZE}px;
            height: ${STAR_SIZE}px;
            -webkit-tap-highlight-color: transparent;
          }
          .star-cost-button:hover {
            transform: translateY(-3px);
          }
          .star-cost-svg {
            width: 100%;
            height: 100%;
            display: block;
            transition: fill 0.3s ease, filter 0.3s ease;
          }
          .star-cost-svg.inactive {
            fill: #e2e8f0;
            filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.05));
          }
          .star-cost-svg.active {
            fill: #fbbf24;
            filter: drop-shadow(0px 0px 6px rgba(251, 191, 36, 0.6));
            animation: starCostPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
          .star-cost-button:hover .star-cost-svg.inactive {
            fill: #fcd34d;
          }
          .star-cost-feedback {
            margin-top: 20px;
            font-size: 1rem;
            color: #64748b;
            min-height: 24px;
            transition: opacity 0.3s ease;
          }
          @keyframes starCostPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.35); }
            100% { transform: scale(1); }
          }
        `}
      </style>

      {showLabel && <div className="star-cost-title">{label}</div>}

      <div className="star-cost-container" role="radiogroup" aria-label={label}>
        {starIds.map((starId) => {
          const isActive = starId <= value
          return (
            <button
              key={starId}
              type="button"
              className="star-cost-button"
              onClick={() => handleStarClick(starId)}
              aria-checked={starId === value}
              role="radio"
              aria-label={`${starId} Stars`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`star-cost-svg ${isActive ? 'active' : 'inactive'}`}
              >
                <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
              </svg>
            </button>
          )
        })}
      </div>

      {showFeedback && (
        <div className="star-cost-feedback">{feedbackText()}</div>
      )}
    </div>
  )
}

export default StarCost
