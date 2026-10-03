import { TEST_TEMPLATES } from './defaultTests'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  FieldValue,
  type Firestore,
  type Transaction,
  type DocumentData,
} from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'
import {
  activityPatch,
  awardFor,
  completedFields,
  deny,
  documentPatch,
  email,
  fail,
  id,
  parseOperation,
} from './policy'
import {
  progressKey,
  sharedDateKey,
  type ChildScope,
  type SharedReceipt,
} from './protocol'

export type Caller = {
  uid: string
  email?: string
  emailVerified?: boolean
  provider?: string
}
export const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex')
export const childPath = (owner: string, child: string) =>
  `users/${id(owner)}/children/${id(child)}`
export const accessKey = (owner: string, child: string) =>
  hash(`${owner}/${child}`)
const millis = (value: unknown) =>
  typeof value === 'number'
    ? value
    : value && typeof value === 'object' && 'toMillis' in value
      ? (value as { toMillis: () => number }).toMillis()
      : 0
const secretMatches = (secret: string, expected: string) => {
  const actual = hash(secret)
  return (
    actual.length === expected.length &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
}
const safeInvitation = (key: string, data: DocumentData, now: number) => ({
  id: key,
  email: data.normalizedEmail,
  state:
    data.state === 'pending' && data.expiresAt <= now ? 'expired' : data.state,
  deliveryState: data.deliveryState,
  expiresAt: data.expiresAt,
})

function wireValue(value: unknown): unknown {
  if (value && typeof value === 'object' && 'toMillis' in value)
    return millis(value)
  if (Array.isArray(value)) return value.map(wireValue)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, wireValue(item)])
    )
  return value
}

export class SharingService {
  constructor(
    readonly db: Firestore,
    readonly now: () => number = Date.now
  ) {}

  private async authorized(
    tx: Transaction,
    caller: Caller,
    ownerUid: string,
    childId: string,
    adminOnly = false,
    version?: number
  ) {
    const ref = this.db.doc(childPath(ownerUid, childId))
    const child = await tx.get(ref)
    if (!child.exists) deny('This child is no longer available.')
    const admin = caller.uid === ownerUid
    if (adminOnly && !admin) deny('Only the admin parent can do this.')
    if (!admin) {
      const membership = await tx.get(ref.collection('parents').doc(caller.uid))
      const data = membership.data()
      if (
        data?.status !== 'active' ||
        (version !== undefined && version !== data.membershipVersion)
      )
        deny()
    }
    return { ref, child: child.data()!, admin }
  }

  async list(caller: Caller, ownerUid: string, childId: string) {
    return this.db.runTransaction(async (tx) => {
      const { ref } = await this.authorized(tx, caller, ownerUid, childId, true)
      const parents = await tx.get(ref.collection('parents'))
      const invitations = await tx.get(
        this.db
          .collection('childInvitations')
          .where('ownerUid', '==', ownerUid)
          .where('childId', '==', childId)
      )
      return {
        parents: parents.docs.map((doc) => ({
          uid: doc.id,
          email: doc.data().invitedEmail,
          status: doc.data().status,
        })),
        invitations: invitations.docs.map((doc) =>
          safeInvitation(doc.id, doc.data(), this.now())
        ),
      }
    })
  }

