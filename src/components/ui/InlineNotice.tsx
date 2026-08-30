import type { ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'

type InlineNoticeProps = {
  theme: Theme
  children: ReactNode
  className?: string
}

const InlineNotice = ({
  theme,
  children,
  className = '',
}: InlineNoticeProps) => (
  <div
    role="alert"
    className={`rounded-2xl px-4 py-3 text-center text-sm font-bold ${className}`}
    style={{
      background: `${theme.colors.secondary}20`,
      color: theme.colors.text,
      border: `2px solid ${theme.colors.secondary}`,
    }}
  >
    {children}
  </div>
)

export default InlineNotice
