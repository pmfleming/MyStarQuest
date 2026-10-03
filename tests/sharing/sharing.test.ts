import { readFileSync } from 'node:fs'
import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from 'vitest'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  initializeApp,
  deleteApp,
} from '../../functions/node_modules/firebase-admin/lib/esm/app/index.js'
import { getFirestore } from '../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js'
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { SharingService, accessKey } from '../../functions/src/sharing/service'
import {
  sharedDateKey,
  type SharedOperation,
} from '../../functions/src/sharing/protocol'

const projectId = 'demo-mystarquest-sharing'
const app = initializeApp({ projectId })
const db = getFirestore(app)
let env: RulesTestEnvironment
let now = Date.now()
const admin = {
  uid: 'owner',
  email: 'admin@example.com',
  emailVerified: true,
  provider: 'google.com',
}
const parent = {
  uid: 'parent',
  email: 'parent@example.com',
  emailVerified: true,
  provider: 'google.com',
}
const other = {
  uid: 'other',
  email: 'other@example.com',
  emailVerified: true,
  provider: 'google.com',
}
const service = new SharingService(db, () => now)
const scope = {
  actorUid: parent.uid,
  ownerUid: admin.uid,
  childId: 'child',
  membershipVersion: 1,
}
const childRef = db.doc('users/owner/children/child')
let seq = 0
function op(action: SharedOperation['action']): SharedOperation {
  return {
    id: crypto.randomUUID(),
    deviceId: crypto.randomUUID(),
    sequence: ++seq,
    occurredAt: now,
    action,
  }
}
function completion(id = 'chore', patch: Record<string, unknown> = {}) {
  return op({
    kind: 'activity',
    collection: 'chores',
    entityId: id,
    childId: 'child',
    dateKey: sharedDateKey(now),
    patch,
    delta: 999,
    complete: true,
    reset: false,
    consume: false,
    generation: 0,
    revision: 0,
  })
}
async function invite(address = parent.email) {
  const result = await service.invite(
    admin,
    'owner',
    'child',
    address,
    crypto.randomUUID(),
    'https://example.com'
  )
  const invitation = (
    await db.doc(`childInvitations/${result.invitationId}`).get()
  ).data()!
  const job = (await db.doc(`mailOutbox/${invitation.jobId}`).get()).data()!
  return { id: result.invitationId, token: new URL(job.link).hash.slice(1) }
}
async function accept() {
  const link = await invite()
  await service.accept(parent, link.id, link.token)
  return link
}
beforeAll(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error('Run with the isolated Firestore emulator.')
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})
beforeEach(async () => {
  await env.clearFirestore()
  now = Date.now()
  await childRef.set({
    displayName: 'Test child',
    themeId: 'princess',
    totalStars: 10,
    sharedDataVersion: 1,
    sharedAt: now - 1000,
    timeZone: 'Europe/London',
  })
  await db
    .doc('users/owner/children/sibling')
    .set({ displayName: 'Sibling', totalStars: 100 })
  await db.doc('users/owner/chores/chore').set({
    childId: 'child',
    taskType: 'standard',
    title: 'Tidy',
    starValue: 3,
    isRepeating: true,
  })
  await db.doc('users/owner/chores/sibling-chore').set({
    childId: 'sibling',
    taskType: 'standard',
    title: 'Private',
    starValue: 10,
  })
  await childRef
    .collection('rewards')
    .doc('reward')
    .set({ title: 'Reward', costStars: 8, isRepeating: false })
})
afterAll(async () => {
  await env?.cleanup()
  await deleteApp(app)
})

