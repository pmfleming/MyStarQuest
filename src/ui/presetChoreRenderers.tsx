import { type ComponentType, lazy, Suspense } from 'react'

const createRenderer =
  <Props extends object>(Component: ComponentType<Props>) =>
  (props: Props) => (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  )

export const renderDinnerChore = createRenderer(
  lazy(() => import('../components/DinnerCountdown'))
)
export const renderArithmeticChore = createRenderer(
  lazy(() => import('../components/ArithmeticTester'))
)
export const renderLargeNumbersChore = createRenderer(
  lazy(() => import('../components/LargeNumbersTester'))
)
export const renderFractionsChore = createRenderer(
  lazy(() => import('../components/FractionsTester'))
)
export const renderPositionalNotationChore = createRenderer(
  lazy(() => import('../components/PositionalNotation'))
)
export const renderAlphabetChore = createRenderer(
  lazy(() => import('../components/AlphabetTester'))
)
export const renderSpellingChore = createRenderer(
  lazy(() => import('../components/SpellingTester'))
)
export const renderAnimalsChore = createRenderer(
  lazy(() => import('../components/AnimalTester'))
)
export const renderWaterToiletChore = createRenderer(
  lazy(() => import('../components/WaterToiletMonitor'))
)
