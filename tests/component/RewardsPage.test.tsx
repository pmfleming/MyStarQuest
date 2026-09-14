import type { ReactNode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import RewardsPage from '../../src/pages/RewardsPage'
import { themes } from '../../src/contexts/ThemeContext'

const giveReward = vi.hoisted(() => vi.fn())
const rewardData = vi.hoisted(() => ({
  rewards: [{ id: 'reward', title: 'Play', costStars: 3, isRepeating: true }],
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: 'child' }),
}))
vi.mock('../../src/contexts/ThemeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/contexts/ThemeContext')>()),
  useTheme: () => ({ theme: themes.princess }),
}))
vi.mock('../../src/components/TabContent', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../src/data/useRewards', () => ({
  useRewards: () => ({
    rewards: rewardData.rewards,
    activeChildStars: 5,
    giveReward,
    createStandardReward: vi.fn(),
    deleteReward: vi.fn(),
  }),
}))
beforeEach(() => {
  rewardData.rewards = [
    { id: 'reward', title: 'Play', costStars: 3, isRepeating: true },
  ]
  giveReward
    .mockReset()
    .mockResolvedValue({ title: 'Play', starsBefore: 5, starsAfter: 2 })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('surfaces a failed purchase on its card and lets the user retry', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  giveReward
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ title: 'Play', starsBefore: 5, starsAfter: 2 })
  render(<RewardsPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('failed')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  await waitFor(() => expect(giveReward).toHaveBeenCalledTimes(2))
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  )
})

it('celebrates inside the same card, counts down, and finishes without another click', async () => {
  vi.useFakeTimers()
  let finish!: (value: {
    title: string
    starsBefore: number
    starsAfter: number
  }) => void
  giveReward.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    })
  )
  render(<RewardsPage />)
  const card = screen.getByRole('heading', { name: 'Play' }).closest('article')
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  expect(giveReward).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await act(async () => {
    finish({ title: 'Play', starsBefore: 12, starsAfter: 9 })
  })
  const celebration = screen.getByRole('status', { name: 'Play purchased' })
  expect(card).toContainElement(celebration)
  expect(celebration).toHaveTextContent('9 stars remaining')
  expect(celebration.querySelector('strong')).toHaveTextContent('12')
  expect(screen.queryByText('You earned it!')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Yay!' })).not.toBeInTheDocument()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1600)
  })
  expect(celebration.querySelector('strong')).toHaveTextContent('9')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1950)
  })
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Buy Play' })).toBeEnabled()
  expect(giveReward).toHaveBeenCalledTimes(1)
})

it('shows the final balance immediately with reduced motion', async () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true }))
  )
  try {
    render(<RewardsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
    const celebration = await screen.findByRole('status', {
      name: 'Play purchased',
    })
    expect(celebration.querySelector('strong')).toHaveTextContent('2')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  } finally {
    vi.unstubAllGlobals()
  }
})

it('retains a one-time reward at its original position until its animation finishes', async () => {
  vi.useFakeTimers()
  rewardData.rewards = [
    { id: 'reward', title: 'Play', costStars: 3, isRepeating: false },
  ]
  let finish!: (value: {
    title: string
    starsBefore: number
    starsAfter: number
  }) => void
  giveReward.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    })
  )
  const { rerender } = render(<RewardsPage />)
  const card = screen.getByRole('heading', { name: 'Play' }).closest('article')
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  rewardData.rewards = []
  rerender(<RewardsPage />)
  expect(card).toBeInTheDocument()
  await act(async () => {
    finish({ title: 'Play', starsBefore: 5, starsAfter: 2 })
  })
  expect(card).toContainElement(
    screen.getByRole('status', { name: 'Play purchased' })
  )
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3550)
  })
  expect(card).not.toBeInTheDocument()
})
