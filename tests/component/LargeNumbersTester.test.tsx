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
import * as problems from '../../src/lib/largeNumbersProblems'

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

it.each([
  {
    label: 'Three crowns: 1–9,999',
    a: 1999,
    b: 2091,
    operation: '+' as const,
    answer: 4090,
  },
  {
    label: 'Four crowns: 1–999,999',
    a: 700000,
    b: 95910,
    operation: '-' as const,
    answer: 604090,
  },
])(
  'completes $label with carrying or borrowing and zero digits',
  async ({ label, a, b, operation, answer }) => {
    vi.spyOn(problems, 'generateLargeNumbersProblem').mockReturnValue({
      a,
      b,
      operation,
    })
    const props = {
      theme: themes.princess,
      totalProblems: 1,
      starReward: 1,
      isRunning: false,
      checkTrigger: 0,
      onComplete: vi.fn(),
      onAdjustProblems: vi.fn(),
      onStarsChange: vi.fn(),
    }
    const view = render(<LargeNumbersTester {...props} />)
    expect(
      within(
        screen.getByRole('radiogroup', { name: 'Large numbers difficulty' })
      ).getAllByRole('radio')
    ).toHaveLength(4)
    fireEvent.click(screen.getByRole('radio', { name: label }))
    fireEvent.click(
      screen.getByRole('radio', {
        name: operation === '+' ? 'Addition only' : 'Subtraction only',
      })
    )
    view.rerender(<LargeNumbersTester {...props} isRunning />)
    expect(
      screen.getByRole('group', {
        name: `${a} ${operation === '+' ? 'plus' : 'minus'} ${b}`,
      })
    ).toBeInTheDocument()
    for (const [name, count] of [
      ['Add hundred thousand', Math.floor(answer / 100000)],
      ['Add thousand', 4],
      ['Add ten', 9],
    ] as const) {
      for (let index = 0; index < count; index++) {
        fireEvent.click(screen.getByRole('button', { name, exact: true }))
      }
    }
    expect(
      screen.getByRole('button', { name: 'Add ten', exact: true })
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Remove one', exact: true })
    ).toBeDisabled()
    expect(
      screen.getByRole('group', { name: 'Your answer' })
    ).toHaveTextContent(`=${answer < 100000 ? '4090' : '604090'}`)
    view.rerender(<LargeNumbersTester {...props} isRunning checkTrigger={1} />)
    expect(
      screen.getByRole('button', { name: 'Add thousand', exact: true })
    ).toBeDisabled()
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(props.onComplete).toHaveBeenCalledTimes(1)
  }
)

it('clears all digits and advances the progressive problem index after a correct answer', async () => {
  const generate = vi
    .spyOn(problems, 'generateLargeNumbersProblem')
    .mockReturnValueOnce({ a: 999, b: 1, operation: '+' })
    .mockReturnValue({ a: 2000, b: 2, operation: '+' })
  const props = {
    theme: themes.princess,
    totalProblems: 2,
    starReward: 1,
    isRunning: false,
    checkTrigger: 0,
    onComplete: vi.fn(),
    onAdjustProblems: vi.fn(),
    onStarsChange: vi.fn(),
  }
  const view = render(<LargeNumbersTester {...props} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Three crowns: 1–9,999' }))
  view.rerender(<LargeNumbersTester {...props} isRunning />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Add thousand', exact: true })
  )
  view.rerender(<LargeNumbersTester {...props} isRunning checkTrigger={1} />)
  await act(async () => {
    vi.advanceTimersByTime(1500)
  })
  expect(generate).toHaveBeenLastCalledWith('addition', 'three-crowns', 1, 2)
  expect(screen.getByRole('group', { name: '2000 plus 2' })).toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Your answer' })).toHaveTextContent(
    '=0000'
  )
  expect(
    screen.getByRole('button', { name: 'Remove thousand', exact: true })
  ).toBeDisabled()
  expect(props.onComplete).not.toHaveBeenCalled()
})
