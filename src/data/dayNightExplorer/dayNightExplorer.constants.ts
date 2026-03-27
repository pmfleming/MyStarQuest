import { uiTokens } from '../../ui/tokens'

export const explorerUi = {
  totalMinutes: 1440,
  dragCommitIntervalMs: 1000 / 15,
  globeCanvasSize: Math.round(uiTokens.contentMaxWidth * 0.6470588235),
  clockFaceWidth: uiTokens.contentMaxWidth,
  clockFaceRadius: uiTokens.listItemRadius,
  digitalClockTextGap: uiTokens.sectionGap * 3,
  digitalClockAmpmMargin: uiTokens.sectionGap * 2,
  locationButtonSize: uiTokens.topIconSize,
  explorerGap: uiTokens.singleVerticalSpace / 2,
  stepperInset: uiTokens.pagePaddingX,
  digitalClockAreaHeight: uiTokens.doubleVerticalSpace,
  digitalClockBottomInset: uiTokens.pagePaddingTop,
  clockNumberLerp: 0.1,
  clockHourTickLerp: 0.11,
  clockMinuteTickLerp: 0.06,
  scripts: [
    'https://d3js.org/d3.v3.min.js',
    'https://d3js.org/topojson.v1.min.js',
    'https://unpkg.com/planetary.js@1.1.2/dist/planetaryjs.min.js',
  ] as const,
} as const

const clockSize = explorerUi.globeCanvasSize
const handViewBoxWidth = 1024
const handViewBoxHeight = 1536
const minuteHandHeight = clockSize * 0.4236363636
const minuteHandWidth =
  (handViewBoxWidth / handViewBoxHeight) * minuteHandHeight

export const clockGeometry = {
  size: clockSize,
  cx: clockSize / 2,
  cy: clockSize / 2,
  faceHeight: explorerUi.globeCanvasSize,
  edgeInset: clockSize * 0.0545454545,
  faceRadiusInset: clockSize * 0.0090909091,
  numberInset: clockSize * 0.1909090909,
  numberRadiusInset: clockSize * 0.0454545455,
  hourTickStroke: clockSize * 0.0136363636,
  minuteTickStroke: clockSize * 0.0068181818,
  numberFontSize: clockSize * 0.0909090909,
  pivotSize: clockSize * 0.2,
  handHitHour: clockSize * 0.1272727273,
  handHitMinute: clockSize * 0.1,
  handHitSecond: clockSize * 0.0681818182,
  secondHandBaseOffset: clockSize * 0.0545454545,
  handShadowOffsetY: clockSize * 0.0090909091,
  handShadowBlur: clockSize * 0.0136363636,
  hourHandHeight: clockSize * 0.32,
  minuteHandHeight,
  secondHandHeight: minuteHandHeight,
  hourHandWidth: (handViewBoxWidth / handViewBoxHeight) * (clockSize * 0.32),
  minuteHandWidth,
  secondHandWidth: minuteHandWidth,
  hourHandBaseRotation:
    (-Math.atan(
      ((handViewBoxWidth / handViewBoxHeight) * (clockSize * 0.32)) /
        (clockSize * 0.32)
    ) *
      180) /
    Math.PI,
  minuteHandBaseRotation:
    (-Math.atan(minuteHandWidth / minuteHandHeight) * 180) / Math.PI,
  secondHandBaseRotation:
    (-Math.atan(minuteHandWidth / minuteHandHeight) * 180) / Math.PI,
  activityImageWidth: clockSize * 0.8545454545,
  digitalClockTimeFontSize: clockSize * 0.1636363636,
  digitalClockSeparatorFontSize: clockSize * 0.0818181818,
  digitalClockAmpmFontSize: clockSize * 0.0909090909,
  projectionScale: clockSize * 0.4909090909,
  handShadow: `drop-shadow(0 ${clockSize * 0.0090909091}px ${
    clockSize * 0.0136363636
  }px rgba(0,0,0,0.28))`,
} as const
