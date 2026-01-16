import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Theme } from '../contexts/ThemeContext'
import { getTopIconStyle } from '../ui/tokens'

interface TopIconButtonProps {
  theme: Theme
  icon: ReactNode
  ariaLabel: string
  to?: string
  onClick?: () => void
}

const TopIconButton = ({
  theme,
  icon,
  ariaLabel,
  to,
  onClick,
}: TopIconButtonProps) => {
  const commonProps = {
    'aria-label': ariaLabel,
    className:
      'flex items-center justify-center transition hover:opacity-90 active:scale-95',
    style: getTopIconStyle(theme),
  }

  if (to) {
    return (
      <Link to={to} {...commonProps}>
        {icon}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} {...commonProps}>
      {icon}
    </button>
  )
}

export default TopIconButton
