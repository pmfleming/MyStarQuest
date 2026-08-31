import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import ChoreOutcomeView from '../ChoreOutcomeView'
import StarDisplay from './StarDisplay'
import StepperButton from './StepperButton'

export type ActivityResult = 'correct' | 'incorrect'

export type ActivityChoreProps = {
  theme: Theme
  totalProblems: number
  starReward: number
  isRunning: boolean
  isEditable?: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
  failureModeEnabled?: boolean
}

export const MAX_ACTIVITY_MISTAKES = 3
export const ACTIVITY_SETUP_FIELD_GAP = uiTokens.panelStackGap

const { statusBarHeight, statusIconSize, statusIconGap } =
  uiTokens.activityTokens

const STATUS_BAR_HORIZONTAL_PADDING = 12
const CONTROL_ROW_WIDTH = uiTokens.controlRowWidth

type ActivityOutcomeShellProps = {
  isFinished: boolean
  isSuccessState: boolean
  completionImage?: string
  failureImage?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
  successAlt?: string
  failureAlt?: string
}

export const ActivityOutcomeShell = ({
  isFinished,
  isSuccessState,
  completionImage,
  failureImage,
  children,
  className,
  style,
  successAlt,
  failureAlt,
}: ActivityOutcomeShellProps) => (
  <div
    className={className}
    style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: `${uiTokens.panelStackGap}px`,
      ...style,
    }}
  >
    {isFinished ? (
      <ChoreOutcomeView
        imageSrc={isSuccessState ? completionImage : failureImage}
        outcome={isSuccessState ? 'success' : 'failure'}
        successAlt={successAlt}
        failureAlt={failureAlt}
      />
    ) : (
      <>{children}</>
    )}
  </div>
)

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

type ActivitySetupControlsProps = {
  isSetup: boolean
  theme: Theme
  totalProblems: number
  min: number
  max: number
  onAdjustProblems: (delta: number) => void
  starReward: number
  onStarsChange: (value: number) => void
  previousAriaLabel: string
  nextAriaLabel: string
  starMax?: number
  beforeProblemControl?: ReactNode
  isEditable?: boolean
}

export const ActivitySetupControls = ({
  isSetup,
  theme,
  totalProblems,
  min,
  max,
  onAdjustProblems,
  starReward,
  onStarsChange,
  previousAriaLabel,
  nextAriaLabel,
  starMax,
  beforeProblemControl,
  isEditable = true,
}: ActivitySetupControlsProps) => {
  if (!isSetup) return null

  const problemControl = (
    <ProblemCountControl
      theme={theme}
      totalProblems={totalProblems}
      min={min}
      max={max}
      onAdjust={onAdjustProblems}
      previousAriaLabel={previousAriaLabel}
      nextAriaLabel={nextAriaLabel}
      isEditable={isEditable}
    />
  )

  return (
    <div
      className="flex flex-col items-center"
      data-activity-setup
      style={{
        gap: ACTIVITY_SETUP_FIELD_GAP,
        width: CONTROL_ROW_WIDTH,
        maxWidth: '100%',
      }}
    >
      {beforeProblemControl && isEditable && beforeProblemControl}
      {problemControl}

      <StarRewardControl
        theme={theme}
        starReward={starReward}
        onStarsChange={onStarsChange}
        max={starMax}
        isEditable={isEditable}
      />
    </div>
  )
}

type ActivityPlayAreaProps = {
  theme: Theme
  results: ActivityResult[]
  correctIcon: string
  incorrectIcon: string
  children: ReactNode
  animation?: string
  shakeKey?: string
  className?: string
  slideAnimationName?: string
  hideAlt?: boolean
}

export const ActivityPlayArea = ({
  theme,
  results,
  correctIcon,
  incorrectIcon,
  children,
  animation,
  shakeKey,
  className = 'flex flex-col items-center',
  slideAnimationName,
  hideAlt,
}: ActivityPlayAreaProps) => (
  <div
    className={className}
    style={{
      gap: 8,
      width: CONTROL_ROW_WIDTH,
      maxWidth: '100%',
      animation,
    }}
    key={shakeKey}
  >
    <ActivityResultBar
      theme={theme}
      results={results}
      correctIcon={correctIcon}
      incorrectIcon={incorrectIcon}
      slideAnimationName={slideAnimationName}
      hideAlt={hideAlt}
    />
    {children}
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
  isEditable?: boolean
}

export const ProblemCountControl = ({
  theme,
  totalProblems,
  min,
  max,
  onAdjust,
  previousAriaLabel,
  nextAriaLabel,
  isEditable = true,
}: ProblemCountControlProps) => (
  <div
    className="flex flex-col items-center"
    style={{
      width: CONTROL_ROW_WIDTH,
      maxWidth: '100%',
    }}
  >
    <div className="flex w-full flex-col items-center" style={{ gap: 0 }}>
      <div className="flex w-full items-center justify-center">
        {isEditable && (
          <StepperButton
            theme={theme}
            direction="prev"
            onClick={() => onAdjust(-1)}
            disabled={totalProblems <= min}
            ariaLabel={previousAriaLabel}
          />
        )}
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
        {isEditable && (
          <StepperButton
            theme={theme}
            direction="next"
            onClick={() => onAdjust(1)}
            disabled={totalProblems >= max}
            ariaLabel={nextAriaLabel}
          />
        )}
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
  isEditable?: boolean
}

export const StarRewardControl = ({
  theme,
  starReward,
  onStarsChange,
  max = 9,
  style,
  isEditable = true,
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
      editable={isEditable}
      onChange={onStarsChange}
      min={1}
      max={max}
    />
  </div>
)
