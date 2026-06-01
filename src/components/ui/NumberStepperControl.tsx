import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { StandardIconImage } from './IconActionControls'
import StepperButton from './StepperButton'

type NumberStepperControlProps = {
  theme: Theme
  label: string
  icon: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const NumberStepperControl = ({
  theme,
  label,
  icon,
  value,
  min,
  max,
  step,
  onChange,
}: NumberStepperControlProps) => (
  <div
    className="flex items-center"
    style={{
      height: `${uiTokens.listActionHeight}px`,
      borderRadius: `${uiTokens.listActionRadius}px`,
      border: `2px solid ${theme.colors.primary}60`,
      background: theme.colors.surface,
      boxShadow: `0 6px 0 ${theme.colors.primary}30`,
      color: theme.colors.text,
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
  >
    <div
      className="flex items-center justify-center"
      style={{
        width: `${uiTokens.listUtilityActionWidth}px`,
        minWidth: `${uiTokens.listUtilityActionWidth}px`,
        height: '100%',
        borderRight: `1px solid ${theme.colors.primary}22`,
        boxSizing: 'border-box',
      }}
    >
      <StandardIconImage src={icon} fit="cover" width="100%" height="100%" />
    </div>
    <StepperButton
      theme={theme}
      direction="prev"
      onClick={() => onChange(clamp(value - step, min, max))}
      disabled={value <= min}
      ariaLabel={`Decrease ${label.toLowerCase()}`}
      style={{
        width: `${uiTokens.listUtilityActionWidth}px`,
        height: `${uiTokens.listActionHeight}px`,
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none',
      }}
    />
    <span
      aria-label={label}
      style={{
        flex: 1,
        minWidth: '2.5ch',
        textAlign: 'center',
        fontFamily: theme.fonts.heading,
        fontWeight: 900,
        fontSize: '1.25rem',
      }}
    >
      {value}
    </span>
    <StepperButton
      theme={theme}
      direction="next"
      onClick={() => onChange(clamp(value + step, min, max))}
      disabled={value >= max}
      ariaLabel={`Increase ${label.toLowerCase()}`}
      style={{
        width: `${uiTokens.listUtilityActionWidth}px`,
        height: `${uiTokens.listActionHeight}px`,
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none',
      }}
    />
  </div>
)

export default NumberStepperControl
