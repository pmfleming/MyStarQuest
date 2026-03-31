import { type ReactNode, lazy, Suspense } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import type { MathDifficulty, ToiletStatus, WaterLevel } from '../data/types'

// Lazy load heavy activity components
const ArithmeticTester = lazy(() => import('../components/ArithmeticTester'))
const AlphabetTester = lazy(() => import('../components/AlphabetTester'))
const DinnerCountdown = lazy(() => import('../components/DinnerCountdown'))
const PositionalNotation = lazy(
  () => import('../components/PositionalNotation')
)
const WaterToiletMonitor = lazy(
  () => import('../components/WaterToiletMonitor')
)

const withSuspense = (component: ReactNode) => (
  <Suspense fallback={null}>{component}</Suspense>
)

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
  onExpire?: () => void
  isCompleted?: boolean
  completionImage?: string
  failureImage?: string
  biteCooldownSeconds?: number
  biteCooldownEndsAt?: number | null
  timerStartedAt?: number | null
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

type WaterToiletChoreRendererProps = {
  theme: Theme
  waterLevel: WaterLevel
  toiletStatus: ToiletStatus
  starDelta: number
  isInteractive: boolean
  isCompleted?: boolean
  onCycleWater: () => void
  onCycleToilet: () => void
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
  onExpire,
  isCompleted,
  completionImage,
  failureImage,
  biteCooldownSeconds,
  biteCooldownEndsAt,
  timerStartedAt,
  biteIcon,
  onBiteIconClick,
  showSetupControls,
  showStarReward,
}: DinnerChoreRendererProps): ReactNode =>
  withSuspense(
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
      onExpire={onExpire}
      isCompleted={isCompleted}
      completionImage={completionImage}
      failureImage={failureImage}
      biteCooldownSeconds={biteCooldownSeconds}
      biteCooldownEndsAt={biteCooldownEndsAt}
      timerStartedAt={timerStartedAt}
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
}: ArithmeticChoreRendererProps): ReactNode =>
  withSuspense(
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
}: PositionalNotationChoreRendererProps): ReactNode =>
  withSuspense(
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
}: AlphabetChoreRendererProps): ReactNode =>
  withSuspense(
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

export const renderWaterToiletChore = ({
  theme,
  waterLevel,
  toiletStatus,
  starDelta,
  isInteractive,
  isCompleted,
  onCycleWater,
  onCycleToilet,
}: WaterToiletChoreRendererProps): ReactNode =>
  withSuspense(
    <WaterToiletMonitor
      theme={theme}
      waterLevel={waterLevel}
      toiletStatus={toiletStatus}
      starDelta={starDelta}
      isInteractive={isInteractive}
      isCompleted={isCompleted}
      onCycleWater={onCycleWater}
      onCycleToilet={onCycleToilet}
    />
  )
