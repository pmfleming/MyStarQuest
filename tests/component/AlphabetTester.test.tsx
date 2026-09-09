import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import AlphabetTester from '../../src/components/AlphabetTester'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const props = () => ({
  theme: themes.princess,
  totalProblems: 2,
  starReward: 3,
  isRunning: true,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
  onFail: vi.fn(),
})

function answer(correct = true) {
  const image = screen.getByAltText('Identify the first letter')
  const letter = image.getAttribute('src')!.split('/').pop()![0].toLowerCase()
  const choices = screen
    .getAllByRole('button')
    .filter((button) => /^[a-z]$/.test(button.textContent ?? ''))
  const choice = choices.find(
    (button) => (button.textContent === letter) === correct
  )
  expect(choice).toBeDefined()
  fireEvent.click(choice!)
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

it('advances after feedback and completes only after the last correct answer', async () => {
  const p = props()
  render(<AlphabetTester {...p} />)
  answer()
  await advance(1499)
  expect(p.onComplete).not.toHaveBeenCalled()
  await advance(1)
  answer()
  await advance(1500)
  expect(p.onComplete).toHaveBeenCalledTimes(1)
  expect(p.onFail).not.toHaveBeenCalled()
})

it('ignores clicks during feedback and fails after three mistakes', async () => {
  const p = props()
  render(<AlphabetTester {...p} />)
  answer(false)
  answer(false)
  await advance(600)
  answer(false)
  await advance(600)
  expect(p.onFail).not.toHaveBeenCalled()
  answer(false)
  await advance(2999)
  expect(p.onFail).not.toHaveBeenCalled()
  await advance(1)
  expect(p.onFail).toHaveBeenCalledTimes(1)
  expect(p.onComplete).not.toHaveBeenCalled()
})

it('allows unlimited retries when failure mode is disabled', async () => {
  const p = props()
  render(<AlphabetTester {...p} totalProblems={1} failureModeEnabled={false} />)
  for (let index = 0; index < 4; index++) {
    answer(false)
    await advance(600)
  }
  answer()
  await advance(1500)
  expect(p.onComplete).toHaveBeenCalledTimes(1)
  expect(p.onFail).not.toHaveBeenCalled()
})

it('cancels pending feedback on reset and can start a fresh round', async () => {
  const p = { ...props(), totalProblems: 1 }
  const { rerender } = render(<AlphabetTester {...p} />)
  answer()
  rerender(<AlphabetTester {...p} isRunning={false} />)
  await advance(1600)
  expect(p.onComplete).not.toHaveBeenCalled()
  rerender(<AlphabetTester {...p} />)
  answer()
  await advance(1500)
  expect(p.onComplete).toHaveBeenCalledTimes(1)
})

it('cancels delayed completion on unmount', async () => {
  const p = props()
  const { unmount } = render(<AlphabetTester {...p} totalProblems={1} />)
  answer()
  unmount()
  await advance(1600)
  expect(p.onComplete).not.toHaveBeenCalled()
  expect(p.onFail).not.toHaveBeenCalled()
})
