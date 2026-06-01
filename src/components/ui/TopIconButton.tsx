import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Theme } from '../../contexts/ThemeContext'
import { getTopIconStyle } from '../../tokens'

interface TopIconButtonProps {
  theme: Theme
  icon: ReactNode
  ariaLabel: string
  to?: string
  onClick?: () => void | Promise<void>
  selected?: boolean
  disabled?: boolean
}

const TopIconButton = ({
  theme,
  icon,
  ariaLabel,
  to,
  onClick,
  selected = false,
  disabled = false,
}: TopIconButtonProps) => {
  const commonProps = {
    'aria-label': ariaLabel,
    'aria-pressed': selected || undefined,
    className: 'flex items-center justify-center transition active:scale-95',
    style: getTopIconStyle(theme, selected),
  }

  if (to) {
    return (
      <Link to={to} {...commonProps}>
        {icon}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        try {
          const result = onClick?.()
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error('Failed to run top icon action', error)
            })
          }
        } catch (error) {
          console.error('Failed to run top icon action', error)
        }
      }}
      disabled={disabled}
      {...commonProps}
    >
      {icon}
    </button>
  )
}

export default TopIconButton
