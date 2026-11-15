import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SharingTester from '../../src/components/SharingTester'
import { themes } from '../../src/contexts/ThemeContext'
import * as friends from '../../src/data/sharingFriends'
import * as problems from '../../src/lib/sharingProblems'
import { getThemeAsset } from '../../src/ui/themeAssets'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(problems, 'generateSharingProblem').mockReturnValue({
    total: 6,
    containers: 2,
  })
  vi.spyOn(friends, 'pickSharingFriends').mockImplementation((themeId, count) =>
    friends.getSharingFriends(themeId).slice(0, count)
  )
  // Default to the theme's own counter so assertions stay deterministic.
  vi.spyOn(friends, 'pickSharingTreat').mockImplementation(
    (themeId) => friends.getSharingTreats(themeId)[0]!
  )
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
const name = (container: number, theme = 'princess') =>
  (theme === 'teenie' ? ['Heartsping', 'Happying'] : ['Rosa', 'Lily'])[
    container - 1
  ]
const add = (container: number, count = 1, theme = 'princess') => {
  for (let i = 0; i < count; i++)
    fireEvent.click(
      screen.getByRole('button', {
        name: `Give one to ${name(container, theme)}`,
      })
    )
}
const takeBack = (container: number, theme = 'princess') =>
  screen.getByRole('button', {
    name: `Take one back from ${name(container, theme)}`,
  })

it.each(['princess', 'teenie'] as const)(
  'conserves symbols when moving and returning them in %s',
  (theme) => {
    const { container } = render(
      <SharingTester {...makeProps()} theme={themes[theme]} />
    )
    expect(takeBack(1, theme)).toBeDisabled()
    add(1, 6, theme)
    expect(
      screen.getByRole('button', { name: `Give one to ${name(2, theme)}` })
    ).toBeDisabled()
    expect(
      screen.getByRole('group', { name: /0 .* left to share/ })
    ).toBeInTheDocument()
    fireEvent.click(takeBack(1, theme))
    add(2, 1, theme)
    expect(
      screen.getByRole('group', { name: new RegExp(`^${name(1, theme)}: 5`) })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {
        name: new RegExp(`^${name(2, theme)}: 1 .*, feeling sad$`),
      })
    ).toBeInTheDocument()
    const images = container.querySelectorAll('.sharing-counters img')
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
  fireEvent.click(takeBack(1))
  add(2)
  view.rerender(<SharingTester {...props} checkTrigger={2} />)
  expect(takeBack(1)).toBeDisabled()
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
    screen.getByRole('button', { name: 'Give one to Rosa' })
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

it.each(['hard', 'mixed'] as const)(
  'uses the saved %s difficulty and existing setup control',
  (difficulty) => {
    const props = {
      ...makeProps(),
      difficulty,
      onDifficultyChange: vi.fn(),
    }
    const view = render(<SharingTester {...props} isRunning={false} />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(
      screen.getByRole('radio', {
        name: difficulty === 'hard' ? 'Hard' : 'Mixed: 2, 3 or 4 friends',
      })
    ).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Easy' }))
    expect(props.onDifficultyChange).toHaveBeenCalledWith('easy')
    view.rerender(<SharingTester {...props} />)
    expect(problems.generateSharingProblem).toHaveBeenCalledWith(
      difficulty,
      expect.any(Set)
    )
  }
)

it('shows friends feeling sad when sharing is unfair and happy when it is fair', async () => {
  const props = makeProps()
  const view = render(<SharingTester {...props} />)
  const moods = () =>
    Array.from(view.container.querySelectorAll('[data-mood]')).map((node) =>
      node.getAttribute('data-mood')
    )
  expect(moods()).toEqual(['waiting', 'waiting'])
  add(1, 4)
  add(2, 2)
  expect(moods()).toEqual(['waiting', 'sad'])
  view.rerender(<SharingTester {...props} checkTrigger={1} />)
  expect(screen.getByText('Not fair!')).toBeInTheDocument()
  expect(screen.getByText('Too many!')).toBeInTheDocument()
  await act(async () => {
    vi.advanceTimersByTime(600)
  })
  fireEvent.click(takeBack(1))
  add(2)
  expect(moods()).toEqual(['happy', 'happy'])
})

it('shares themed treats such as Teenieping sweets', () => {
  vi.mocked(friends.pickSharingTreat).mockImplementation(
    (themeId) => friends.getSharingTreats(themeId)[1]!
  )
  const { container } = render(
    <SharingTester {...makeProps()} theme={themes.teenie} />
  )
  expect(
    screen.getByRole('group', { name: '6 sweets left to share' })
  ).toBeInTheDocument()
  add(1, 1, 'teenie')
  expect(
    screen.getByRole('group', { name: /^Heartsping: 1 sweet$/ })
  ).toBeInTheDocument()
  expect(container.querySelectorAll('.sharing-token')).toHaveLength(6)
  expect(container.querySelectorAll('.sharing-friend-art')).toHaveLength(2)
})
