import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Theme } from '../../contexts/ThemeContext'
import { getActionButtonStyle, uiTokens } from '../../tokens'

interface ActionButtonProps {
  to?: string
  label: string
  icon: ReactNode
  theme: Theme
  color: string
  onClick?: () => void
  disabled?: boolean
  hideArrow?: boolean
  content?: ReactNode
  ariaPressed?: boolean
  styleOverride?: CSSProperties
}

const ActionButton = ({
  to,
  label,
  icon,
  theme,
  color,
  onClick,
  disabled,
  hideArrow,
  content,
  ariaPressed,
  styleOverride,
}: ActionButtonProps) => {
  const defaultContent = (
    <>
      <span className="flex items-center gap-4">
        <span
          className="flex items-center justify-center"
          style={{
            fontSize: `${uiTokens.actionButtonIconSize}px`,
            width: `${uiTokens.actionButtonIconSize}px`,
            height: `${uiTokens.actionButtonIconSize}px`,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span>{label}</span>
      </span>
      {!hideArrow && (
        <span
          className="opacity-60 transition-transform group-hover:translate-x-2"
          style={{ fontSize: `${uiTokens.actionButtonArrowSize}px` }}
        >
          →
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="group no-underline"
        style={{ textDecoration: 'none' }}
      >
        <button
          type="button"
          style={{ ...getActionButtonStyle(theme, color), ...styleOverride }}
          aria-pressed={ariaPressed}
        >
          {content ?? defaultContent}
        </button>
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...getActionButtonStyle(theme, color), ...styleOverride }}
      disabled={disabled}
      className="group"
      aria-pressed={ariaPressed}
    >
      {content ?? defaultContent}
    </button>
  )
}

export default ActionButton
