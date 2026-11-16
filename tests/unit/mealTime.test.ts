import { expect, it } from 'vitest'
import { getMealChoreTitle, getMealPeriod } from '../../src/lib/mealTime'

it.each([
  ['2026-11-16T00:00:00Z', 'breakfast'],
  ['2026-11-16T09:59:59Z', 'breakfast'],
  ['2026-11-16T10:00:00Z', 'lunch'],
  ['2026-11-16T15:59:59Z', 'lunch'],
  ['2026-11-16T16:00:00Z', 'dinner'],
  ['2026-11-16T23:59:59Z', 'dinner'],
])('selects the meal at %s', (time, meal) => {
  expect(getMealPeriod(new Date(time), 'UTC')).toBe(meal)
})

it('uses the child time zone, including daylight saving time', () => {
  expect(
    getMealPeriod(new Date('2026-11-16T09:00:00Z'), 'Europe/Amsterdam')
  ).toBe('lunch')
  expect(
    getMealPeriod(new Date('2026-07-16T08:00:00Z'), 'Europe/Amsterdam')
  ).toBe('lunch')
  expect(
    getMealPeriod(new Date('2026-11-16T23:00:00Z'), 'Europe/Amsterdam')
  ).toBe('breakfast')
})

it('updates only eating titles and supports callers without meal context', () => {
  const chore = { taskType: 'eating', title: 'Dinner' }
  expect(getMealChoreTitle(chore, 'breakfast')).toBe('Breakfast')
  expect(getMealChoreTitle(chore)).toBe('Dinner')
  expect(
    getMealChoreTitle({ taskType: 'standard', title: 'Tidy up' }, 'lunch')
  ).toBe('Tidy up')
})
