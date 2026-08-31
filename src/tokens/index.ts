import type { CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'

const surfaceMaxWidth = 380
const surfaceWidthPercent = 90
const surfaceRadius = 32

export const uiTokens = {
  pagePaddingX: 24,
  pagePaddingTop: 4,
  pagePaddingBottom: 16,
  sectionGap: 2,
  singleVerticalSpace: 24,
  doubleVerticalSpace: 48,
  panelStackGap: 24,
  controlRowGap: 16,
  controlColumnGap: 10,
  actionRowGap: 14,
  actionContentGap: 8,
  navItemGap: 8,
  controlInset: 8,
  surfaceWidthPercent,
  surfaceMaxWidth,
  surfaceRadius,
  contentMaxWidth: surfaceMaxWidth,
  timeExplorerLinkedPanelHeight: 340,
  controlRowWidth: surfaceMaxWidth,
  listItemPadding: 12,
  listItemRadius: surfaceRadius,
  listItemBorderWidth: 4,
  listActionHeight: 60,
  listActionRadius: 20,
  listUtilityActionWidth: 60,
  listActionArtworkScale: 2.8,
  listActionSpinnerSize: 24,
  listUtilityArtworkSize: 52,
  cardSuccessImageHeight: 220,
  actionButtonHeight: 88,
  actionButtonRadius: surfaceRadius,
  actionButtonFontSize: 28,
  actionButtonIconSize: 48,
  actionButtonArrowSize: 32,
  topIconSize: 44,
  topIconBorder: 4,
  deviceMaxWidth: 414,
  floatingNavHeight: 55,
  floatingNavWidthPercent: surfaceWidthPercent,
  floatingNavMaxWidth: surfaceMaxWidth,
  deviceMinHeight: 896,
  tabTransitionMs: 500,
  activityTokens: {
    statusBarHeight: 60,
    statusIconSize: 60,
    statusIconGap: 6,
    outcomeContainerMinHeight: 280,
    outcomeContainerRadius: surfaceRadius,
    outcomeContainerPadding: 20,
    quizOutcomeImageMaxWidth: 360,
    quizOutcomeImageMaxHeight: 420,
    mathCounterSize: 20,
    mathCounterGap: 4,
    answerCounterSize: 24,
    answerCounterGap: 6,
    stepperWidth: 72,
    stepperHeight: 56,
  },
}

export const getSurfaceWidthConstraints = (): CSSProperties => ({
  width: `${uiTokens.surfaceWidthPercent}%`,
  maxWidth: `${uiTokens.surfaceMaxWidth}px`,
  boxSizing: 'border-box',
})

export const getTopIconStyle = (
  theme: Theme,
  isSelected = false
): CSSProperties => ({
  backgroundColor: isSelected
    ? theme.colors.primary
    : `${theme.colors.primary}80`,
  color: theme.colors.text,
  height: `${uiTokens.topIconSize}px`,
  width: `${uiTokens.topIconSize}px`,
  borderRadius: '9999px',
  border: `${uiTokens.topIconBorder}px solid ${theme.colors.primary}`,
  boxShadow: `0 0 10px ${theme.colors.primary}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
})

export const getActionButtonStyle = (
  theme: Theme,
  baseColor: string
): CSSProperties => {
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
    maxWidth: `${uiTokens.surfaceMaxWidth}px`,
    margin: '0 auto',
    boxSizing: 'border-box',
  }
}