  // This callable is also the resumable migration used before the first invite.
  async prepare(
    caller: Caller,
    ownerUid: string,
    childId: string,
    dryRun = false
  ) {
    const ref = this.db.doc(childPath(ownerUid, childId))
    const root = this.db.doc(`users/${ownerUid}`)
    const initial = await this.db.runTransaction(async (tx) => {
      const { child } = await this.authorized(
        tx,
        caller,
        ownerUid,
        childId,
        true
      )
      const owner = await tx.get(root)
      if (
        owner.data()?.sharingMigrationChild &&
        owner.data()?.sharingMigrationChild !== childId
      )
        throw new HttpsError(
          'failed-precondition',
          'Finish the other child migration first.'
        )
      if (!dryRun && child.sharedDataVersion !== 1) {
        if (Number(child.sharingMigrationLeaseUntil ?? 0) > this.now())
          throw new HttpsError(
            'aborted',
            'Shared progress is being prepared. Try again in a few minutes.'
          )
        tx.set(root, { sharingMigrationChild: childId }, { merge: true })
        tx.update(ref, {
          sharingMigration: 'preparing',
          sharingMigrationLeaseUntil: this.now() + 180_000,
        })
      }
      return child
    })
    if (initial.sharedDataVersion === 1)
      return { ready: true, alreadyPrepared: true }
    const [rewards, chores, tests, deviceStates, redemptions] =
      await Promise.all([
        this.db.collection(`users/${ownerUid}/rewards`).get(),
        this.db
          .collection(`users/${ownerUid}/chores`)
          .where('childId', '==', childId)
          .get(),
        this.db
          .collection(`users/${ownerUid}/tests`)
          .where('childId', '==', childId)
          .get(),
        this.db
          .collection(`users/${ownerUid}/deviceActivities`)
          .where('childId', '==', childId)
          .get(),
        this.db
          .collection(`users/${ownerUid}/redemptions`)
          .where('childId', '==', childId)
          .get(),
      ])
    const report = {
      ready: !dryRun,
      rewards: rewards.size,
      chores: chores.size,
      tests: tests.size,
      deviceStates: deviceStates.size,
    }
    if (dryRun) return report
    const used = new Set(redemptions.docs.map((doc) => doc.data().rewardId))
    const today = sharedDateKey(
      this.now(),
      String(initial.timeZone ?? 'Europe/London')
    )
    const states = new Map<string, DocumentData>()
    for (const [collection, snapshot] of [
      ['chores', chores],
      ['tests', tests],
    ] as const) {
      for (const task of snapshot.docs) {
        const data = task.data()
        const field = completedFields[String(data.taskType ?? 'standard')]
        const completeAt = data[field] ?? data.lastAttemptedAt
        if (
          typeof completeAt === 'number' &&
          sharedDateKey(
            completeAt,
            String(initial.timeZone ?? 'Europe/London')
          ) === today
        ) {
          states.set(progressKey(collection, task.id, today), {
            collection,
            entityId: task.id,
            childId,
            dateKey: today,
            complete: true,
            generation: 0,
            revision: 1,
            patch: Object.fromEntries(
              Object.entries(data).filter(
                ([key]) =>
                  key.startsWith('manage') || key.startsWith('lastAttempt')
              )
            ),
            imported: true,
          })
        }
      }
    }
    for (const doc of deviceStates.docs) {
      const data = doc.data()
      if (
        !['chores', 'tests'].includes(data.collection) ||
        typeof data.taskId !== 'string' ||
        typeof data.dateKey !== 'string'
      )
        continue
      const importedPatch = data.patch ?? {}
      const terminal =
        data.complete === true ||
        Object.entries(importedPatch).some(
          ([field, value]) =>
            (field.endsWith('CompletedAt') && typeof value === 'number') ||
            (field.endsWith('Outcome') && value === 'failure')
        )
      const key = progressKey(data.collection, data.taskId, data.dateKey)
      const previous = states.get(key)
      // Never re-award imported completion, and never replace it with an unfinished device.
      if (!previous?.complete || terminal)
        states.set(key, {
          collection: data.collection,
          entityId: data.taskId,
          childId,
          dateKey: data.dateKey,
          complete: Boolean(previous?.complete || terminal),
          generation: 0,
          revision: 1,
          patch: { ...(previous?.patch ?? {}), ...(data.patch ?? {}) },
          consumed: Boolean(previous?.consumed || data.consumed),
          imported: true,
        })
    }
    const writes: [string, DocumentData][] = rewards.docs
      .filter((doc) => doc.data().isRepeating === true || !used.has(doc.id))
      .map((doc) => [
        `${ref.path}/rewards/${doc.id}`,
        { ...doc.data(), childId, migratedFrom: doc.ref.path },
      ])
    for (const [type, template] of Object.entries(TEST_TEMPLATES)) {
      if (tests.docs.some((doc) => doc.data().taskType === type)) continue
      const path = `users/${ownerUid}/tests/default-${type}-${childId}`
      if ((await this.db.doc(path).get()).exists)
        throw new HttpsError(
          'failed-precondition',
          'A default test identifier is already in use. Resolve it before resuming migration.'
        )
      writes.push([
        path,
        {
          ...template,
          childId,
          category: type,
          testType: type,
          isRepeating: true,
          schoolDayEnabled: true,
          nonSchoolDayEnabled: true,
          createdAt: this.now(),
        },
      ])
    }
    for (const [key, value] of states) {
      writes.push([`${ref.path}/activityProgress/${key}`, value])
      if (value.consumed)
        writes.push([
          `${ref.path}/activityConsumptions/${hash(`${value.collection}/${value.entityId}`)}`,
          { dateKey: value.dateKey, completedAt: this.now(), imported: true },
        ])
    }
    for (let offset = 0; offset < writes.length; offset += 400) {
      const batch = this.db.batch()
      for (const [path, data] of writes.slice(offset, offset + 400))
        batch.set(this.db.doc(path), data)
      await batch.commit()
    }
    await this.db.runTransaction(async (tx) => {
      await this.authorized(tx, caller, ownerUid, childId, true)
      tx.update(ref, {
        sharedDataVersion: 1,
        sharingMigration: 'ready',
        sharingMigrationLeaseUntil: FieldValue.delete(),
        sharedAt: this.now(),
        timeZone: initial.timeZone ?? 'Europe/London',
      })
      tx.set(
        root,
        { sharingMigrationChild: FieldValue.delete() },
        { merge: true }
      )
    })
    return report
  }

