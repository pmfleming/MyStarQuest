import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SharingTester from '../../src/components/SharingTester'
import { themes } from '../../src/contexts/ThemeContext'
import * as problems from '../../src/lib/sharingProblems'
import { getThemeAsset } from '../../src/ui/themeAssets'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(problems, 'generateSharingProblem').mockReturnValue({
    total: 6,
    containers: 2,
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const makeProps = () => ({
  theme: themes.princess,
  totalProblems: 1,
  starReward: 3,
  isRunning: true,
  checkTrigger: 0,
  onComplete: vi.fn(),
  onFail: vi.fn(),
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
})
const add = (container: number, count = 1) => {
  for (let i = 0; i < count; i++)
    fireEvent.click(
      screen.getByRole('button', { name: `Add one to container ${container}` })
    )
}

it.each(['princess', 'teenie'] as const)(
  'conserves symbols when moving and returning them in %s',
  (theme) => {
    const { container } = render(
      <SharingTester {...makeProps()} theme={themes[theme]} />
    )
    expect(
      screen.getByRole('button', { name: 'Return one from container 1' })
    ).toBeDisabled()
    add(1, 6)
    expect(
      screen.getByRole('button', { name: 'Add one to container 2' })
    ).toBeDisabled()
    expect(
      screen.getByRole('group', { name: /0 .* left to share/ })
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Return one from container 1' })
    )
    add(2)
    expect(
      screen.getByRole('group', { name: /Container 1: 5/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /Container 2: 1/ })
    ).toBeInTheDocument()
    const images = container.querySelectorAll('.sharing-board img')
    expect(images).toHaveLength(6)
    for (const image of images)
      expect(image).toHaveAttribute('src', getThemeAsset(theme, 'mathsCounter'))
  }
)

it('rejects an unequal full distribution, permits correction and completes only once', async () => {
  const props = makeProps()
  const view = render(<SharingTester {...props} />)
  add(1, 4)
  add(2, 2)
  view.rerender(<SharingTester {...props} checkTrigger={1} />)
  expect(view.container.querySelectorAll('[data-unequal]')).toHaveLength(2)
  await act(async () => {
    vi.advanceTimersByTime(600)
  })
  expect(props.onComplete).not.toHaveBeenCalled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Return one from container 1' })
  )
  add(2)
  view.rerender(<SharingTester {...props} checkTrigger={2} />)
  expect(
    screen.getByRole('button', { name: 'Return one from container 1' })
  ).toBeDisabled()
  view.rerender(<SharingTester {...props} checkTrigger={3} />)
  await act(async () => {
    vi.advanceTimersByTime(1600)
  })
  expect(props.onComplete).toHaveBeenCalledTimes(1)
})

it('rejects equal containers with symbols remaining and honours failure mode', async () => {
  const props = makeProps()
  const view = render(<SharingTester {...props} />)
  add(1)
  add(2)
  for (let trigger = 1; trigger <= 3; trigger++) {
    view.rerender(<SharingTester {...props} checkTrigger={trigger} />)
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
  }
  expect(
    screen.getByRole('button', { name: 'Add one to container 1' })
  ).toBeDisabled()
  await act(async () => {
    vi.advanceTimersByTime(3000)
  })
  expect(props.onFail).toHaveBeenCalledTimes(1)
  expect(props.onComplete).not.toHaveBeenCalled()
})

it('advances with empty containers and resets pending completion when stopped', async () => {
  const props = { ...makeProps(), totalProblems: 2 }
  const view = render(<SharingTester {...props} />)
  add(1, 3)
  add(2, 3)
  view.rerender(<SharingTester {...props} checkTrigger={1} />)
  await act(async () => {
    vi.advanceTimersByTime(1500)
  })
  expect(
    screen.getByRole('group', { name: '6 crowns left to share' })
  ).toBeInTheDocument()
  add(1, 3)
  add(2, 3)
  view.rerender(<SharingTester {...props} checkTrigger={2} />)
  view.rerender(<SharingTester {...props} checkTrigger={2} isRunning={false} />)
  await act(async () => {
    vi.advanceTimersByTime(1600)
  })
  expect(props.onComplete).not.toHaveBeenCalled()
  view.rerender(<SharingTester {...props} checkTrigger={2} />)
  expect(
    screen.getByRole('group', { name: '6 crowns left to share' })
  ).toBeInTheDocument()
  expect(problems.generateSharingProblem).toHaveBeenLastCalledWith(
    'easy',
    new Set(['6/2'])
  )
})

it('uses the saved difficulty and existing setup control', () => {
  const props = {
    ...makeProps(),
    difficulty: 'hard' as const,
    onDifficultyChange: vi.fn(),
  }
  const view = render(<SharingTester {...props} isRunning={false} />)
  expect(screen.getByRole('radio', { name: 'Hard' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Easy' }))
  expect(props.onDifficultyChange).toHaveBeenCalledWith('easy')
  view.rerender(<SharingTester {...props} />)
  expect(problems.generateSharingProblem).toHaveBeenCalledWith(
    'hard',
    expect.any(Set)
  )
})
