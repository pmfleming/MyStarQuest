import { AsyncButton } from './AsyncButton'
import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { getActionButtonStyle, uiTokens } from '../../tokens'
import { ActionArtwork } from './ActionArtwork'

interface ActionButtonProps {
  label: string
  icon: ReactNode
  theme: Theme
  color: string
  onClick?: () => void | Promise<void>
  disabled?: boolean
  hideArrow?: boolean
  content?: ReactNode
  ariaPressed?: boolean
  styleOverride?: CSSProperties
  className?: string
}

const ActionButton = ({
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
  const buttonStyle: CSSProperties = {
    ...getActionButtonStyle(theme, color),
    ...styleOverride,
    position: 'relative',
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

  return (
    <AsyncButton
      type="button"
      aria-label={label}
      onClick={onClick}
      style={buttonStyle}
      disabled={disabled}
      className={`group ${className}`.trim()}
      aria-pressed={ariaPressed}
    >
      {content ? <ActionArtwork>{content}</ActionArtwork> : defaultContent}
    </AsyncButton>
  )
}

export default ActionButton
