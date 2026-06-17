import { render, screen } from '@testing-library/react'
import { themes } from '../../src/contexts/ThemeContext'
import { createRewardDefinitionListRowDescriptor } from '../../src/ui/definitionRowDescriptors'
import type { RewardRecord } from '../../src/data/types'

const reward: RewardRecord = {
  id: 'reward-computer-games',
  title: 'Computer Games',
  costStars: 8,
  isRepeating: true,
  imageKey: 'teenieping',
}

describe('reward available summary', () => {
  it('renders existing rewards as a compact available reward instead of setup controls', () => {
    const descriptor = createRewardDefinitionListRowDescriptor({
      theme: themes.princess,
      activeChildId: 'child-1',
      activeChildStars: 12,
      isRedeeming: false,
      handleGiveReward: vi.fn(),
    })

    render(<>{descriptor.renderItem(reward)}</>)

    expect(
      screen.getByLabelText('Computer Games available reward')
    ).toBeInTheDocument()
    expect(screen.getByAltText('Computer Games reward')).toBeInTheDocument()
    expect(screen.getByText('Computer Games')).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'Reward name' })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Reward image')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Keep available after buying' })
    ).not.toBeInTheDocument()
  })
})
