import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import { ANIMAL_ASSET_BY_NAME } from '../../src/data/animalAssets'
import { preloadImage } from '../../src/lib/imageLoading'

vi.mock('../../src/lib/imageLoading', () => ({ preloadImage: vi.fn() }))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

it('preloads only the next animal and its clues after play starts', () => {
  const props = {
    theme: themes.nature,
    totalProblems: 2,
    starReward: 3,
    isRunning: false,
    onAdjustProblems: vi.fn(),
    onStarsChange: vi.fn(),
    onComplete: vi.fn(),
  }
  const { rerender } = render(<AnimalTester {...props} />)
  expect(preloadImage).not.toHaveBeenCalled()
  rerender(<AnimalTester {...props} isRunning />)
  expect(preloadImage).toHaveBeenCalledWith(
    ANIMAL_ASSET_BY_NAME.get('armadillo')
  )
  expect(preloadImage).toHaveBeenCalledTimes(5)
  vi.mocked(preloadImage).mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Next animal' }))
  expect(preloadImage).toHaveBeenCalledTimes(5)
})