describe('invitations and membership', () => {
  it('accepts multiple parents; protects the email, provider, token, and admin controls', async () => {
    const link = await invite()
    await expect(
      service.accept(other, link.id, link.token)
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(
      service.accept({ ...parent, provider: 'password' }, link.id, link.token)
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(
      service.accept({ ...parent, emailVerified: false }, link.id, link.token)
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(
      service.accept(parent, link.id, 'x'.repeat(43))
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await Promise.all([
      service.accept(parent, link.id, link.token),
      service.accept(parent, link.id, link.token),
    ])
    const second = await invite(other.email)
    await service.accept(other, second.id, second.token)
    expect(
      (await service.list(admin, 'owner', 'child')).parents.filter(
        (p) => p.status === 'active'
      )
    ).toHaveLength(2)
    for (const action of [
      () => service.list(parent, 'owner', 'child'),
      () => service.prepare(parent, 'owner', 'child'),
      () => service.deleteChild(parent, 'owner', 'child'),
      () => service.revoke(parent, 'owner', 'child', { parentUid: other.uid }),
    ])
      await expect(action()).rejects.toMatchObject({
        code: 'permission-denied',
      })
  })
  it('expires, cancels, resends and invalidates previous links', async () => {
    const first = await invite()
    now += 8 * 86400000
    await expect(
      service.accept(parent, first.id, first.token)
    ).rejects.toMatchObject({ code: 'failed-precondition' })
    await service.invite(
      admin,
      'owner',
      'child',
      parent.email,
      crypto.randomUUID(),
      'https://example.com',
      first.id
    )
    await expect(
      service.accept(parent, first.id, first.token)
    ).rejects.toMatchObject({ code: 'permission-denied' })
    const inviteDoc = (
      await db.doc(`childInvitations/${first.id}`).get()
    ).data()!
    const token = new URL(
      (await db.doc(`mailOutbox/${inviteDoc.jobId}`).get()).data()!.link
    ).hash.slice(1)
    await service.revoke(admin, 'owner', 'child', { inviteId: first.id })
    await expect(service.accept(parent, first.id, token)).rejects.toMatchObject(
      { code: 'failed-precondition' }
    )
  })
  it('revocation blocks old receipts and queued changes after reinvitation', async () => {
    const link = await accept()
    const operation = completion()
    await service.apply(parent, scope, operation)
    await service.revoke(admin, 'owner', 'child', { parentUid: parent.uid })
    expect(
      (
        await db
          .doc(`users/parent/childAccess/${accessKey('owner', 'child')}`)
          .get()
      ).exists
    ).toBe(false)
    await expect(service.apply(parent, scope, operation)).rejects.toMatchObject(
      { code: 'permission-denied' }
    )
    await expect(
      service.accept(parent, link.id, link.token)
    ).rejects.toMatchObject({ code: 'failed-precondition' })
    now += 61000
    const newLink = await invite()
    await service.accept(parent, newLink.id, newLink.token)
    await expect(
      service.apply(parent, scope, completion())
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})
describe('canonical operations', () => {
  it('awards one completion across parents and retries, using the stored star value', async () => {
    await accept()
    const one = completion(),
      two = completion()
    const result = await Promise.all([
      service.apply(parent, scope, one),
      service.apply(
        admin,
        { ...scope, actorUid: 'owner', membershipVersion: 0 },
        two
      ),
    ])
    expect(result.reduce((n, r) => n + (r.appliedDelta ?? 0), 0)).toBe(3)
    await service.apply(parent, scope, one)
    expect((await childRef.get()).data()?.totalStars).toBe(13)
    expect((await childRef.collection('starEvents').get()).size).toBe(1)
  })
  it('serializes competing rewards and rejects an insufficient balance', async () => {
    await accept()
    await childRef
      .collection('rewards')
      .doc('second')
      .set({ title: 'Second', costStars: 8, isRepeating: false })
    const redeem = (id: string) =>
      op({
        kind: 'redeem',
        entityId: id,
        childId: 'child',
        title: 'forged',
        cost: 0,
        consume: false,
      })
    const result = await Promise.allSettled([
      service.apply(parent, scope, redeem('reward')),
      service.apply(parent, scope, redeem('second')),
    ])
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect((await childRef.get()).data()?.totalStars).toBe(2)
    expect((await childRef.collection('redemptions').get()).size).toBe(1)
  })
  it('blocks resets and child changes for secondary parents and rejects stale generations', async () => {
    await accept()
    await service.apply(parent, scope, completion())
    const reset = completion()
    if (reset.action.kind === 'activity')
      Object.assign(reset.action, { reset: true, complete: false })
    await expect(service.apply(parent, scope, reset)).rejects.toMatchObject({
      code: 'permission-denied',
    })
    await expect(
      service.apply(
        parent,
        scope,
        op({
          kind: 'document',
          collection: 'children',
          entityId: 'child',
          mode: 'patch',
          data: { totalStars: 999 },
        })
      )
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await service.apply(
      admin,
      { ...scope, actorUid: 'owner', membershipVersion: 0 },
      reset
    )
    await expect(
      service.apply(parent, scope, completion())
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })
  it('allows activity management but blocks sibling writes and progress field forgery', async () => {
    await accept()
    const create = op({
      kind: 'document',
      collection: 'tests',
      entityId: 'new-test',
      mode: 'put',
      data: {
        childId: 'child',
        taskType: 'math',
        testType: 'math',
        title: 'Math',
        starValue: 4,
        isRepeating: true,
      },
    })
    await service.apply(parent, scope, create)
    await service.apply(
      parent,
      scope,
      op({
        kind: 'document',
        collection: 'tests',
        entityId: 'new-test',
        mode: 'patch',
        data: { starValue: 5 },
      })
    )
    await expect(
      service.apply(parent, scope, completion('sibling-chore'))
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(
      service.apply(
        parent,
        scope,
        op({
          kind: 'document',
          collection: 'chores',
          entityId: 'chore',
          mode: 'patch',
          data: { manageCompletedAt: null },
        })
      )
    ).rejects.toMatchObject({ code: 'invalid-argument' })
    await service.apply(
      parent,
      scope,
      op({
        kind: 'document',
        collection: 'tests',
        entityId: 'new-test',
        mode: 'delete',
        data: {},
      })
    )
    await expect(
      service.apply(parent, scope, { ...create, id: crypto.randomUUID() })
    ).rejects.toMatchObject({ code: 'failed-precondition' })
  })
  it('rejects stale in-progress updates and shares failed tests without awarding stars', async () => {
    await accept()
    await db.doc('users/owner/tests/math').set({
      childId: 'child',
      taskType: 'math',
      title: 'Math',
      starValue: 3,
      isRepeating: true,
    })
    const attempt = op({
      kind: 'activity',
      collection: 'tests',
      entityId: 'math',
      childId: 'child',
      dateKey: sharedDateKey(now),
      patch: {
        lastAttemptedAt: now,
        lastAttemptOutcome: 'failure',
        lastAttemptDateKey: sharedDateKey(now),
      },
      delta: 0,
      complete: false,
      reset: false,
      consume: false,
      generation: 0,
      revision: 0,
    })
    await service.apply(parent, scope, attempt)
    const result = await service.apply(parent, scope, {
      ...attempt,
      id: crypto.randomUUID(),
      action: {
        ...attempt.action,
        complete: true,
      } as SharedOperation['action'],
    })
    expect(result.appliedDelta).toBe(0)
    expect(result.progress?.complete).toBe(true)
  })
})
describe('security rules', () => {
  it('limits queries and reads to the invited child; all shared writes use callables', async () => {
    await accept()
    const client = env.authenticatedContext('parent').firestore()
    await assertSucceeds(getDoc(doc(client, 'users/owner/children/child')))
    await assertSucceeds(
      getDocs(
        query(
          collection(client, 'users/owner/chores'),
          where('childId', '==', 'child')
        )
      )
    )
    await assertSucceeds(
      getDocs(collection(client, 'users/owner/children/child/rewards'))
    )
    for (const path of [
      'users/owner',
      'users/owner/children/sibling',
      'users/owner/chores/sibling-chore',
      'users/owner/rewards/private',
      'childInvitations/secret',
      'mailOutbox/secret',
    ])
      await assertFails(getDoc(doc(client, path)))
    await assertFails(getDocs(collection(client, 'users/owner/children')))
    await assertFails(getDocs(collection(client, 'users/owner/chores')))
    await assertFails(
      getDocs(collection(client, 'users/owner/children/child/parents'))
    )
    for (const path of [
      'users/owner/children/child',
      'users/owner/chores/chore',
      'users/owner/children/child/rewards/reward',
      'users/parent/childAccess/forged',
    ])
      await assertFails(setDoc(doc(client, path), { totalStars: 999 }))
    await service.revoke(admin, 'owner', 'child', { parentUid: 'parent' })
    await assertFails(getDoc(doc(client, 'users/owner/children/child')))
  })
  it('preserves legacy owner creation and disallows forging migration markers', async () => {
    const client = env.authenticatedContext('owner').firestore()
    await assertSucceeds(getDoc(doc(client, 'users/owner/children/new-child')))
    const batch = writeBatch(client)
    batch.set(doc(client, 'users/owner/children/new-child'), {
      displayName: 'New',
    })
    batch.set(doc(client, 'users/owner/syncReceipts/new'), {
      result: { collection: 'children', entityId: 'new-child' },
    })
    await assertSucceeds(batch.commit())
    await assertSucceeds(
      updateDoc(doc(client, 'users/owner/children/sibling'), { totalStars: 12 })
    )
    await assertFails(
      updateDoc(doc(client, 'users/owner/children/sibling'), {
        sharedDataVersion: 1,
      })
    )
    await assertFails(
      updateDoc(doc(client, 'users/owner/children/child'), { totalStars: 999 })
    )
  })
})
describe('migration', () => {
  it('dry runs then preserves balance, copies rewards, imports completion and is idempotent', async () => {
    await childRef.set({ displayName: 'Legacy', totalStars: 25 })
    await db
      .doc('users/owner/rewards/legacy')
      .set({ title: 'Legacy reward', costStars: 4, isRepeating: true })
    await db.doc('users/owner/chores/chore').update({ manageCompletedAt: now })
    const report = await service.prepare(admin, 'owner', 'child', true)
    expect(report.ready).toBe(false)
    expect((await childRef.get()).data()?.sharedDataVersion).toBeUndefined()
    await service.prepare(admin, 'owner', 'child')
    expect((await childRef.get()).data()?.totalStars).toBe(25)
    expect(
      (await childRef.collection('rewards').doc('legacy').get()).exists
    ).toBe(true)
    await accept()
    expect(
      (await service.apply(parent, scope, completion())).appliedDelta
    ).toBe(0)
    expect(await service.prepare(admin, 'owner', 'child')).toMatchObject({
      alreadyPrepared: true,
    })
  })
})

describe('email outbox', () => {
  it('retries with a stable delivery key, hides tokens after sending and skips cancelled invites', async () => {
    const { deliverParentInvitation } =
      await import('../../functions/src/sharing/index')
    const link = await invite()
    const jobId = (await db.doc(`childInvitations/${link.id}`).get()).data()!
      .jobId
    const job = db.doc(`mailOutbox/${jobId}`)
    const event = {
      data: await job.get(),
      params: { messageId: jobId },
    } as Parameters<typeof deliverParentInvitation.run>[0]
    const send = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'fake-provider-id' }),
      })
    vi.stubEnv('INVITATION_EMAIL_API_KEY', 'emulator-only')
    vi.stubEnv('INVITATION_EMAIL_FROM', 'Test <test@example.com>')
    vi.stubGlobal('fetch', send)
    try {
      await expect(deliverParentInvitation.run(event)).rejects.toThrow(
        'temporarily unavailable'
      )
      await deliverParentInvitation.run(event)
      await deliverParentInvitation.run(event)
      expect(send).toHaveBeenCalledTimes(2)
      expect(send.mock.calls[0][1].headers['Idempotency-Key']).toBe(
        send.mock.calls[1][1].headers['Idempotency-Key']
      )
      expect((await job.get()).data()).toMatchObject({
        state: 'sent',
        attempts: 2,
      })
      expect((await job.get()).data()?.link).toBeUndefined()
      const cancelled = await invite(other.email)
      const cancelledId = (
        await db.doc(`childInvitations/${cancelled.id}`).get()
      ).data()!.jobId
      await service.revoke(admin, 'owner', 'child', { inviteId: cancelled.id })
      await deliverParentInvitation.run({
        data: await db.doc(`mailOutbox/${cancelledId}`).get(),
        params: { messageId: cancelledId },
      } as Parameters<typeof deliverParentInvitation.run>[0])
      expect(send).toHaveBeenCalledTimes(2)
    } finally {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
    }
  })
})

it('prevents one-time activities being awarded on a later day and preserves timestamp receipts', async () => {
  await accept()
  await db
    .doc('users/owner/chores/chore')
    .update({ isRepeating: false, createdAt: new Date(now) })
  const changed = await service.apply(
    parent,
    scope,
    op({
      kind: 'document',
      collection: 'chores',
      entityId: 'chore',
      mode: 'patch',
      data: { title: 'Updated' },
    })
  )
  expect(typeof changed.document?.createdAt).toBe('number')
  await service.apply(parent, scope, completion())
  now += 86400000
  await expect(
    service.apply(parent, scope, completion())
  ).rejects.toMatchObject({ code: 'failed-precondition' })
  expect((await childRef.get()).data()?.totalStars).toBe(13)
})
