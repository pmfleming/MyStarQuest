import type { Theme } from '../contexts/ThemeContext'

export const uiTokens = {
  pagePaddingX: 24,
  pagePaddingTop: 48,
  pagePaddingBottom: 24,
  sectionGap: 24,
  contentMaxWidth: 340,
  actionButtonHeight: 88,
  actionButtonRadius: 30,
  actionButtonFontSize: 28,
  actionButtonIconSize: 48,
  actionButtonArrowSize: 32,
  topIconSize: 72,
  topIconBorder: 4,
  deviceMaxWidth: 414,
  deviceMinHeight: 896,
} as const

export const getTopIconStyle = (theme: Theme) => ({
  backgroundColor: theme.colors.primary,
  color: theme.colors.text,
  height: `${uiTokens.topIconSize}px`,
  width: `${uiTokens.topIconSize}px`,
  borderRadius: '9999px',
  border: `${uiTokens.topIconBorder}px solid ${theme.colors.accent}`,
  boxShadow: `0 0 20px ${theme.colors.primary}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box' as const,
})

export const getActionButtonStyle = (theme: Theme, baseColor: string) => {
  const isDarkTheme = theme.id === 'space'
  return {
    background: baseColor,
    color: isDarkTheme ? '#000' : '#FFF',
    height: `${uiTokens.actionButtonHeight}px`,
    borderRadius: `${uiTokens.actionButtonRadius}px`,
    border:
      theme.id === 'space'
        ? `3px solid ${theme.colors.secondary}`
        : `4px solid ${theme.colors.primary}`,
    boxShadow:
      theme.id === 'space'
        ? `0 0 20px ${baseColor}66, inset 0 0 20px ${baseColor}1a`
        : `0 8px 0 ${theme.colors.accent}, 0 0 15px ${theme.colors.primary}33`,
    fontFamily: theme.fonts.heading,
    fontSize: `${uiTokens.actionButtonFontSize}px`,
    fontWeight: 700,
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: `${uiTokens.contentMaxWidth}px`,
    margin: '0 auto',
    boxSizing: 'border-box' as const,
  }
}
