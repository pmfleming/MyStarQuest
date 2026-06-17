import type { CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'

export type StandardActionVariant = 'primary' | 'neutral' | 'danger'

export const getStandardActionHeadingStyle = (theme: Theme): CSSProperties => ({
  color: theme.colors.text,
  fontFamily: theme.fonts.heading,
  fontSize: `${uiTokens.actionButtonFontSize}px`,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: 0,
  overflowWrap: 'anywhere',
})

export const getStandardActionBaseStyle = (theme: Theme): CSSProperties => ({
  height: `${uiTokens.listActionHeight}px`,
  borderRadius: `${uiTokens.listActionRadius}px`,
  borderWidth: '2px',
  borderStyle: 'solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: `${uiTokens.actionContentGap}px`,
  padding: '0 20px',
  fontWeight: 700,
  fontSize: '1.1rem',
  fontFamily: theme.fonts.body,
  cursor: 'pointer',
  boxShadow: `0 6px 0 ${theme.colors.primary}60`,
  boxSizing: 'border-box',
})

export const getStandardActionVariantStyle = (
  theme: Theme,
  variant: StandardActionVariant = 'primary'
): CSSProperties => {
  const isDarkTheme = theme.id === 'space'

  switch (variant) {
    case 'danger':
      return {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderColor: 'rgba(239,68,68,0.6)',
        color: '#b91c1c',
        boxShadow: '0 6px 0 rgba(185,28,28,0.4)',
      }
    case 'neutral':
      return {
        backgroundColor: theme.colors.surface,
        borderColor: `${theme.colors.primary}60`,
        color: theme.colors.text,
        boxShadow: `0 6px 0 ${theme.colors.primary}30`,
      }
    case 'primary':
    default:
      return {
        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
        borderColor: theme.colors.accent,
        color: isDarkTheme ? '#000' : '#FFF',
        boxShadow: `0 6px 0 ${theme.colors.secondary}80`,
      }
  }
}

export const getStandardPrimaryActionStyle = (
  theme: Theme,
  variant: StandardActionVariant = 'primary'
): CSSProperties => ({
  ...getStandardActionBaseStyle(theme),
  ...getStandardActionVariantStyle(theme, variant),
  flex: 1,
  minWidth: 0,
  padding: 0,
  overflow: 'hidden',
})

export const getStandardUtilityActionStyle = (
  theme: Theme,
  variant: StandardActionVariant = 'neutral'
): CSSProperties => ({
  ...getStandardActionBaseStyle(theme),
  ...getStandardActionVariantStyle(theme, variant),
  width: `${uiTokens.listUtilityActionWidth}px`,
  minWidth: `${uiTokens.listUtilityActionWidth}px`,
  padding: 0,
})
