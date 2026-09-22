import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import LargeNumbersTester from '../../src/components/LargeNumbersTester'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('regroups and borrows ones while enforcing the 19-counter and 99-total limits', () => {
  render(
    <LargeNumbersTester
      theme={themes.princess}
      totalProblems={1}
      starReward={1}
      isRunning
      onAdjustProblems={vi.fn()}
      onStarsChange={vi.fn()}
    />
  )
  const addOne = screen.getByRole('button', { name: 'Add one ones' })
  const removeOne = screen.getByRole('button', { name: 'Remove one ones' })
  const addTen = screen.getByRole('button', { name: 'Add one tens' })
  const onesControl = addOne.parentElement!
  expect(removeOne).toBeDisabled()
  for (let i = 0; i < 10; i++) fireEvent.click(addOne)
  expect(within(onesControl).getByText('0')).toBeInTheDocument()
  fireEvent.click(removeOne)
  expect(within(onesControl).getByText('9')).toBeInTheDocument()
  for (let i = 0; i < 10; i++) fireEvent.click(addOne)
  expect(addOne).toBeDisabled()
  expect(within(onesControl).getByText('9')).toBeInTheDocument()
  for (let i = 0; i < 8; i++) fireEvent.click(addTen)
  expect(addTen).toBeDisabled()
  fireEvent.click(removeOne)
  expect(addOne).toBeEnabled()
  fireEvent.click(addOne)
  expect(addOne).toBeDisabled()
  for (let i = 0; i < 19; i++) fireEvent.click(removeOne)
  expect(removeOne).toBeDisabled()
  fireEvent.click(addTen)
  for (let i = 0; i < 9; i++) fireEvent.click(addOne)
  expect(addOne).toBeDisabled()
  expect(within(onesControl).getByText('9')).toBeInTheDocument()
})
