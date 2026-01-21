import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'

type RepeatControlProps = {
  theme: Theme
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  helperText?: string
  className?: string
  showLabel?: boolean
  showFeedback?: boolean
}

const CONTROL_SIZE = 60
const ICON_SIZE = 28

const RepeatControl = ({
  theme,
  value,
  onChange,
  label = 'Repeat Chore?',
  helperText,
  className,
  showLabel = false,
  showFeedback = false,
}: RepeatControlProps) => {
  const toggleRepeat = () => {
    onChange(!value)
  }

  const feedbackText = () => {
    if (helperText) return helperText
    return value ? 'Yes, repeat this chore' : 'No, one-time only'
  }

  return (
    <div
      className={className ? `repeat-control ${className}` : 'repeat-control'}
    >
      <style>
        {`
          .repeat-control {
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
            flex-direction: column;
            gap: 10px;
          }
          .repeat-control-title {
            font-weight: 700;
            font-size: 1rem;
            letter-spacing: 1px;
          }
          .repeat-button {
            background: none;
            border: 4px solid #e2e8f0;
            padding: 0;
            cursor: pointer;
            outline: none;
            width: ${CONTROL_SIZE}px;
            height: ${CONTROL_SIZE}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            -webkit-tap-highlight-color: transparent;
          }
          .repeat-button:hover {
            transform: scale(1.05);
            border-color: #cbd5e1;
          }
          .repeat-button.active {
            border-color: ${theme.colors.primary};
            background-color: ${theme.colors.primary}1a;
            transform: scale(1.1);
            box-shadow: 0 0 15px ${theme.colors.primary}33;
          }
          .repeat-icon {
            width: ${ICON_SIZE}px;
            height: ${ICON_SIZE}px;
            stroke: #e2e8f0;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            transition: all 0.4s ease;
          }
          .repeat-button.active .repeat-icon {
            stroke: ${theme.colors.primary};
            transform: rotate(180deg);
          }
          .repeat-feedback {
            font-size: 0.95rem;
            color: #64748b;
            min-height: 20px;
            font-weight: 500;
          }
        `}
      </style>

      {showLabel && <div className="repeat-control-title">{label}</div>}

      <button
        className={`repeat-button ${value ? 'active' : ''}`}
        onClick={toggleRepeat}
        aria-pressed={value}
        aria-label={label}
        type="button"
      >
        <svg viewBox="0 0 24 24" className="repeat-icon">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </button>

      {showFeedback && <div className="repeat-feedback">{feedbackText()}</div>}
    </div>
  )
}

export default RepeatControl
