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

    render(
      <>
        {descriptor.renderHeader?.(reward)}
        {descriptor.renderItem(reward)}
      </>
    )

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

  it('uses the princess lock image when the child needs more stars', () => {
    const descriptor = createRewardDefinitionListRowDescriptor({
      theme: themes.princess,
      activeChildId: 'child-1',
      activeChildStars: 3,
      isRedeeming: false,
      handleGiveReward: vi.fn(),
    })

    const action = descriptor.getPrimaryAction?.(reward)

    const { container } = render(<>{action?.icon}</>)

    const lockImage = container.querySelector('img')

    expect(lockImage).toHaveAttribute('alt', '')
    expect(lockImage).toHaveAttribute(
      'src',
      expect.stringContaining('locked-reward.png')
    )
    expect(lockImage).toHaveStyle({
      width: '22px',
      height: '22px',
      objectFit: 'contain',
    })
  })
})
