import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { themes } from '../../src/contexts/ThemeContext'
import RewardsPage from '../../src/pages/RewardsPage'

const giveReward = vi.hoisted(() => vi.fn())
const deleteReward = vi.hoisted(() => vi.fn())
const rewardData = vi.hoisted(() => ({
  childId: null as string | null,
  stars: 2,
  themeId: 'princess' as 'princess' | 'teenie',
  rewards: [{ id: 'reward', title: 'Play', costStars: 3, isRepeating: true }],
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: rewardData.childId }),
}))
vi.mock('../../src/contexts/ThemeContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/contexts/ThemeContext')>()),
  useTheme: () => ({ theme: themes[rewardData.themeId] }),
}))
vi.mock('../../src/components/TabContent', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('../../src/data/useRewards', () => ({
  useRewards: () => ({
    rewards: rewardData.rewards,
    activeChildStars: rewardData.stars,
    giveReward,
    createStandardReward: vi.fn(),
    deleteReward,
  }),
}))
beforeEach(() => {
  rewardData.themeId = 'princess'
  rewardData.childId = null
  rewardData.stars = 2
  deleteReward.mockReset().mockResolvedValue(undefined)
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

it('requires a child and sufficient stars, blocks duplicate purchases and permits retry', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  giveReward
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ title: 'Play', starsBefore: 5, starsAfter: 2 })
  const { rerender } = render(<RewardsPage />)
  const buy = () => screen.getByRole('button', { name: 'Buy Play' })
  expect(buy()).toBeDisabled()
  rewardData.stars = 5
  rerender(<RewardsPage />)
  expect(buy()).toBeDisabled()
  rewardData.childId = 'child'
  rewardData.stars = 2
  rerender(<RewardsPage />)
  expect(buy()).toBeDisabled()
  rewardData.stars = 3
  rerender(<RewardsPage />)
  expect(buy()).toBeEnabled()
  fireEvent.click(buy())
  expect(buy()).toBeDisabled()
  fireEvent.click(buy())
  expect(giveReward).toHaveBeenCalledTimes(1)
  expect(await screen.findByRole('alert')).toHaveTextContent('failed')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  await waitFor(() => expect(giveReward).toHaveBeenCalledTimes(2))
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  )
})
