import { type CSSProperties, type ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../tokens'

type AppDeviceFrameProps = {
  theme: Theme
  isNativePlatform: boolean
  browserFrameHeight: number
  children: ReactNode
  contentClassName?: string
  contentStyle?: CSSProperties
}

export const AppDeviceFrame = ({
  theme,
  isNativePlatform,
  browserFrameHeight,
  children,
  contentClassName = 'relative flex w-full flex-col overflow-hidden',
  contentStyle,
}: AppDeviceFrameProps) => (
  <div
    className={`flex w-full overflow-hidden transition-colors duration-500 ${
      isNativePlatform
        ? 'items-stretch justify-start'
        : 'items-center justify-center'
    }`}
    style={{
      height: '100dvh',
      background: isNativePlatform ? theme.colors.bg : '#000',
      padding: isNativePlatform ? '0px' : '20px',
      boxSizing: 'border-box',
    }}
  >
    <div
      className={contentClassName}
      style={{
        height: isNativePlatform ? '100dvh' : `${browserFrameHeight}px`,
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
        ...contentStyle,
      }}
    >
      {children}
    </div>
  </div>
)
