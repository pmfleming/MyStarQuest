import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useChoreActivityActions } from '../../src/data/useChoreActivityActions'
import { completeTaskAndAwardStars } from '../../src/lib/starActions'
import { celebrateSuccess } from '../../src/lib/celebrate'
import type { EatingTaskWithEphemeral } from '../../src/data/types'

vi.mock('../../src/lib/starActions', () => ({
  completeTaskAndAwardStars: vi.fn(),
}))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const dinner: EatingTaskWithEphemeral = {
  id: 'dinner',
  childId: 'child',
  title: 'Dinner',
  category: 'eating',
  taskType: 'eating',
  starValue: 3,
  isRepeating: false,
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  dinnerDurationSeconds: 600,
  dinnerTotalBites: 2,
  manageDinnerBitesLeft: 1,
  manageDinnerRemainingSeconds: 300,
  manageDinnerTimerStartedAt: 10_000,
}
const setup = (signedIn = true) => {
  const updateEphemeral = vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() =>
    useChoreActivityActions({
      user: signedIn ? { uid: 'user' } : null,
      activeChildId: 'child',
      dateKey: '2026-09-05',
      updateEphemeral,
    })
  )
  return { ...result.current, updateEphemeral }
}

describe('chore completion persistence', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  it('does not complete dinner after a reset during the final bite animation', async () => {
    vi.useFakeTimers().setSystemTime(20_000)
    vi.mocked(completeTaskAndAwardStars).mockResolvedValue({
      appliedDelta: 3,
      wasAlreadyAwarded: false,
    })
    const actions = setup()
    const pendingBite = actions.applyBite(dinner)
    await actions.resetDinner(dinner)
    await vi.advanceTimersByTimeAsync(850)
    await expect(pendingBite).resolves.toBe(false)
    expect(completeTaskAndAwardStars).not.toHaveBeenCalled()
    expect(actions.updateEphemeral).toHaveBeenLastCalledWith(dinner.id, {
      manageDinnerBitesLeft: 2,
      manageDinnerRemainingSeconds: 600,
      manageDinnerTimerStartedAt: null,
      manageDinnerCompletedAt: null,
    })
  })

  it.each([true, false])(
    'freezes time before the final bite delay (signed in: %s)',
    async (signedIn) => {
      vi.useFakeTimers().setSystemTime(20_000)
      vi.mocked(completeTaskAndAwardStars).mockResolvedValue({
        appliedDelta: 3,
        wasAlreadyAwarded: false,
      })
      const actions = setup(signedIn)
      await expect(
        actions.applyBite({ ...dinner, manageDinnerBitesLeft: 2 })
      ).resolves.toBe(false)
      expect(actions.updateEphemeral).toHaveBeenCalledWith('dinner', {
        manageDinnerBitesLeft: 1,
      })
      const pending = actions.applyBite(dinner)
      expect(completeTaskAndAwardStars).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(850)
      await expect(pending).resolves.toBe(true)
      const patch = {
        manageDinnerBitesLeft: 0,
        manageDinnerCompletedAt: 20_850,
        manageDinnerTimerStartedAt: null,
        manageDinnerRemainingSeconds: 290,
      }
      if (signedIn)
        expect(completeTaskAndAwardStars).toHaveBeenCalledWith(
          expect.objectContaining({ updates: patch })
        )
      else
        expect(actions.updateEphemeral).toHaveBeenLastCalledWith(
          'dinner',
          patch
        )
      expect(celebrateSuccess).not.toHaveBeenCalled()
    }
  )
})
