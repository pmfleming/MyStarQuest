import type { ReactNode } from 'react'
import ArithmeticTester from '../components/ArithmeticTester'
import AlphabetTester from '../components/AlphabetTester'
import DinnerCountdown from '../components/DinnerCountdown'
import PositionalNotation from '../components/PositionalNotation'
import type { Theme } from '../contexts/ThemeContext'
import type { MathDifficulty } from '../data/types'

type DinnerChoreRendererProps = {
  theme: Theme
  duration: number
  remaining: number
  totalBites: number
  bitesLeft: number
  starReward: number
  isTimerRunning: boolean
  plateImage?: string
  onAdjustTime: (delta: number) => void
  onAdjustBites: (delta: number) => void
  onStarsChange: (value: number) => void
  isCompleted?: boolean
  completionImage?: string
  failureImage?: string
  biteCooldownSeconds?: number
  biteIcon?: string
  onBiteIconClick?: () => void
  showSetupControls?: boolean
  showStarReward?: boolean
}

type ArithmeticChoreRendererProps = {
  theme: Theme
  totalProblems: number
  starReward: number
  difficulty?: MathDifficulty
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onDifficultyChange?: (difficulty: MathDifficulty) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
}

type PositionalNotationChoreRendererProps = {
  theme: Theme
  totalProblems: number
  starReward: number
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
}

type AlphabetChoreRendererProps = {
  theme: Theme
  totalProblems: number
  starReward: number
  isRunning: boolean
  isCompleted?: boolean
  isFailed?: boolean
  onAdjustProblems: (delta: number) => void
  onStarsChange: (value: number) => void
  onComplete: () => void
  onFail?: () => void
  checkTrigger?: number
  completionImage?: string
  failureImage?: string
}

export const renderDinnerChore = ({
  theme,
  duration,
  remaining,
  totalBites,
  bitesLeft,
  starReward,
  isTimerRunning,
  plateImage,
  onAdjustTime,
  onAdjustBites,
  onStarsChange,
  isCompleted,
  completionImage,
  failureImage,
  biteCooldownSeconds,
  biteIcon,
  onBiteIconClick,
  showSetupControls,
  showStarReward,
}: DinnerChoreRendererProps): ReactNode => (
  <DinnerCountdown
    theme={theme}
    duration={duration}
    remaining={remaining}
    totalBites={totalBites}
    bitesLeft={bitesLeft}
    starReward={starReward}
    isTimerRunning={isTimerRunning}
    plateImage={plateImage}
    onAdjustTime={onAdjustTime}
    onAdjustBites={onAdjustBites}
    onStarsChange={onStarsChange}
    isCompleted={isCompleted}
    completionImage={completionImage}
    failureImage={failureImage}
    biteCooldownSeconds={biteCooldownSeconds}
    biteIcon={biteIcon}
    onBiteIconClick={onBiteIconClick}
    showSetupControls={showSetupControls}
    showStarReward={showStarReward}
  />
)

export const renderArithmeticChore = ({
  theme,
  totalProblems,
  starReward,
  difficulty,
  isRunning,
  isCompleted,
  isFailed,
  onAdjustProblems,
  onStarsChange,
  onDifficultyChange,
  onComplete,
  onFail,
  checkTrigger,
  completionImage,
  failureImage,
}: ArithmeticChoreRendererProps): ReactNode => (
  <ArithmeticTester
    theme={theme}
    totalProblems={totalProblems}
    starReward={starReward}
    difficulty={difficulty}
    isRunning={isRunning}
    isCompleted={isCompleted}
    isFailed={isFailed}
    onAdjustProblems={onAdjustProblems}
    onStarsChange={onStarsChange}
    onDifficultyChange={onDifficultyChange}
    onComplete={onComplete}
    onFail={onFail}
    checkTrigger={checkTrigger}
    completionImage={completionImage}
    failureImage={failureImage}
  />
)

export const renderPositionalNotationChore = ({
  theme,
  totalProblems,
  starReward,
  isRunning,
  isCompleted,
  isFailed,
  onAdjustProblems,
  onStarsChange,
  onComplete,
  onFail,
  checkTrigger,
  completionImage,
  failureImage,
}: PositionalNotationChoreRendererProps): ReactNode => (
  <PositionalNotation
    theme={theme}
    totalProblems={totalProblems}
    starReward={starReward}
    isRunning={isRunning}
    isCompleted={isCompleted}
    isFailed={isFailed}
    onAdjustProblems={onAdjustProblems}
    onStarsChange={onStarsChange}
    onComplete={onComplete}
    onFail={onFail}
    checkTrigger={checkTrigger}
    completionImage={completionImage}
    failureImage={failureImage}
  />
)

export const renderAlphabetChore = ({
  theme,
  totalProblems,
  starReward,
  isRunning,
  isCompleted,
  isFailed,
  onAdjustProblems,
  onStarsChange,
  onComplete,
  onFail,
  checkTrigger,
  completionImage,
  failureImage,
}: AlphabetChoreRendererProps): ReactNode => (
  <AlphabetTester
    theme={theme}
    totalProblems={totalProblems}
    starReward={starReward}
    isRunning={isRunning}
    isCompleted={isCompleted}
    isFailed={isFailed}
    onAdjustProblems={onAdjustProblems}
    onStarsChange={onStarsChange}
    onComplete={onComplete}
    onFail={onFail}
    checkTrigger={checkTrigger}
    completionImage={completionImage}
    failureImage={failureImage}
  />
)
