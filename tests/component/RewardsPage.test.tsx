import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
  rewards: [
    {
      id: 'reward',
      title: 'Play',
      costStars: 3,
      isRepeating: true,
      imageKey: '',
    },
  ],
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
    {
      id: 'reward',
      title: 'Play',
      costStars: 3,
      isRepeating: true,
      imageKey: '',
    },
  ]
  giveReward
    .mockReset()
    .mockResolvedValue({ title: 'Play', starsBefore: 5, starsAfter: 2 })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('enlarges the reward and its overlay across the card, hides controls, and restores on double-click or click-away', () => {
  rewardData.rewards[0].imageKey = 'legoPokemon'
  rewardData.rewards[0].title = 'Charmander'
  rewardData.childId = 'child'
  rewardData.stars = 5
  render(<RewardsPage />)
  const image = screen.getByRole('img', { name: 'Charmander reward' })
  const card = image.closest('article')!
  const buy = screen.getByRole('button', { name: 'Buy Charmander' })
  fireEvent.click(image)
  expect(
    screen.queryByRole('img', { name: 'Charmander reward enlarged' })
  ).not.toBeInTheDocument()
  fireEvent.doubleClick(image)
  const preview = screen.getByRole('button', {
    name: 'Close enlarged Charmander reward',
  })
  expect(preview).toHaveFocus()
  expect(
    within(preview).getByRole('img', { name: 'Charmander reward enlarged' })
  ).toBeVisible()
  expect(preview.querySelectorAll('img')).toHaveLength(2)
  expect(buy).not.toBeVisible()
  expect(image).not.toBeVisible()
  expect(
    within(card).queryByRole('button', { name: 'Delete Charmander' })
  ).not.toBeInTheDocument()
  expect(card.querySelector('[data-card-region="body"]')).toHaveAttribute(
    'inert'
  )
  expect(card.querySelector('[data-card-region="body"]')).not.toBeVisible()
  fireEvent.click(preview, { detail: 1 })
  expect(preview).toBeVisible()
  fireEvent.doubleClick(preview)
  expect(buy).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Enlarge Charmander reward' })
  ).toHaveFocus()
  fireEvent.doubleClick(image)
  fireEvent.pointerDown(document.body)
  expect(
    screen.queryByRole('img', { name: 'Charmander reward enlarged' })
  ).not.toBeInTheDocument()
  expect(buy).toBeVisible()
  expect(giveReward).not.toHaveBeenCalled()
  expect(deleteReward).not.toHaveBeenCalled()
})

it('supports keyboard preview and Escape, and closes when the active child changes', () => {
  rewardData.rewards[0].imageKey = 'legoPokemon'
  const { rerender } = render(<RewardsPage />)
  const trigger = screen.getByRole('button', { name: 'Enlarge Play reward' })
  trigger.focus()
  fireEvent.keyDown(trigger, { key: 'Enter' })
  expect(
    screen.getByRole('img', { name: 'Play reward enlarged' })
  ).toBeVisible()
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(trigger).toHaveFocus()
  expect(
    screen.queryByRole('img', { name: 'Play reward enlarged' })
  ).not.toBeInTheDocument()
  fireEvent.keyDown(trigger, { key: ' ' })
  rewardData.childId = 'another-child'
  rerender(<RewardsPage />)
  expect(
    screen.queryByRole('img', { name: 'Play reward enlarged' })
  ).not.toBeInTheDocument()
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
