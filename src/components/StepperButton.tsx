import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'

type StepperButtonProps = {
  theme: Theme
  direction: 'prev' | 'next'
  onClick: () => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/**
 * Standardized rectangular stepper button used for increment/decrement
 * controls across the app (Carousel navigation, StarCost +/- buttons, etc.)
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
    color: theme.id === 'space' ? '#000' : '#fff',
    fontSize: '2rem',
    fontWeight: 'bold',
    width: '46px',
    height: '64px',
    borderRadius: 12,
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
    ...style,
  }

  const handleClick = () => {
    if (!disabled) {
      onClick()
    }
  }

  return (
    <button
      type="button"
      className={className}
      style={buttonStyle}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel ?? (direction === 'prev' ? 'Previous' : 'Next')}
    >
      {content}
    </button>
  )
}

export default StepperButton
export type { StepperButtonProps }
