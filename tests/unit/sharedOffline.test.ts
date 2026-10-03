import { invitationPath } from '../../src/sharing/invitationPath'
import { describe, it, expect } from 'vitest'
import { OfflineStore } from '../../src/offline/store'
import { emptyState } from '../../src/offline/model'
import { deviceDocuments } from '../../src/offline/selectors'
import { childStorageKey, parseChildScope } from '../../src/sharing/scope'
import { progressKey } from '../../functions/src/sharing/protocol'
const key = childStorageKey({
  actorUid: 'parent',
  ownerUid: 'owner',
  childId: 'child',
  membershipVersion: 1,
})
function store() {
  let state = emptyState()
  return new OfflineStore(key, {
    read: async () => structuredClone(state),
    write: async (_, next) => {
      state = structuredClone(next)
    },
  })
}
const day = '2026-10-03'
const activity = {
  kind: 'activity' as const,
  collection: 'chores' as const,
  entityId: 'task',
  childId: 'child',
  dateKey: day,
  patch: { manageCompletedAt: 123 },
  delta: 3,
  complete: true,
  reset: false,
  consume: false,
}
describe('shared offline state', () => {
  it('uses actor, owner, child and membership namespaces', () => {
    expect(parseChildScope(key)).toEqual({
      actorUid: 'parent',
      ownerUid: 'owner',
      childId: 'child',
      membershipVersion: 1,
    })
    expect(key).not.toBe(
      childStorageKey({ ...parseChildScope(key)!, ownerUid: 'different' })
    )
    expect(key).not.toBe(
      childStorageKey({ ...parseChildScope(key)!, membershipVersion: 3 })
    )
  })
  it('shows another parent’s completion, prevents duplicates and stamps reset generations', async () => {
    const db = store()
    await db.mergeCollection('children', { child: { totalStars: 10 } })
    await db.mergeCollection('chores', {
      task: {
        title: 'Tidy',
        childId: 'child',
        taskType: 'standard',
        isRepeating: true,
      },
    })
    const progress = {
      collection: 'chores',
      entityId: 'task',
      dateKey: day,
      generation: 2,
      revision: 5,
      patch: { manageCompletedAt: 100 },
      complete: true,
    }
    await db.mergeProgress({ [progressKey('chores', 'task', day)]: progress })
    expect(
      deviceDocuments(db.getSnapshot()!, 'chores', day).task.manageCompletedAt
    ).toBe(100)
    expect(await db.queue(activity)).toBeNull()
    await db.mergeProgress({
      [progressKey('chores', 'task', day)]: {
        ...progress,
        generation: 3,
        revision: 6,
        patch: {},
        complete: false,
      },
    })
    const queued = await db.queue(activity)
    expect(queued?.action).toMatchObject({ generation: 3, revision: 6 })
    await db.reject(queued!.id, 'Another parent reset this activity.')
    expect(
      deviceDocuments(db.getSnapshot()!, 'chores', day).task.manageCompletedAt
    ).toBeNull()
  })
  it('purges revoked data and rejects future queues and delayed snapshots', async () => {
    const db = store()
    await db.mergeCollection('children', { child: { totalStars: 10 } })
    await db.queue(activity)
    await db.revoke()
    await expect(db.queue(activity)).rejects.toThrow()
    await db.mergeCollection('children', { child: { totalStars: 99 } })
    await db.mergeProgress({
      secret: {
        collection: 'chores',
        entityId: 'task',
        dateKey: day,
        patch: { manageCompletedAt: 123 },
      },
    })
    expect(db.getSnapshot()).toMatchObject({
      revoked: true,
      pending: [],
      documents: { children: {} },
      sharedProgress: {},
    })
  })
})

it('routes only approved Android invitation origins and retains the token fragment', () => {
  const route = '/invite/' + 'a'.repeat(64) + '#' + 't'.repeat(43)
  expect(invitationPath('https://mystarquest-1b6f8.web.app' + route)).toBe(
    route
  )
  expect(invitationPath('https://attacker.example' + route)).toBeNull()
  expect(
    invitationPath('https://mystarquest-1b6f8.web.app/tabs/chores')
  ).toBeNull()
})

it('rejects old device operations at migration without blocking unrelated children', async () => {
  let saved = emptyState()
  const db = new OfflineStore('owner', {
    read: async () => saved,
    write: async (_, next) => {
      saved = next
    },
  })
  await db.mergeCollection('children', {
    child: { totalStars: 10 },
    other: { totalStars: 3 },
  })
  await db.queue(activity)
  await db.queue({ ...activity, childId: 'other', entityId: 'other-task' })
  await db.mergeCollection('children', {
    child: { totalStars: 10, sharedDataVersion: 1 },
    other: { totalStars: 3 },
  })
  expect(db.getSnapshot()?.pending).toHaveLength(1)
  expect(db.getSnapshot()?.pending[0]?.action).toMatchObject({
    childId: 'other',
  })
  expect(db.getSnapshot()?.rejected?.[0]?.message).toContain('shared progress')
})