  async invite(
    caller: Caller,
    ownerUid: string,
    childId: string,
    address: string,
    requestId: string,
    appUrl: string,
    resendId?: string
  ) {
    const recipient = email(address)
    if (caller.email && recipient === email(caller.email))
      fail('You are already the admin parent.')
    const inviteId = resendId
      ? id(resendId)
      : hash(`${ownerUid}/${childId}/${recipient}`)
    const invitation = this.db.collection('childInvitations').doc(inviteId)
    const jobId = hash(`${caller.uid}/${id(requestId)}`)
    const job = this.db.collection('mailOutbox').doc(jobId)
    const token = randomBytes(32).toString('base64url')
    const time = this.now()
    const link = `${new URL(appUrl).origin}/invite/${inviteId}#${token}`
    return this.db.runTransaction(async (tx) => {
      const { child } = await this.authorized(
        tx,
        caller,
        ownerUid,
        childId,
        true
      )
      if (child.sharedDataVersion !== 1)
        throw new HttpsError(
          'failed-precondition',
          'Enable shared progress for this child first.'
        )
      const [oldInvite, oldJob, parents, rate] = await Promise.all([
        tx.get(invitation),
        tx.get(job),
        tx.get(
          this.db
            .collection(`${childPath(ownerUid, childId)}/parents`)
            .where('invitedEmail', '==', recipient)
        ),
        tx.get(this.db.doc(`invitationRates/${caller.uid}`)),
      ])
      if (oldJob.exists) {
        if (oldJob.data()?.invitationId !== inviteId)
          fail('This send request was already used.')
        return { invitationId: inviteId }
      }
      if (parents.docs.some((doc) => doc.data().status === 'active'))
        throw new HttpsError(
          'already-exists',
          'This parent already has access.'
        )
      const old = oldInvite.data()
      if (
        resendId &&
        (!old ||
          old.ownerUid !== ownerUid ||
          old.childId !== childId ||
          old.normalizedEmail !== recipient)
      )
        deny()
      if (!resendId && old?.state === 'pending' && old.expiresAt > time)
        throw new HttpsError(
          'already-exists',
          'An invitation is already pending. Use Resend instead.'
        )
      if (old?.lastSentAt && time - old.lastSentAt < 60_000)
        throw new HttpsError(
          'resource-exhausted',
          'Please wait a minute before resending.'
        )
      const rateData = rate.data()
      const hour = Math.floor(time / 3_600_000)
      const count = rateData?.hour === hour ? Number(rateData.count) : 0
      if (count >= 20)
        throw new HttpsError(
          'resource-exhausted',
          'Invitation limit reached. Try again later.'
        )
      tx.set(rate.ref, { hour, count: count + 1 })
      tx.set(invitation, {
        ownerUid,
        childId,
        normalizedEmail: recipient,
        tokenHash: hash(token),
        expiresAt: time + 7 * 86400_000,
        invitedByUid: caller.uid,
        state: 'pending',
        deliveryState: 'queued',
        lastSentAt: time,
        jobId,
        acceptedByUid: null,
      })
      tx.create(job, {
        invitationId: inviteId,
        recipient,
        inviter: caller.email ?? 'A parent',
        childName: String(child.displayName || 'their child'),
        link,
        createdAt: time,
        state: 'queued',
        attempts: 0,
      })
      return { invitationId: inviteId }
    })
  }

