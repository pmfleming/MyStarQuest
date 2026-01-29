import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'
import StepperButton from './StepperButton'
import StarDisplay from './StarDisplay'

type StarCostProps = {
  theme: Theme
  value: number
  onChange: (value: number) => void
  maxStars?: number
  label?: string
  className?: string
  showLabel?: boolean
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
          .stepper-btn-left {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 100;
          }
          .stepper-btn-right {
            position: absolute;
            right: 16px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 100;
          }
        `}
      </style>

      {showLabel && <div className="star-cost-title">{label}</div>}

      <div className="star-cost-box">
        {/* MINUS BTN */}
        <StepperButton
          theme={theme}
          direction="prev"
          onClick={handleDecrement}
          disabled={value === 0}
          ariaLabel="Decrease star cost"
          className="stepper-btn-left"
        />

        {/* Star Field using unified StarDisplay component */}
        <StarDisplay
          count={value}
          variant="field"
          emptyContent={<span style={{ fontSize: '48px' }}>🌙</span>}
          style={{
            background: 'transparent',
            border: 'none',
            minHeight: 'auto',
            padding: '16px',
            maxWidth: '200px',
          }}
        />

        {/* PLUS BTN */}
        <StepperButton
          theme={theme}
          direction="next"
          onClick={handleIncrement}
          disabled={value >= maxStars}
          ariaLabel="Increase star cost"
          className="stepper-btn-right"
        />
      </div>
    </div>
  )
}

export default StarCost
