import type { ReactNode, CSSProperties } from 'react'
import { Capacitor } from '@capacitor/core'
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
  const isNativePlatform = Capacitor.isNativePlatform()

  return (
    <div
      className={`flex min-h-screen w-full transition-colors duration-500 ${
        isNativePlatform
          ? 'items-stretch justify-start'
          : 'items-center justify-center'
      }`}
      style={{
        background: isNativePlatform ? theme.colors.bg : '#000',
        padding: isNativePlatform ? '0px' : '20px',
      }}
    >
      <div
        className="relative flex w-full flex-col overflow-hidden"
        style={{
          minHeight: isNativePlatform
            ? '100dvh'
            : `${uiTokens.deviceMinHeight}px`,
          maxWidth: isNativePlatform ? '100%' : `${uiTokens.deviceMaxWidth}px`,
          borderRadius: isNativePlatform ? '0px' : '40px',
          boxShadow: isNativePlatform
            ? 'none'
            : '0 0 0 12px #1a1a2e, 0 0 0 14px #333',
          background: theme.colors.bg,
          backgroundImage: theme.bgPattern,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
          width: '100%',
        }}
      >
        {topRight && (
          <div
            className="absolute z-50 flex justify-end gap-3"
            style={{
              top: `${uiTokens.pagePaddingTop}px`,
              right: `${uiTokens.pagePaddingX}px`,
            }}
          >
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