  async accept(caller: Caller, inviteId: string, token: string) {
    if (
      !caller.emailVerified ||
      caller.provider !== 'google.com' ||
      !caller.email
    )
      deny('Sign in with the invited Google account.')
    const address = email(caller.email)
    if (typeof token !== 'string' || token.length < 30 || token.length > 150)
      fail('Invalid invitation link.')
    return this.db.runTransaction(async (tx) => {
      const invitation = await tx.get(
        this.db.doc(`childInvitations/${id(inviteId)}`)
      )
      const data = invitation.data()
      if (
        !data ||
        data.normalizedEmail !== address ||
        !secretMatches(token, String(data.tokenHash))
      )
        deny('This invitation is not available for this Google account.')
      const childRef = this.db.doc(childPath(data.ownerUid, data.childId))
      const [child, membership] = await Promise.all([
        tx.get(childRef),
        tx.get(childRef.collection('parents').doc(caller.uid)),
      ])
      if (!child.exists || child.data()?.sharedDataVersion !== 1)
        deny('This child is no longer available.')
      if (
        data.state === 'accepted' &&
        data.acceptedByUid === caller.uid &&
        membership.data()?.status === 'active'
      )
        return {
          ownerUid: data.ownerUid,
          childId: data.childId,
          themeId: child.data()?.themeId ?? 'princess',
        }
      if (data.state !== 'pending' || data.expiresAt <= this.now())
        throw new HttpsError(
          'failed-precondition',
          'This invitation has expired or was cancelled. Ask the admin for a new invitation.'
        )
      const version = Number(membership.data()?.membershipVersion ?? 0) + 1
      tx.set(membership.ref, {
        role: 'secondary',
        status: 'active',
        invitedEmail: address,
        invitedByUid: data.ownerUid,
        acceptedAt: this.now(),
        membershipVersion: version,
      })
      tx.set(
        this.db.doc(
          `users/${caller.uid}/childAccess/${accessKey(data.ownerUid, data.childId)}`
        ),
        {
          ownerUid: data.ownerUid,
          childId: data.childId,
          role: 'secondary',
          status: 'active',
          membershipVersion: version,
        }
      )
      tx.update(invitation.ref, {
        state: 'accepted',
        acceptedByUid: caller.uid,
        acceptedAt: this.now(),
      })
      return {
        ownerUid: data.ownerUid,
        childId: data.childId,
        themeId: child.data()?.themeId ?? 'princess',
      }
    })
  }

