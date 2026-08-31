import type { ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { getFloatingSurfaceStyle, uiTokens } from '../tokens'

interface PageHeaderProps {
  theme: Theme
  title: string
  right?: ReactNode
  fontFamily?: string
}

const PageHeader = ({ theme, title, right, fontFamily }: PageHeaderProps) => {
  return (
    <header
      className="flex items-center gap-3"
      style={{
        ...getFloatingSurfaceStyle(theme, { top: '12px' }),
        padding: '0 16px',
      }}
    >
      <h1
        className="font-bold tracking-wide"
        style={{
          fontFamily: fontFamily || 'inherit',
          textAlign: 'left',
          fontSize: `${Math.round(uiTokens.topIconSize * 0.65)}px`,
          color: theme.colors.primary,
          lineHeight: '1',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h1>
      <div
        className="flex items-center justify-end gap-2"
        style={{ flexShrink: 0 }}
      >
        {right}
      </div>
    </header>
  )
}

export default PageHeader
