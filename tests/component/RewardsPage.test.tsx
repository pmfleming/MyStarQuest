import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import RewardsPage from '../../src/pages/RewardsPage'
import { themes } from '../../src/contexts/ThemeContext'
import { getThemeAsset } from '../../src/ui/themeAssets'

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

it.each(['teenie'] as const)(
  'confirms reward deletion with the shared %s Yes/No buttons',
  async (themeId) => {
    rewardData.themeId = themeId
    render(<RewardsPage />)
    const card = screen
      .getByRole('button', { name: 'Delete Play' })
      .closest('article')!
    fireEvent.click(screen.getByRole('button', { name: 'Delete Play' }))
    expect(deleteReward).not.toHaveBeenCalled()
    expect(card).not.toHaveClass('whimsical-card-exiting')
    expect(screen.getByRole('button', { name: 'Buy Play' })).toBeDisabled()
    const yes = screen.getByRole('button', { name: 'Yes, delete' })
    const no = screen.getByRole('button', { name: 'No, keep' })
    expect(yes.querySelector('img')).toHaveAttribute(
      'src',
      getThemeAsset(themeId, 'confirmExitImage')
    )
    expect(no.querySelector('img')).toHaveAttribute(
      'src',
      getThemeAsset(themeId, 'continueActivityImage')
    )
    expect(no).toHaveFocus()
    fireEvent.click(no)
    expect(deleteReward).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Buy Play' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Delete Play' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Delete Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    fireEvent.animationEnd(card)
    await waitFor(() =>
      expect(deleteReward).toHaveBeenCalledExactlyOnceWith('reward')
    )
  }
)
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