  async revoke(
    caller: Caller,
    ownerUid: string,
    childId: string,
    target: { inviteId?: string; parentUid?: string }
  ) {
    await this.db.runTransaction(async (tx) => {
      const { ref } = await this.authorized(tx, caller, ownerUid, childId, true)
      if (target.inviteId) {
        const invitation = await tx.get(
          this.db.doc(`childInvitations/${id(target.inviteId)}`)
        )
        if (
          invitation.data()?.ownerUid !== ownerUid ||
          invitation.data()?.childId !== childId
        )
          deny()
        if (invitation.data()?.state === 'accepted')
          fail('Remove the parent’s access instead.')
        tx.update(invitation.ref, { state: 'revoked', revokedAt: this.now() })
      } else {
        const uid = id(target.parentUid)
        if (uid === ownerUid) deny('The admin cannot be removed.')
        const membership = await tx.get(ref.collection('parents').doc(uid))
        if (!membership.exists) return
        tx.update(membership.ref, {
          status: 'revoked',
          revokedAt: this.now(),
          membershipVersion:
            Number(membership.data()?.membershipVersion ?? 0) + 1,
        })
        tx.delete(
          this.db.doc(
            `users/${uid}/childAccess/${accessKey(ownerUid, childId)}`
          )
        )
      }
    })
    return { ok: true }
  }

