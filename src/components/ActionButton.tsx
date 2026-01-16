import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Theme } from '../contexts/ThemeContext'
import { getActionButtonStyle, uiTokens } from '../ui/tokens'

interface ActionButtonProps {
  to: string
  label: string
  icon: ReactNode
  theme: Theme
  color: string
}

const ActionButton = ({ to, label, icon, theme, color }: ActionButtonProps) => {
  return (
    <Link
      to={to}
      className="group no-underline"
      style={{ textDecoration: 'none' }}
    >
      <button type="button" style={getActionButtonStyle(theme, color)}>
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
        <span
          className="opacity-60 transition-transform group-hover:translate-x-2"
          style={{ fontSize: `${uiTokens.actionButtonArrowSize}px` }}
        >
          →
        </span>
      </button>
    </Link>
  )
}

export default ActionButton
