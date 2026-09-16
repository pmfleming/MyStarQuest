import { AsyncButton } from './AsyncButton'
import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'

type StepperButtonProps = {
  theme: Theme
  direction: 'prev' | 'next'
  onClick: () => void | Promise<void>
  disabled?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Standardized rectangular stepper button used for increment/decrement
 * controls across the app (Carousel navigation, editable star controls, etc.)
 */
const StepperButton = ({
  theme,
  direction,
  onClick,
  disabled = false,
  ariaLabel,
  className,
  style,
  children,
}: StepperButtonProps) => {
  const defaultContent = direction === 'prev' ? '−' : '+'
  const content = children ?? defaultContent

  const buttonStyle: CSSProperties = {
    background: theme.colors.primary,
    border: `3px solid ${theme.colors.accent}`,
    color: '#fff',
    fontSize: '2rem',
    fontWeight: 'bold',
    width: `${uiTokens.listUtilityActionWidth}px`,
    height: `${uiTokens.listActionHeight}px`,
    borderRadius: uiTokens.listActionRadius,
    cursor: disabled ? 'default' : 'pointer',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: disabled
      ? '0 3px 0 rgba(0, 0, 0, 0.08)'
      : '0 6px 0 rgba(0, 0, 0, 0.12)',
    opacity: disabled ? 0.4 : 1,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    contain: 'layout paint',
    ...style,
  }

  const handleClick = () => {
    if (!disabled) {
      return onClick()
    }
  }

  return (
    <AsyncButton
      type="button"
      className={className}
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel ?? (direction === 'prev' ? 'Previous' : 'Next')}
    >
      {content}
    </AsyncButton>
  )
}

export default StepperButton

type NumberStepperProps = {
  theme: Theme
  value: number
  decrease: Pick<StepperButtonProps, 'onClick' | 'disabled' | 'ariaLabel'>
  increase: Pick<StepperButtonProps, 'onClick' | 'disabled' | 'ariaLabel'>
  disabled?: boolean
  style?: CSSProperties
  valueStyle?: CSSProperties
  buttonStyle?: CSSProperties
}

/** Keep paired math controls consistent while each activity owns its bounds. */
export function NumberStepper({
  theme,
  value,
  decrease,
  increase,
  disabled,
  style,
  valueStyle,
  buttonStyle,
}: NumberStepperProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <StepperButton
        theme={theme}
        direction="prev"
        {...decrease}
        disabled={disabled || decrease.disabled}
        style={buttonStyle}
      />
      <span
        style={{
          fontFamily: theme.fonts.heading,
          textAlign: 'center',
          ...valueStyle,
        }}
      >
        {value}
      </span>
      <StepperButton
        theme={theme}
        direction="next"
        {...increase}
        disabled={disabled || increase.disabled}
        style={buttonStyle}
      />
    </div>
  )
}
