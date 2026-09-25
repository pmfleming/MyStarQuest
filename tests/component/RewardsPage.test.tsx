import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { themes } from '../../src/contexts/ThemeContext'
import RewardsPage from '../../src/pages/RewardsPage'

const giveReward = vi.hoisted(() => vi.fn())
const deleteReward = vi.hoisted(() => vi.fn())
const rewardData = vi.hoisted(() => ({
  themeId: 'princess' as 'princess' | 'teenie',
  rewards: [{ id: 'reward', title: 'Play', costStars: 3, isRepeating: true }],
}))
vi.mock('../../src/contexts/ActiveChildContext', () => ({
  useActiveChild: () => ({ activeChildId: 'child' }),
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
    activeChildStars: 5,
    giveReward,
    createStandardReward: vi.fn(),
    deleteReward,
  }),
}))
beforeEach(() => {
  rewardData.themeId = 'princess'
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
