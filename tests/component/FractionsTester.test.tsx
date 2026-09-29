import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import FractionsTester, {
  type FractionsTesterProps,
} from '../../src/components/FractionsTester'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function mountActivity(overrides: Partial<FractionsTesterProps> = {}) {
  let props: FractionsTesterProps = {
    theme: themes.princess,
    totalProblems: 5,
    starReward: 3,
    isRunning: true,
    onComplete: vi.fn(),
    onFail: vi.fn(),
    onAdjustProblems: vi.fn(),
    onStarsChange: vi.fn(),
    checkTrigger: 0,
    ...overrides,
  }
  const view = render(<FractionsTester {...props} />)
  const update = (patch: Partial<FractionsTesterProps>) => {
    props = { ...props, ...patch }
    view.rerender(<FractionsTester {...props} />)
  }
  return {
    props,
    update,
    check: () => update({ checkTrigger: (props.checkTrigger ?? 0) + 1 }),
  }
}

const tick = async (ms = 1500) => {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}
const piece = (index: number, denominator: number) =>
  screen.getByRole('button', { name: `Piece ${index} of ${denominator}` })

it('preserves answers, supplies a visual hint after two misses on that question, and allows unlimited retries', async () => {
  const activity = mountActivity({ failureModeEnabled: true })
  fireEvent.click(piece(1, 2))
  activity.check()
  await tick()
  for (const index of [1, 2]) fireEvent.click(piece(index, 2))
  activity.check()
  await tick(600)
  expect(
    screen.queryByRole('img', { name: /Example:/ })
  ).not.toBeInTheDocument()
  expect(piece(1, 2)).toHaveAttribute('aria-pressed', 'true')
  activity.check()
  await tick(600)
  expect(
    screen.getByRole('img', { name: 'Example: 1 out of 2 equal parts' })
  ).toBeInTheDocument()
  for (let attempt = 0; attempt < 3; attempt++) {
    activity.check()
    await tick(600)
  }
  expect(activity.props.onFail).not.toHaveBeenCalled()
  fireEvent.click(piece(2, 2))
  activity.check()
  await tick()
  fireEvent.click(piece(3, 4))
  activity.check()
  await tick()
  // The old attempts must not reveal the next build question's answer.
  expect(
    screen.queryByRole('img', { name: /Example:/ })
  ).not.toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Replay fraction example' })
  )
  expect(
    screen.getByRole('img', { name: 'Example: 1 out of 4 equal parts' })
  ).toBeInTheDocument()
  expect(piece(1, 4)).toHaveAttribute('aria-pressed', 'false')
})

it('saves the chosen limit and applies it when starting a round', async () => {
  let finishSave!: () => void
  const onMaxDenominatorChange = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finishSave = resolve
      })
  )
  const activity = mountActivity({
    isRunning: false,
    maxDenominator: 8,
    onMaxDenominatorChange,
  })
  const increase = screen.getByRole('button', {
    name: 'Increase maximum denominator',
  })
  fireEvent.click(increase)
  fireEvent.click(increase)
  expect(onMaxDenominatorChange).toHaveBeenCalledExactlyOnceWith(9)
  expect(increase).toBeDisabled()
  await act(async () => finishSave())
  activity.update({ maxDenominator: 9 })
  expect(
    screen.getByRole('button', { name: 'Increase maximum denominator' })
  ).toBeDisabled()
  activity.update({ isRunning: true })
  for (let question = 0; question < 2; question++) {
    fireEvent.click(piece(1, 2))
    activity.check()
    await tick()
  }
  expect(piece(9, 9)).toBeInTheDocument()
  // Updates received during play apply to the next round, not the current puzzle.
  activity.update({ maxDenominator: 2 })
  expect(piece(9, 9)).toBeInTheDocument()
  activity.update({ isRunning: false })
  await tick(20)
  expect(
    screen.getByRole('button', { name: 'Decrease maximum denominator' })
  ).toBeDisabled()
  activity.update({ isRunning: true })
  expect(piece(2, 2)).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Piece 3 of 9' })
  ).not.toBeInTheDocument()
})

it('rejects a wrong picture-to-symbol answer, accepts several pieces at level three and resets the choice', async () => {
  const activity = mountActivity({
    isRunning: false,
    totalProblems: 1,
    maxDenominator: 9,
  })
  fireEvent.click(
    screen.getByRole('radio', { name: 'Fractions with several pieces' })
  )
  activity.update({ isRunning: true })
  expect(
    screen.getByRole('img', { name: 'Example: 2 out of 9 equal parts' })
  ).toBeInTheDocument()
  const wrong = screen
    .getAllByRole('button', { name: /out of .* equal parts/ })
    .find(
      (button) => button.getAttribute('aria-label') !== '2 out of 9 equal parts'
    )!
  fireEvent.click(wrong)
  activity.check()
  await tick(600)
  expect(activity.props.onComplete).not.toHaveBeenCalled()
  fireEvent.click(
    screen.getByRole('button', { name: '2 out of 9 equal parts' })
  )
  activity.check()
  await tick()
  expect(activity.props.onComplete).toHaveBeenCalledTimes(1)
  activity.update({ isRunning: false })
  await tick(20)
  activity.update({ isRunning: true })
  expect(
    screen.getByRole('button', { name: '2 out of 9 equal parts' })
  ).toHaveAttribute('aria-pressed', 'false')
  expect(screen.queryByRole('img', { name: 'Correct' })).not.toBeInTheDocument()
})
