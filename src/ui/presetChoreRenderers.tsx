import { type ComponentType, type ReactNode, Suspense } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import type { ToiletStatus, WaterLevel } from '../data/types'
import type { AlphabetTesterProps } from '../components/AlphabetTester'
import type { AnimalTesterProps } from '../components/AnimalTester'
import type { ArithmeticTesterProps } from '../components/ArithmeticTester'
import type { DinnerCountdownProps } from '../components/DinnerCountdown'
import type { LargeNumbersTesterProps } from '../components/LargeNumbersTester'
import type { PositionalNotationProps } from '../components/PositionalNotation'
import type { SpellingTesterProps } from '../components/SpellingTester'

import {
  ArithmeticTester,
  LargeNumbersTester,
  AlphabetTester,
  AnimalTester,
  DinnerCountdown,
  PositionalNotation,
  WaterToiletMonitor,
  SpellingTester,
} from '../components/activities/LazyActivities'

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
  onCycleWater: () => void | Promise<void>
  onCycleToilet: () => void | Promise<void>
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

export const renderLargeNumbersChore = (
  props: LargeNumbersTesterProps
): ReactNode => renderLazy(LargeNumbersTester, props)

export const renderPositionalNotationChore = (
  props: PositionalNotationProps
): ReactNode => renderLazy(PositionalNotation, props)

export const renderAlphabetChore = (props: AlphabetTesterProps): ReactNode =>
  renderLazy(AlphabetTester, props)

export const renderSpellingChore = (props: SpellingTesterProps): ReactNode =>
  renderLazy(SpellingTester, props)

export const renderAnimalsChore = (props: AnimalTesterProps): ReactNode =>
  renderLazy(AnimalTester, props)

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
