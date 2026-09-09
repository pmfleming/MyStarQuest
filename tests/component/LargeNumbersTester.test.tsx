import {
  act,
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

function answerProblem(expectedOperation: string, easyOperand?: number) {
  const problem = screen.getByRole('group', { name: /^\d+ (plus|minus) \d+$/ })
  const [first, operation, second] = problem
    .getAttribute('aria-label')!
    .split(' ')
  expect(operation).toBe(expectedOperation)
  const a = Number(first)
  const b = Number(second)
  expect(a).toBeGreaterThanOrEqual(easyOperand === undefined ? 11 : 1)
  expect(a).toBeLessThanOrEqual(99)
  expect(b).toBeGreaterThanOrEqual(easyOperand === undefined ? 11 : 1)
  expect(b).toBeLessThanOrEqual(99)
  if (easyOperand !== undefined) {
    expect(b).toBe(easyOperand)
    expect(b < 10 || b % 10 === 0).toBe(true)
  }
  const answer = operation === 'plus' ? a + b : a - b
  expect(answer).toBeGreaterThanOrEqual(0)
  expect(answer).toBeLessThanOrEqual(99)
  const addTen = screen.getByRole('button', { name: 'Add one tens' })
  const addOne = screen.getByRole('button', { name: 'Add one ones' })
  for (let tens = 0; tens < Math.floor(answer / 10); tens++) {
    fireEvent.click(addTen)
  }
  for (let ones = 0; ones < answer % 10; ones++) {
    fireEvent.click(addOne)
  }
}

it.each([
  ['Addition only', 'plus', 'plus'],
  ['Subtraction only', 'minus', 'minus'],
  ['Addition and subtraction', 'minus', 'plus'],
])(
  'uses the visual %s choice through a complete round',
  async (label, firstOperation, secondOperation) => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const props = {
      theme: themes.princess,
      totalProblems: 2,
      starReward: 3,
      isRunning: false,
      onAdjustProblems: vi.fn(),
      onStarsChange: vi.fn(),
      onComplete: vi.fn(),
    }
    const { rerender } = render(<LargeNumbersTester {...props} />)
    const choices = within(
      screen.getByRole('radiogroup', { name: 'Math operations' })
    )
    expect(
      choices.getByRole('radio', { name: 'Addition only' })
    ).toHaveAttribute('aria-checked', 'true')
    expect(
      choices.getAllByRole('radio').map((choice) => choice.textContent)
    ).toEqual(['+', '−', '+ / −'])
    const selected = choices.getByRole('radio', { name: label })
    fireEvent.click(selected)
    expect(selected).toHaveAttribute('aria-checked', 'true')
    rerender(<LargeNumbersTester {...props} isRunning />)
    expect(
      screen.queryByRole('radiogroup', { name: 'Math operations' })
    ).not.toBeInTheDocument()

    answerProblem(firstOperation)
    rerender(<LargeNumbersTester {...props} isRunning checkTrigger={1} />)
    random.mockReturnValue(0.9)
    await act(() => vi.advanceTimersByTimeAsync(1500))
    expect(props.onComplete).not.toHaveBeenCalled()
    answerProblem(secondOperation)
    rerender(<LargeNumbersTester {...props} isRunning checkTrigger={2} />)
    await act(() => vi.advanceTimersByTimeAsync(1500))
    expect(props.onComplete).toHaveBeenCalledOnce()
  },
  15000
)

it('restricts easy mixed rounds to ones or whole tens, including both range boundaries', async () => {
  const samples = [
    { random: 0, operation: 'minus', operand: 1 },
    { random: 0.499, operation: 'minus', operand: 9 },
    { random: 0.5, operation: 'plus', operand: 10 },
    { random: 0.999, operation: 'plus', operand: 90 },
  ]
  const random = vi.spyOn(Math, 'random').mockReturnValue(samples[0]!.random)
  const props = {
    theme: themes.princess,
    totalProblems: samples.length,
    starReward: 3,
    isRunning: false,
    onAdjustProblems: vi.fn(),
    onStarsChange: vi.fn(),
    onComplete: vi.fn(),
  }
  const { rerender } = render(<LargeNumbersTester {...props} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Easy' }))
  expect(screen.getByRole('radio', { name: 'Easy' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  fireEvent.click(
    screen.getByRole('radio', { name: 'Addition and subtraction' })
  )
  rerender(<LargeNumbersTester {...props} isRunning />)
  for (const [index, sample] of samples.entries()) {
    answerProblem(sample.operation, sample.operand)
    rerender(
      <LargeNumbersTester {...props} isRunning checkTrigger={index + 1} />
    )
    random.mockReturnValue(samples[index + 1]?.random ?? 0)
    await act(() => vi.advanceTimersByTimeAsync(1500))
    expect(props.onComplete).toHaveBeenCalledTimes(
      index === samples.length - 1 ? 1 : 0
    )
  }
}, 15000)
