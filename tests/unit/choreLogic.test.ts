import { describe, expect, it } from 'vitest'
import {
  calculateAwardTaskPatch,
  calculateWaterToiletStars,
  getNextToiletStatus,
  getNextWaterLevel,
  getWaterToiletOutcome,
} from '../../src/lib/choreLogic'
import type { WaterToiletTaskWithEphemeral } from '../../src/data/types'

describe('calculateWaterToiletStars', () => {
  it('awards both empty flask and toilet completion', () => {
    expect(calculateWaterToiletStars('empty', 'didpeepee')).toBe(2)
  })

  it('applies the combined penalty when neither check is complete', () => {
    expect(calculateWaterToiletStars('full', 'notpeepee')).toBe(-6)
  })

  it('supports neutral water states', () => {
    expect(calculateWaterToiletStars('twothirds', 'didpeepee')).toBe(1)
    expect(calculateWaterToiletStars('onethird', 'notpeepee')).toBe(-5)
  })
})

describe('calculateAwardTaskPatch', () => {
  it('marks Water/Toilet chores complete in manage mode', () => {
    const task: WaterToiletTaskWithEphemeral = {
      id: 'water-1',
      title: 'Water & Toilet Check',
      childId: 'child-1',
      category: 'watertoiletcheck',
      taskType: 'watertoiletcheck',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: false,
      starValue: 0,
      isRepeating: true,
    }

    expect(calculateAwardTaskPatch(task, 123456789)).toEqual({
      manageWaterToiletCompletedAt: 123456789,
    })
  })
})

describe('water/toilet helpers', () => {
  it('cycles through the full flask sequence', () => {
    expect(getNextWaterLevel('full')).toBe('twothirds')
    expect(getNextWaterLevel('twothirds')).toBe('onethird')
    expect(getNextWaterLevel('onethird')).toBe('empty')
    expect(getNextWaterLevel('empty')).toBe('full')
  })

  it('toggles the toilet status sequence', () => {
    expect(getNextToiletStatus('notpeepee')).toBe('didpeepee')
    expect(getNextToiletStatus('didpeepee')).toBe('notpeepee')
  })

  it('derives success and failure from the shared water/toilet outcome rules', () => {
    expect(getWaterToiletOutcome('empty', 'didpeepee')).toBe('success')
    expect(getWaterToiletOutcome('full', 'notpeepee')).toBe('failure')
  })
})
