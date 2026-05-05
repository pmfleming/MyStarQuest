import type { CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import StarDisplay from './StarDisplay'
import StepperButton from './StepperButton'

export type ActivityResult = 'correct' | 'incorrect'

export const MAX_ACTIVITY_MISTAKES = 3
export const ACTIVITY_SETUP_FIELD_GAP = uiTokens.singleVerticalSpace

const { statusBarHeight, statusIconSize, statusIconGap } =
  uiTokens.activityTokens

const STATUS_BAR_HORIZONTAL_PADDING = 12
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth

const getStatusIconOverlap = (iconCount: number) => {
  if (iconCount <= 1) return 0

  const availableWidth = CONTROL_ROW_WIDTH - STATUS_BAR_HORIZONTAL_PADDING
  const naturalWidth =
    iconCount * statusIconSize + (iconCount - 1) * statusIconGap

  if (naturalWidth <= availableWidth) return 0

  const requiredOverlap =
    (naturalWidth - availableWidth) / Math.max(1, iconCount - 1)

  return Math.min(statusIconSize * 0.72, Math.max(0, requiredOverlap))
}

type ActivityResultBarProps = {
  theme: Theme
  results: ActivityResult[]
  correctIcon: string
  incorrectIcon: string
  slideAnimationName?: string
  hideAlt?: boolean
  style?: CSSProperties
}

export const ActivityResultBar = ({
  theme,
  results,
  correctIcon,
  incorrectIcon,
  slideAnimationName,
  hideAlt = false,
  style,
}: ActivityResultBarProps) => (
  <div
    className="flex w-full items-center justify-center"
    style={{
      background: `${theme.colors.primary}12`,
      padding: '0 8px',
      height: statusBarHeight,
      borderRadius: 12,
      boxSizing: 'border-box',
      marginBottom: 4,
      ...style,
    }}
  >
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ gap: statusIconGap }}
    >
      {results.map((result, index) => {
        const isLatest = index === results.length - 1
        const overlap = getStatusIconOverlap(results.length)

        return (
          <img
            key={`result-${index}`}
            src={result === 'correct' ? correctIcon : incorrectIcon}
            alt={hideAlt ? '' : result === 'correct' ? 'Correct' : 'Incorrect'}
            style={{
              width: statusIconSize,
              height: statusIconSize,
              marginLeft: index === 0 ? 0 : -overlap,
              objectFit: 'contain',
              animation:
                isLatest && slideAnimationName
                  ? `${slideAnimationName} 0.35s ease both`
                  : undefined,
            }}
          />
        )
      })}
    </div>
  </div>
)

type ProblemCountControlProps = {
  theme: Theme
  totalProblems: number
  min: number
  max: number
  onAdjust: (delta: number) => void
  previousAriaLabel: string
  nextAriaLabel: string
}

export const ProblemCountControl = ({
  theme,
  totalProblems,
  min,
  max,
  onAdjust,
  previousAriaLabel,
  nextAriaLabel,
}: ProblemCountControlProps) => (
  <div
    className="flex flex-col items-center"
    style={{
      gap: ACTIVITY_SETUP_FIELD_GAP,
      width: CONTROL_ROW_WIDTH,
      maxWidth: '100%',
    }}
  >
    <div className="flex w-full flex-col items-center" style={{ gap: 0 }}>
      <div className="flex w-full items-center justify-center">
        <StepperButton
          theme={theme}
          direction="prev"
          onClick={() => onAdjust(-1)}
          disabled={totalProblems <= min}
          ariaLabel={previousAriaLabel}
        />
        <div className="flex flex-1 flex-col items-center">
          <span
            style={{
              fontFamily: theme.fonts.heading,
              fontWeight: 'bold',
              fontSize: 42,
              color: theme.colors.primary,
              lineHeight: 1,
            }}
          >
            {totalProblems}
          </span>
        </div>
        <StepperButton
          theme={theme}
          direction="next"
          onClick={() => onAdjust(1)}
          disabled={totalProblems >= max}
          ariaLabel={nextAriaLabel}
        />
      </div>
    </div>
  </div>
)

type StarRewardControlProps = {
  theme: Theme
  starReward: number
  onStarsChange: (value: number) => void
  max?: number
  style?: CSSProperties
}

export const StarRewardControl = ({
  theme,
  starReward,
  onStarsChange,
  max = 3,
  style,
}: StarRewardControlProps) => (
  <div
    className="flex flex-col items-center"
    style={{
      gap: 0,
      width: CONTROL_ROW_WIDTH,
      maxWidth: '100%',
      ...style,
    }}
  >
    <StarDisplay
      theme={theme}
      count={starReward}
      editable
      onChange={onStarsChange}
      min={1}
      max={max}
    />
  </div>
)
