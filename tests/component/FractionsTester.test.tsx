import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import FractionsTester from '../../src/components/FractionsTester'
import type { ActivityChoreProps } from '../../src/components/ui/ActivityControls'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function mountActivity(overrides: Partial<ActivityChoreProps> = {}) {
  let props: ActivityChoreProps = {
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
  const update = (patch: Partial<ActivityChoreProps>) => {
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

it('offers picture-to-symbol recognition and clears the choice and hints when restarted', async () => {
  const activity = mountActivity({ isRunning: false, totalProblems: 1 })
  await tick(20)
  fireEvent.click(screen.getByRole('radio', { name: 'Recognise fractions' }))
  activity.update({ isRunning: true })
  expect(
    screen.queryByRole('group', { name: 'Your fraction' })
  ).not.toBeInTheDocument()
  const choices = screen.getByRole('group', {
    name: 'Choose the matching fraction',
  })
  fireEvent.click(
    within(choices).getByRole('button', { name: '1 out of 4 equal parts' })
  )
  activity.check()
  await tick(600)
  expect(activity.props.onComplete).not.toHaveBeenCalled()
  fireEvent.click(
    within(choices).getByRole('button', { name: '1 out of 2 equal parts' })
  )
  activity.check()
  await tick()
  expect(activity.props.onComplete).toHaveBeenCalledTimes(1)
  activity.update({ isRunning: false })
  await tick(20)
  activity.update({ isRunning: true })
  expect(
    screen.getByRole('button', { name: '1 out of 2 equal parts' })
  ).toHaveAttribute('aria-pressed', 'false')
  expect(screen.queryByRole('img', { name: 'Correct' })).not.toBeInTheDocument()
})
