import { fireEvent, render, screen } from '@testing-library/react'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { themes } from '../../src/contexts/ThemeContext'
import { createRewardDefinitionListRowDescriptor } from '../../src/ui/definitionRowDescriptors'
import { toStandardActionListDescriptor } from '../../src/ui/listDescriptorTypes'
import type { RewardRecord } from '../../src/data/types'

const reward: RewardRecord = {
  id: 'reward-computer-games',
  title: 'Computer Games',
  costStars: 8,
  isRepeating: true,
  imageKey: 'teenieping',
}

describe('reward availability', () => {
  it('allows purchases only with enough stars, a selected child, and no pending redemption', () => {
    const handleGiveReward = vi.fn()
    const list = (
      activeChildStars: number,
      activeChildId: string | null = 'child-1',
      isRedeeming = false
    ) => (
      <StandardActionList
        theme={themes.princess}
        items={[reward]}
        getKey={(item) => item.id}
        getItemLabel={(item) => item.title}
        {...toStandardActionListDescriptor(
          createRewardDefinitionListRowDescriptor({
            theme: themes.princess,
            activeChildId,
            activeChildStars,
            isRedeeming,
            handleGiveReward,
          })
        )}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        addLabel="Add reward"
        hideAdd
      />
    )
    const { rerender } = render(list(7))
    const buy = () => screen.getByRole('button', { name: 'Buy Computer Games' })
    expect(buy()).toBeDisabled()
    fireEvent.click(buy())
    expect(handleGiveReward).not.toHaveBeenCalled()

    rerender(list(8))
    expect(buy()).toBeEnabled()
    fireEvent.click(buy())
    expect(handleGiveReward).toHaveBeenCalledExactlyOnceWith(reward)

    rerender(list(8, 'child-1', true))
    expect(buy()).toBeDisabled()
    fireEvent.click(buy())
    rerender(list(8, null))
    expect(buy()).toBeDisabled()
    fireEvent.click(buy())
    expect(handleGiveReward).toHaveBeenCalledTimes(1)
  })
})
