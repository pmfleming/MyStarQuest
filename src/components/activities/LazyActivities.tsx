import { lazy } from 'react'

// Lazy load heavy activity components
export const ArithmeticTester = lazy(() => import('../ArithmeticTester'))
export const LargeNumbersTester = lazy(() => import('../LargeNumbersTester'))
export const FractionsTester = lazy(() => import('../FractionsTester'))
export const AlphabetTester = lazy(() => import('../AlphabetTester'))
export const AnimalTester = lazy(() => import('../AnimalTester'))
export const DinnerCountdown = lazy(() => import('../DinnerCountdown'))
export const PositionalNotation = lazy(() => import('../PositionalNotation'))
export const WaterToiletMonitor = lazy(() => import('../WaterToiletMonitor'))
export const SpellingTester = lazy(() => import('../SpellingTester'))
