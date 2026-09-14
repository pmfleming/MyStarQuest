import { type ComponentType, Suspense } from 'react'
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

const createRenderer =
  <Props extends object>(Component: ComponentType<Props>) =>
  (props: Props) => (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )

export const renderDinnerChore = createRenderer(DinnerCountdown)
export const renderArithmeticChore = createRenderer(ArithmeticTester)
export const renderLargeNumbersChore = createRenderer(LargeNumbersTester)
export const renderPositionalNotationChore = createRenderer(PositionalNotation)
export const renderAlphabetChore = createRenderer(AlphabetTester)
export const renderSpellingChore = createRenderer(SpellingTester)
export const renderAnimalsChore = createRenderer(AnimalTester)
export const renderWaterToiletChore = createRenderer(WaterToiletMonitor)
