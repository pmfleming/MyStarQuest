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
  it('calculates complete, failed, and neutral water/toilet scores', () => {
    expect(calculateWaterToiletStars('empty', 'didpeepee')).toBe(2)
    expect(calculateWaterToiletStars('full', 'notpeepee')).toBe(-6)
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
  it('cycles state and derives success or failure', () => {
    expect(getNextWaterLevel('full')).toBe('twothirds')
    expect(getNextWaterLevel('twothirds')).toBe('onethird')
    expect(getNextWaterLevel('onethird')).toBe('empty')
    expect(getNextWaterLevel('empty')).toBe('full')
    expect(getNextToiletStatus('notpeepee')).toBe('didpeepee')
    expect(getNextToiletStatus('didpeepee')).toBe('notpeepee')
    expect(getWaterToiletOutcome('empty', 'didpeepee')).toBe('success')
    expect(getWaterToiletOutcome('full', 'notpeepee')).toBe('failure')
  })
})
