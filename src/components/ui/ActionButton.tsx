import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Theme } from '../../contexts/ThemeContext'
import { getActionButtonStyle, uiTokens } from '../../tokens'
import { ActionArtwork } from './ActionArtwork'

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
  className?: string
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
  className = '',
}: ActionButtonProps) => {
  const buttonStyle = {
    ...getActionButtonStyle(theme, color),
    ...styleOverride,
    position: 'relative' as const,
    overflow: 'hidden',
  }
  const defaultContent = (
    <>
      <span
        className="flex items-center"
        style={{ gap: `${uiTokens.actionRowGap}px` }}
      >
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
          aria-label={label}
          className={`group ${className}`.trim()}
          style={buttonStyle}
          aria-pressed={ariaPressed}
        >
          {content ? <ActionArtwork>{content}</ActionArtwork> : defaultContent}
        </button>
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={buttonStyle}
      disabled={disabled}
      className={`group ${className}`.trim()}
      aria-pressed={ariaPressed}
    >
      {content ? <ActionArtwork>{content}</ActionArtwork> : defaultContent}
    </button>
  )
}

export default ActionButton
