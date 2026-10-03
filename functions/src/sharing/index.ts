import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import {
  HttpsError,
  onCall,
  type CallableRequest,
} from 'firebase-functions/v2/https'
import {
  onDocumentCreated,
  onDocumentDeleted,
} from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { SharingService, type Caller } from './service'
import { id, record, fail } from './policy'
import type { ChildScope } from './protocol'

const appUrl = defineString('INVITATION_APP_URL', {
  default: '',
  description: 'Public HTTPS MyStarQuest origin, without a path.',
})
const sender = defineString('INVITATION_EMAIL_FROM', {
  default: '',
  description:
    'Verified Resend sender, e.g. MyStarQuest <parents@example.com>.',
})
const emailKey = defineSecret('INVITATION_EMAIL_API_KEY')
const service = () => new SharingService(getFirestore())
function caller(request: CallableRequest): Caller {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  return {
    uid: request.auth.uid,
    email: request.auth.token.email,
    emailVerified: request.auth.token.email_verified,
    provider: request.auth.token.firebase?.sign_in_provider,
  }
}
function scope(request: CallableRequest) {
  const data = record(request.data)
  return { data, ownerUid: id(data.ownerUid), childId: id(data.childId) }
}
const options = { timeoutSeconds: 120, maxInstances: 10 }
export const prepareChildSharing = onCall(options, async (request) => {
  const { data, ownerUid, childId } = scope(request)
  return service().prepare(
    caller(request),
    ownerUid,
    childId,
    data.dryRun === true
  )
})
export const listChildParents = onCall(options, async (request) => {
  const { ownerUid, childId } = scope(request)
  return service().list(caller(request), ownerUid, childId)
})
function invitationOrigin() {
  try {
    const url = new URL(appUrl.value())
    if (
      url.protocol === 'https:' ||
      (process.env.FUNCTIONS_EMULATOR === 'true' &&
        url.hostname === 'localhost')
    )
      return url.origin
  } catch {
    /* configuration error below */
  }
  throw new HttpsError(
    'failed-precondition',
    'Invitation email is not configured yet.'
  )
}
const sendInvite = (resend: boolean) =>
  onCall(options, async (request) => {
    const { data, ownerUid, childId } = scope(request)
    if (!sender.value())
      throw new HttpsError(
        'failed-precondition',
        'Invitation email is not configured yet.'
      )
    return service().invite(
      caller(request),
      ownerUid,
      childId,
      String(data.email ?? ''),
      id(data.requestId),
      invitationOrigin(),
      resend ? id(data.inviteId) : undefined
    )
  })
export const inviteParent = sendInvite(false)
export const resendParentInvitation = sendInvite(true)
export const acceptParentInvitation = onCall(options, async (request) => {
  const data = record(request.data)
  return service().accept(
    caller(request),
    id(data.inviteId),
    String(data.token ?? '')
  )
})
export const revokeParentInvitation = onCall(options, async (request) => {
  const { data, ownerUid, childId } = scope(request)
  return service().revoke(caller(request), ownerUid, childId, {
    inviteId: id(data.inviteId),
  })
})
export const removeParentAccess = onCall(options, async (request) => {
  const { data, ownerUid, childId } = scope(request)
  return service().revoke(caller(request), ownerUid, childId, {
    parentUid: id(data.parentUid),
  })
})
export const applyChildOperation = onCall(options, async (request) => {
  const data = record(request.data),
    target = record(data.scope)
  if (
    !Number.isSafeInteger(target.membershipVersion) ||
    Number(target.membershipVersion) < 0
  )
    fail('Invalid membership.')
  return service().apply(caller(request), target as ChildScope, data.operation)
})
export const deleteSharedChild = onCall(options, async (request) => {
  const { ownerUid, childId } = scope(request)
  return service().deleteChild(caller(request), ownerUid, childId)
})
export const cleanupSharedChild = onDocumentDeleted(
  { document: 'users/{ownerUid}/children/{childId}', retry: true },
  async (event) => {
    await service().cleanupChild(event.params.ownerUid, event.params.childId)
  }
)

// Delivery is idempotent at the provider as well as in our outbox. Never log links.
export const deliverParentInvitation = onDocumentCreated(
  {
    document: 'mailOutbox/{messageId}',
    secrets: [emailKey],
    retry: true,
    timeoutSeconds: 60,
    maxInstances: 5,
  },
  async (event) => {
    if (!event.data) return
    const db = getFirestore(),
      jobRef = event.data.ref
    const job = await jobRef.get(),
      data = job.data()
    if (
      !data ||
      data.state === 'sent' ||
      data.state === 'failed' ||
      data.state === 'cancelled'
    )
      return
    const inviteRef = db.doc(`childInvitations/${id(data.invitationId)}`)
    const invite = await inviteRef.get()
    if (
      invite.data()?.jobId !== event.params.messageId ||
      invite.data()?.state !== 'pending' ||
      invite.data()?.expiresAt <= Date.now()
    ) {
      await jobRef.update({ state: 'cancelled', link: FieldValue.delete() })
      return
    }
    // Stop automatic retries inside Resend's 24-hour idempotency window.
    if (
      Date.now() - data.createdAt > 23 * 3600_000 ||
      Number(data.attempts) >= 12
    ) {
      await jobRef.update({ state: 'failed', link: FieldValue.delete() })
      await inviteRef.update({ deliveryState: 'failed' })
      return
    }
    await jobRef.update({ attempts: FieldValue.increment(1) })
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(20_000),
      headers: {
        Authorization: `Bearer ${emailKey.value()}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `parent-invitation/${event.params.messageId}`,
      },
      body: JSON.stringify({
        from: sender.value(),
        to: [data.recipient],
        subject: 'You have been invited to MyStarQuest',
        text: `${data.inviter} has invited you to help ${data.childName} in MyStarQuest.\n\nYou can manage chores, tests and rewards. Child settings and progress resets stay with the admin parent.\n\nOpen this link and sign in with your Google account (${data.recipient}):\n${data.link}\n\nThis invitation expires in seven days. If you did not expect it, you can ignore this email.`,
      }),
    })
    if (!response.ok) {
      if (response.status >= 500 || response.status === 429)
        throw new Error('Invitation delivery temporarily unavailable.')
      await db.runTransaction(async (tx) => {
        const current = await tx.get(inviteRef)
        tx.update(jobRef, {
          state: 'failed',
          link: FieldValue.delete(),
          failureCode: response.status,
        })
        if (current.data()?.jobId === event.params.messageId)
          tx.update(inviteRef, { deliveryState: 'failed' })
      })
      return
    }
    const result = (await response.json()) as { id?: string }
    await db.runTransaction(async (tx) => {
      const current = await tx.get(inviteRef)
      tx.update(jobRef, {
        state: 'sent',
        sentAt: Date.now(),
        providerId: result.id ?? '',
        link: FieldValue.delete(),
      })
      if (current.data()?.jobId === event.params.messageId)
        tx.update(inviteRef, { deliveryState: 'sent' })
    })
  }
)
