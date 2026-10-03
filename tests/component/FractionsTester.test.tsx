import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import FractionsTester, {
  type FractionsTesterProps,
} from '../../src/components/FractionsTester'
import { celebrateSuccess } from '../../src/lib/celebrate'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(celebrateSuccess).mockClear()
})
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
  }
}

const tick = async (ms = 1500) => {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
}

it('cancels pending feedback and restores all cards when restarting', async () => {
  const activity = mountActivity({ totalProblems: 1 })
  fireEvent.click(
    screen.getByRole('button', { name: '1 out of 4 equal parts' })
  )
  activity.update({ isRunning: false })
  await tick(20)
  activity.update({ isRunning: true })
  await tick(600)
  expect(
    screen.getAllByRole('button', { name: /out of .* equal parts/ })
  ).toHaveLength(3)
  const correct = screen.getByRole('button', { name: '2 out of 4 equal parts' })
  expect(correct).toBeEnabled()
  fireEvent.click(correct)
  activity.update({ isRunning: false })
  await tick(20)
  activity.update({ isRunning: true })
  await tick()
  expect(activity.props.onComplete).not.toHaveBeenCalled()
  expect(
    screen.getByRole('button', { name: '2 out of 4 equal parts' })
  ).toBeEnabled()
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
  expect(
    screen.getByRole('button', { name: '2 out of 9 equal parts' })
  ).toBeInTheDocument()
  // Updates received during play apply to the next round, not the current puzzle.
  activity.update({ maxDenominator: 2 })
  expect(
    screen.getByRole('button', { name: '2 out of 9 equal parts' })
  ).toBeInTheDocument()
  activity.update({ isRunning: false })
  await tick(20)
  expect(
    screen.getByRole('button', { name: 'Decrease maximum denominator' })
  ).toBeDisabled()
  activity.update({ isRunning: true })
  expect(
    screen.getByRole('button', { name: '1 out of 2 equal parts' })
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: '2 out of 9 equal parts' })
  ).not.toBeInTheDocument()
})

it('dismisses wrong answers, reveals a simplified hint and completes only once', async () => {
  const activity = mountActivity({
    isRunning: false,
    totalProblems: 1,
    failureModeEnabled: true,
  })
  const levels = within(
    screen.getByRole('radiogroup', { name: 'Fraction activity' })
  ).getAllByRole('radio')
  expect(levels).toHaveLength(2)
  expect(levels[0]).toHaveAttribute('aria-checked', 'true')
  fireEvent.click(screen.getByRole('radio', { name: 'Simplify fractions' }))
  activity.update({ isRunning: true })
  expect(
    screen.getByRole('img', { name: 'Example: 2 out of 4 equal parts' })
  ).toBeInTheDocument()
  const choices = within(
    screen.getByRole('group', { name: 'Choose the simplified fraction' })
  )
  expect(choices.getAllByRole('button')).toHaveLength(3)
  expect(
    choices.queryByRole('button', { name: '2 out of 4 equal parts' })
  ).not.toBeInTheDocument()
  fireEvent.click(
    choices.getByRole('button', { name: '1 out of 4 equal parts' })
  )
  const correct = choices.getByRole('button', {
    name: '1 out of 2 equal parts',
  })
  expect(correct).toBeDisabled()
  fireEvent.click(correct)
  await tick(600)
  expect(activity.props.onComplete).not.toHaveBeenCalled()
  const remainingWrong = choices
    .getAllByRole('button')
    .find((button) => button !== correct)!
  fireEvent.click(remainingWrong)
  await tick(600)
  expect(choices.getAllByRole('button')).toHaveLength(1)
  expect(activity.props.onFail).not.toHaveBeenCalled()
  expect(
    within(
      screen.getByRole('group', { name: 'Match the shaded fraction' })
    ).getByRole('img', { name: '1 out of 2 equal parts', exact: true })
  ).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Replay fraction example' })
  )
  const target = within(
    screen.getByRole('group', { name: 'Match the shaded fraction' })
  )
  expect(
    target.getByRole('img', { name: '1 out of 2 equal parts', exact: true })
  ).toBeInTheDocument()
  expect(
    target.queryByRole('img', { name: '2 out of 4 equal parts', exact: true })
  ).not.toBeInTheDocument()
  fireEvent.click(
    choices.getByRole('button', { name: '1 out of 2 equal parts' })
  )
  expect(correct).toBeDisabled()
  fireEvent.click(correct)
  expect(celebrateSuccess).not.toHaveBeenCalled()
  await tick()
  expect(activity.props.onComplete).toHaveBeenCalledTimes(1)
})
