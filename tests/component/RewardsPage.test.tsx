import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import RewardsPage from '../../src/pages/RewardsPage'
import { themes } from '../../src/contexts/ThemeContext'

const giveReward = vi.hoisted(() => vi.fn())
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
    rewards: [{ id: 'reward', title: 'Play', costStars: 3, isRepeating: true }],
    activeChildStars: 5,
    giveReward,
    createStandardReward: vi.fn(),
    deleteReward: vi.fn(),
  }),
}))
afterEach(() => vi.restoreAllMocks())

it('surfaces a failed purchase on its card and lets the user retry', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  giveReward
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(undefined)
  render(<RewardsPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('failed')
  fireEvent.click(screen.getByRole('button', { name: 'Buy Play' }))
  await waitFor(() => expect(giveReward).toHaveBeenCalledTimes(2))
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  )
})
