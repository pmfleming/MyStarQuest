import type { ReactNode, CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../ui/tokens'

interface PageShellProps {
  theme: Theme
  children: ReactNode
  topRight?: ReactNode
  contentClassName?: string
  contentStyle?: CSSProperties
}

const PageShell = ({
  theme,
  children,
  topRight,
  contentClassName,
  contentStyle,
}: PageShellProps) => {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center transition-colors duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      <div
        className="relative flex w-full flex-col overflow-hidden"
        style={{
          minHeight: `${uiTokens.deviceMinHeight}px`,
          maxWidth: `${uiTokens.deviceMaxWidth}px`,
          borderRadius: '40px',
          boxShadow:
            '0 0 0 12px #1a1a2e, 0 0 0 14px #333, 0 25px 50px rgba(0, 0, 0, 0.5)',
          background: theme.colors.bg,
          backgroundImage: theme.bgPattern,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
          width: '100%',
        }}
      >
        {topRight && (
          <div className="absolute top-0 z-50 flex w-full justify-end gap-3 p-4">
            {topRight}
          </div>
        )}
        <div
          className={contentClassName || 'flex flex-1 flex-col overflow-hidden'}
          style={{
            paddingLeft: `${uiTokens.pagePaddingX}px`,
            paddingRight: `${uiTokens.pagePaddingX}px`,
            paddingTop: `${uiTokens.pagePaddingTop}px`,
            paddingBottom: `${uiTokens.pagePaddingBottom}px`,
            ...contentStyle,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default PageShell
