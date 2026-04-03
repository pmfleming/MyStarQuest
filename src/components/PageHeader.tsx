import type { ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'

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
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        ...getSurfaceWidthConstraints(),
        height: `${uiTokens.floatingNavHeight}px`,
        padding: '0 16px',
        // Translucent background with glassmorphism
        background: `${theme.colors.surface}99`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '32px',
        border: `2px solid ${theme.colors.accent}44`,
        boxShadow: `0 8px 32px ${theme.colors.primary}33`,
        zIndex: 100,
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
