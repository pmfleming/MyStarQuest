import { type ComponentType, type ReactNode, lazy, Suspense } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import type { ToiletStatus, WaterLevel } from '../data/types'
import type { AlphabetTesterProps } from '../components/AlphabetTester'
import type { ArithmeticTesterProps } from '../components/ArithmeticTester'
import type { DinnerCountdownProps } from '../components/DinnerCountdown'
import type { PositionalNotationProps } from '../components/PositionalNotation'
import type { SpellingTesterProps } from '../components/SpellingTester'

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
const SpellingTester = lazy(() => import('../components/SpellingTester'))

const withSuspense = (component: ReactNode) => (
  <Suspense fallback={null}>{component}</Suspense>
)

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

const renderLazy = <Props extends object>(
  Component: ComponentType<Props>,
  props: Props
) => withSuspense(<Component {...props} />)

export const renderDinnerChore = (props: DinnerCountdownProps): ReactNode =>
  renderLazy(DinnerCountdown, props)

export const renderArithmeticChore = (
  props: ArithmeticTesterProps
): ReactNode => renderLazy(ArithmeticTester, props)

export const renderPositionalNotationChore = (
  props: PositionalNotationProps
): ReactNode => renderLazy(PositionalNotation, props)

export const renderAlphabetChore = (props: AlphabetTesterProps): ReactNode =>
  renderLazy(AlphabetTester, props)

export const renderSpellingChore = (props: SpellingTesterProps): ReactNode =>
  renderLazy(SpellingTester, props)

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