  async apply(
    caller: Caller,
    scope: ChildScope,
    input: unknown
  ): Promise<SharedReceipt> {
    const operation = parseOperation(input)
    if (scope.actorUid !== caller.uid) deny()
    const ownerUid = id(scope.ownerUid),
      childId = id(scope.childId)
    const action = operation.action
    if (action.kind !== 'document' && action.childId !== childId) deny()
    const time = this.now()
    return this.db.runTransaction(async (tx) => {
      const { ref, child, admin } = await this.authorized(
        tx,
        caller,
        ownerUid,
        childId,
        false,
        scope.membershipVersion
      )
      if (child.sharedDataVersion !== 1)
        throw new HttpsError(
          'failed-precondition',
          'This child is not ready for sharing.'
        )
      const receiptRef = ref
        .collection('operationReceipts')
        .doc(hash(`${caller.uid}/${scope.membershipVersion}/${operation.id}`))
      const receipt = await tx.get(receiptRef)
      if (receipt.exists) return receipt.data()!.result as SharedReceipt
      const root = `users/${ownerUid}`
      const collection =
        action.kind === 'redeem' ? 'rewards' : action.collection
      const path =
        collection === 'children'
          ? ref.path
          : collection === 'rewards'
            ? `${ref.path}/rewards/${action.entityId}`
            : `${root}/${collection}/${action.entityId}`
      if (collection === 'children' && action.entityId !== childId) deny()
      const entityRef = this.db.doc(path)
      const entity =
        collection === 'children' ? child : (await tx.get(entityRef)).data()
      if (
        entity &&
        ['chores', 'tests'].includes(collection) &&
        entity.childId !== childId
      )
        deny()
      let result: SharedReceipt
      if (action.kind === 'document') {
        if (
          action.collection === 'children' &&
          (action.mode !== 'patch' || !admin)
        )
          deny('Only the admin can change child settings.')
        const tombstone = await tx.get(
          ref
            .collection('deletedActivities')
            .doc(hash(`${collection}/${action.entityId}`))
        )
        if (tombstone.exists && action.mode !== 'delete')
          throw new HttpsError(
            'failed-precondition',
            'This activity was deleted. Create a new activity instead.'
          )
        if (action.mode === 'put' && entity)
          throw new HttpsError(
            'already-exists',
            'This activity already exists. Refresh before editing.'
          )
        if (action.mode === 'patch' && !entity)
          throw new HttpsError('not-found', 'This item was deleted.')
        const patch = documentPatch(collection, action.data, childId, admin)
        if (
          entity?.taskType &&
          patch.taskType &&
          patch.taskType !== entity.taskType
        )
          fail('An activity type cannot be changed.')
        const document: DocumentData | null =
          action.mode === 'delete'
            ? null
            : {
                ...entity,
                ...patch,
                ...(action.mode === 'put' ? { createdAt: time, childId } : {}),
                offlineRevision: Number(entity?.offlineRevision ?? 0) + 1,
              }
        if (
          document &&
          ['chores', 'tests'].includes(collection) &&
          (!document.taskType || document.childId !== childId)
        )
          fail('An activity needs a type and a child.')
        if (collection === 'children' && document)
          document.offlineBalanceRevision =
            Number(child.offlineBalanceRevision ?? 0) + 1
        if (document) tx.set(entityRef, document)
        else {
          tx.delete(entityRef)
          tx.set(tombstone.ref, { deletedAt: time, actorUid: caller.uid })
        }
        result = { collection, entityId: action.entityId, document }
      } else {
        if (!entity)
          throw new HttpsError(
            'not-found',
            'This activity or reward no longer exists.'
          )
        const before = Math.max(0, Number(child.totalStars) || 0)
        let delta = 0
        result = {
          collection: 'children',
          entityId: childId,
          document: null,
          starsBefore: before,
        }
        if (action.kind === 'redeem') {
          const cost = Number(entity.costStars)
          if (!Number.isFinite(cost) || cost < 0 || before < cost)
            throw new HttpsError(
              'failed-precondition',
              'Not enough stars for this reward.'
            )
          delta = -cost
          if (entity.isRepeating !== true) {
            tx.delete(entityRef)
            result.removed = {
              collection: 'rewards',
              entityId: action.entityId,
            }
          }
          result.title = String(entity.title)
          tx.set(ref.collection('redemptions').doc(receiptRef.id), {
            rewardId: action.entityId,
            title: entity.title,
            costStars: cost,
            childId,
            actorUid: caller.uid,
            createdAt: time,
          })
        } else {
          const occurred = Number(operation.occurredAt)
          if (
            occurred > time + 300_000 ||
            occurred < Number(child.sharedAt) - 300_000 ||
            occurred < time - 30 * 86400_000 ||
            action.dateKey !==
              sharedDateKey(occurred, String(child.timeZone ?? 'Europe/London'))
          )
            fail('Invalid activity day. Refresh this child.')
          const key = progressKey(collection, action.entityId, action.dateKey)
          const progressRef = ref.collection('activityProgress').doc(key)
          const prior = (await tx.get(progressRef)).data()
          const consumptionRef = ref
            .collection('activityConsumptions')
            .doc(hash(`${collection}/${action.entityId}`))
          const consumption =
            entity.isRepeating !== true
              ? await tx.get(consumptionRef)
              : undefined
          if (
            consumption?.exists &&
            !action.reset &&
            consumption.data()?.dateKey !== action.dateKey
          )
            throw new HttpsError(
              'failed-precondition',
              'This one-time activity was already completed.'
            )
          const generation = Number(prior?.generation ?? 0)
          if (action.generation !== generation)
            throw new HttpsError(
              'failed-precondition',
              'This activity was reset. Your older change was not applied.'
            )
          if (action.reset && !admin) deny('Only the admin can reset progress.')
          const clean = activityPatch(
            action.patch,
            String(entity.taskType),
            time,
            action.dateKey,
            occurred
          )
          const finishedField = completedFields[String(entity.taskType)]
          if (
            !action.reset &&
            (clean[finishedField] === null || clean.lastAttemptedAt === null)
          )
            deny('Use an admin reset to clear saved progress.')
          const alreadyComplete = prior?.complete === true
          if (
            !action.complete &&
            !action.reset &&
            !alreadyComplete &&
            action.revision !== Number(prior?.revision ?? 0)
          )
            throw new HttpsError(
              'failed-precondition',
              'Another parent updated this activity. Refresh before changing it.'
            )
          let patch: Record<string, unknown> = {
            ...(prior?.patch ?? {}),
            ...clean,
          }
          if (action.reset) patch = {}
          else if (alreadyComplete) patch = prior!.patch
          else if (action.complete) {
            delta = awardFor(entity, patch)
            patch[finishedField] = time
            if (collection === 'tests')
              Object.assign(patch, {
                lastAttemptedAt: time,
                lastAttemptDateKey: action.dateKey,
                lastAttemptOutcome: 'success',
              })
          }
          const failure =
            !action.reset &&
            (patch.lastAttemptOutcome === 'failure' ||
              Object.entries(patch).some(
                ([key, value]) =>
                  key.endsWith('LastOutcome') && value === 'failure'
              ))
          const progress = {
            childId,
            collection,
            entityId: action.entityId,
            dateKey: action.dateKey,
            generation: generation + (action.reset ? 1 : 0),
            revision: Number(prior?.revision ?? 0) + 1,
            complete:
              !action.reset &&
              (alreadyComplete ||
                action.complete ||
                failure ||
                typeof patch[finishedField] === 'number'),
            patch,
            consumed:
              !action.reset &&
              (Boolean(prior?.consumed) ||
                (action.complete && entity.isRepeating !== true)),
            actorUid: caller.uid,
            updatedAt: time,
          }
          if (action.reset && consumption?.exists) tx.delete(consumptionRef)
          else if (action.complete && entity.isRepeating !== true)
            tx.set(consumptionRef, {
              dateKey: action.dateKey,
              completedAt: time,
            })
          tx.set(progressRef, progress)
          result.progress = progress
          result.progressKey = key
          if (action.complete && !alreadyComplete)
            tx.set(ref.collection('starEvents').doc(receiptRef.id), {
              childId,
              taskId: action.entityId,
              dateKey: action.dateKey,
              delta: Math.max(-before, delta),
              actorUid: caller.uid,
              createdAt: time,
            })
        }
        const after = Math.max(0, before + delta)
        const document = {
          ...child,
          totalStars: after,
          offlineBalanceRevision: Number(child.offlineBalanceRevision ?? 0) + 1,
          offlineDeviceSequences: {
            ...(child.offlineDeviceSequences ?? {}),
            [operation.deviceId]: operation.sequence,
          },
        }
        tx.set(ref, document)
        result.document = document
        result.appliedDelta = after - before
      }
      result = wireValue(result) as SharedReceipt
      tx.set(receiptRef, {
        actorUid: caller.uid,
        operationId: operation.id,
        createdAt: time,
        result,
      })
      return result
    })
  }

  async deleteChild(caller: Caller, ownerUid: string, childId: string) {
    // Deletion of the parent document denies all subsequent membership reads/writes.
    await this.db.runTransaction(async (tx) => {
      const { ref } = await this.authorized(tx, caller, ownerUid, childId, true)
      tx.delete(ref)
    })
    await this.cleanupChild(ownerUid, childId)
    return { ok: true }
  }

  async cleanupChild(ownerUid: string, childId: string) {
    const parents = await this.db
      .collection(`${childPath(ownerUid, childId)}/parents`)
      .get()
    for (const parent of parents.docs) {
      const batch = this.db.batch()
      batch.delete(
        this.db.doc(
          `users/${parent.id}/childAccess/${accessKey(ownerUid, childId)}`
        )
      )
      batch.update(parent.ref, { status: 'revoked', revokedAt: this.now() })
      await batch.commit()
    }
    const invitations = await this.db
      .collection('childInvitations')
      .where('ownerUid', '==', ownerUid)
      .where('childId', '==', childId)
      .get()
    for (const invitation of invitations.docs)
      await invitation.ref.update({ state: 'revoked', revokedAt: this.now() })
  }
}

export { millis }
