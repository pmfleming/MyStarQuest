import type { Theme } from '../../contexts/ThemeContext'
import {
  clockGeometry,
  explorerUi,
} from '../../data/dayNightExplorer/dayNightExplorer.constants'

type DigitalClockDisplayProps = {
  theme: Theme
  hoursLabel: string
  minutesLabel: string
  seconds: number
  ampm: string
  top: number
  height: number
}

const DigitalClockDisplay = ({
  theme,
  hoursLabel,
  minutesLabel,
  seconds,
  ampm,
  top,
  height,
}: DigitalClockDisplayProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: explorerUi.digitalClockTextGap,
        paddingBottom: explorerUi.digitalClockBottomInset,
        boxSizing: 'border-box',
        pointerEvents: 'none',
        zIndex: 8,
      }}
    >
      <span
        style={{
          fontSize: clockGeometry.digitalClockTimeFontSize,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          lineHeight: 1,
        }}
      >
        {hoursLabel}
      </span>
      <span
        style={{
          fontSize: clockGeometry.digitalClockSeparatorFontSize,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          opacity: 0.55,
          lineHeight: 1,
        }}
      >
        :
      </span>
      <span
        style={{
          fontSize: clockGeometry.digitalClockTimeFontSize,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          lineHeight: 1,
        }}
      >
        {minutesLabel}
      </span>
      <span
        style={{
          fontSize: clockGeometry.digitalClockSeparatorFontSize,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          opacity: 0.55,
          lineHeight: 1,
        }}
      >
        :
      </span>
      <span
        style={{
          fontSize: clockGeometry.digitalClockTimeFontSize,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          opacity: 0.88,
          textShadow: '0 1px 2px rgba(255,255,255,0.35)',
          lineHeight: 1,
        }}
      >
        {String(Math.floor(seconds)).padStart(2, '0')}
      </span>
      <span
        style={{
          fontSize: clockGeometry.digitalClockAmpmFontSize,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
          marginLeft: explorerUi.digitalClockAmpmMargin,
          textShadow: '0 1px 2px rgba(255,255,255,0.35)',
        }}
      >
        {ampm}
      </span>
    </div>
  )
}

export default DigitalClockDisplay
