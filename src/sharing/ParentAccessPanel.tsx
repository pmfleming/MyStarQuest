import { useAsyncFeedback } from '../hooks/useAsyncFeedback'
import { useEffect, useState } from 'react'
import type { ChildProfile } from '../data/types'
import { storageKeyForChild, useDataScope } from './ChildAccessContext'
import { sharingCall, type ParentsResult } from './api'
import { offlineRuntime } from '../offline/runtime'
import { isOfflineEnabled } from '../offline/platform'
import { useTheme } from '../contexts/ThemeContext'
import { getSchoolEventImage } from '../ui/schoolEventAssets'
export default function ParentAccessPanel({ child }: { child: ChildProfile }) {
  const { theme } = useTheme()
  const { actorUid, actorEmail, canAdmin, access } = useDataScope()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ParentsResult>()
  const [email, setEmail] = useState('')
  const { busy, message, setMessage, run } = useAsyncFeedback(
    'Could not save parent access.'
  )
  const [confirm, setConfirm] = useState<string>()
  const target = access?.choices.find(
    (item) => item.ownerUid === actorUid && item.id === child.id
  )
  const key =
    target && actorUid ? storageKeyForChild(actorUid, target) : actorUid
  useEffect(() => {
    if (key && (isOfflineEnabled() || key !== actorUid))
      return offlineRuntime(key).connect()
  }, [key, actorUid])
  useEffect(() => {
    if (!canAdmin || !actorUid) return
    let disposed = false
    void sharingCall<ParentsResult>('listChildParents', {
      ownerUid: actorUid,
      childId: child.id,
    })
      .then((result) => {
        if (!disposed) setData(result)
      })
      .catch((error) => {
        if (!disposed)
          setMessage(
            error instanceof Error ? error.message : 'Could not load parents.'
          )
      })
      .finally(() => {
        if (!disposed) setLoading(false)
      })
    return () => {
      disposed = true
    }
  }, [actorUid, canAdmin, child.id, setMessage])
  const scope = { ownerUid: actorUid, childId: child.id }
  const refresh = async () =>
    setData(await sharingCall<ParentsResult>('listChildParents', scope))
  const changeAccess = (command: string, fields: Record<string, unknown>) =>
    run(async () => {
      await sharingCall(command, { ...scope, ...fields })
      await refresh()
    })
  if (!canAdmin || !actorUid) return null
  return (
    <section
      className="mt-4 rounded-2xl border border-current/20 p-4"
      aria-label={`Parents for ${child.displayName}`}
    >
      <img
        src={getSchoolEventImage(theme.id, 'parent-meeting')}
        alt="Parents"
        width={96}
        height={96}
        className="mx-auto h-24 w-24 object-contain"
      />
      <div className="mt-3 flex flex-col gap-3">
        <ul
          aria-label="Current parents"
          className="flex list-none flex-col gap-3 p-0"
        >
          <li className="break-all">{actorEmail || 'You'} · Admin</li>
          {data?.parents
            .filter((parent) => parent.status === 'active')
            .map((parent) => (
              <li
                key={parent.uid}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="flex-1 break-all">
                  {parent.email} · Active
                </span>
                <button
                  disabled={busy || loading}
                  className="underline"
                  onClick={() => setConfirm(parent.uid)}
                >
                  Remove access
                </button>
                {confirm === parent.uid && (
                  <div role="group" aria-label="Confirm removal">
                    <p>
                      Remove {parent.email} from this child? Unsynced changes
                      from that parent will be discarded.
                    </p>
                    <button
                      disabled={busy || loading}
                      className="mr-4 font-bold underline"
                      onClick={() =>
                        void run(async () => {
                          await sharingCall('removeParentAccess', {
                            ...scope,
                            parentUid: parent.uid,
                          })
                          setConfirm(undefined)
                          await refresh()
                        })
                      }
                    >
                      Confirm removal
                    </button>
                    <button onClick={() => setConfirm(undefined)}>
                      Keep access
                    </button>
                  </div>
                )}
              </li>
            ))}
        </ul>
        {loading && <p role="status">Loading parents…</p>}
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            void run(async () => {
              if (isOfflineEnabled()) {
                const runtime = offlineRuntime(actorUid)
                await runtime.store.open()
                if (runtime.store.getSnapshot()?.pending.length)
                  throw new Error(
                    'Wait for this device’s changes to finish syncing, then invite the parent.'
                  )
              }
              await sharingCall('prepareChildSharing', scope)
              await sharingCall('inviteParent', {
                ...scope,
                email,
                requestId: crypto.randomUUID(),
              })
              setEmail('')
              await refresh()
              setMessage('Invitation queued for email delivery.')
            })
          }}
        >
          <label className="flex flex-1 flex-col gap-1">
            Parent’s Google email
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border bg-white p-2 text-black"
            />
          </label>
          <button
            disabled={busy || loading}
            className="rounded-xl border p-3 font-bold"
          >
            Invite parent
          </button>
        </form>
        {data?.invitations
          .filter((invite) => invite.state !== 'accepted')
          .map((invite) => (
            <div key={invite.id} className="flex flex-wrap gap-3">
              <span className="flex-1 break-all">
                {invite.email} · {invite.state} · Email {invite.deliveryState}
              </span>
              <button
                disabled={busy || loading}
                className="underline"
                onClick={() =>
                  void changeAccess('resendParentInvitation', {
                    email: invite.email,
                    inviteId: invite.id,
                    requestId: crypto.randomUUID(),
                  })
                }
              >
                Resend
              </button>
              {invite.state === 'pending' && (
                <button
                  disabled={busy || loading}
                  className="underline"
                  onClick={() =>
                    void changeAccess('revokeParentInvitation', {
                      inviteId: invite.id,
                    })
                  }
                >
                  Cancel invitation
                </button>
              )}
            </div>
          ))}
        <button
          disabled={busy || loading}
          className="self-start underline"
          onClick={() => void run(refresh)}
        >
          Refresh status
        </button>
        {(busy || message) && <p role="status">{busy ? 'Saving…' : message}</p>}
      </div>
    </section>
  )
}
