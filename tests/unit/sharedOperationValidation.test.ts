import { expect, it } from 'vitest'
import {
  activityPatch,
  documentPatch,
  parseOperation,
} from '../../functions/src/sharing/policy'

const documentAction = {
  kind: 'document',
  collection: 'children',
  entityId: 'child',
  mode: 'patch',
  data: { totalStars: 999 },
}
const activity = {
  kind: 'activity',
  collection: 'tests',
  entityId: 'test',
  childId: 'child',
  dateKey: '2026-10-29',
  complete: false,
  reset: false,
  consume: false,
  generation: 0,
  revision: 0,
  patch: {},
}
const operation = (action: object) => ({
  id: 'op',
  deviceId: 'device',
  sequence: 1,
  occurredAt: 1,
  action,
})

it.each([
  [documentAction, 'collection', 'children'],
  [documentAction, 'mode', 'patch'],
  [activity, 'collection', 'tests'],
  [activity, 'dateKey', '2026-10-29'],
] as const)(
  'rejects coerced %s action %s before authorization',
  (action, field, value) => {
    expect(parseOperation(operation(action)).action).toEqual(action)
    for (const invalid of [[value], { toString: () => value }]) {
      expect(() =>
        parseOperation(operation({ ...action, [field]: invalid }))
      ).toThrow()
    }
  }
)

it('rejects array task types and water levels at the field boundary', () => {
  for (const key of ['taskType', 'testType', 'choreType'])
    expect(() =>
      documentPatch('chores', { [key]: ['standard'] }, 'child', true)
    ).toThrow()
  expect(() =>
    activityPatch(
      { manageWaterLevel: ['full'] },
      'watertoiletcheck',
      1,
      '2026-10-29'
    )
  ).toThrow()
})
