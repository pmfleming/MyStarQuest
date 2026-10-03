import { useEffect, useState } from 'react'
import type { ChildProfile } from '../data/types'
import { storageKeyForChild, useDataScope } from './ChildAccessContext'
import { sharingCall, type ParentsResult } from './api'
import { offlineRuntime } from '../offline/runtime'
import { isOfflineEnabled } from '../offline/platform'
export default function ParentAccessPanel({ child }: { child: ChildProfile }) {
  const { actorUid, canAdmin, access } = useDataScope()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ParentsResult>()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
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
  const scope = { ownerUid: actorUid, childId: child.id }
  const refresh = async () =>
    setData(await sharingCall<ParentsResult>('listChildParents', scope))
  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not save parent access.'
      )
    } finally {
      setBusy(false)
    }
  }
  if (!canAdmin || !actorUid) return null
  return (
    <section
      className="mt-4 rounded-2xl border border-current/20 p-4"
      aria-label={`Parents for ${child.displayName}`}
    >
      <button
        className="font-bold underline"
        aria-expanded={open}
        disabled={busy}
        onClick={() => {
          setOpen(!open)
          if (!open) void run(refresh)
        }}
      >
        Parents
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p>
            You are the admin. Other parents can manage all activities for{' '}
            {child.displayName}. Only you can manage children and reset
            progress.
          </p>
          <p className="text-sm">
            Inviting the first parent enables shared progress and a reward list
            for this child. Sync all devices first; older app versions cannot
            save changes for this child afterwards.
          </p>
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
            <button disabled={busy} className="rounded-xl border p-3 font-bold">
              Invite parent
            </button>
          </form>
          {data?.parents
            .filter((parent) => parent.status === 'active')
            .map((parent) => (
              <div
                key={parent.uid}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="flex-1 break-all">
                  {parent.email} · Active
                </span>
                <button
                  disabled={busy}
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
                      disabled={busy}
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
              </div>
            ))}
          {data?.invitations
            .filter((invite) => invite.state !== 'accepted')
            .map((invite) => (
              <div key={invite.id} className="flex flex-wrap gap-3">
                <span className="flex-1 break-all">
                  {invite.email} · {invite.state} · Email {invite.deliveryState}
                </span>
                <button
                  disabled={busy}
                  className="underline"
                  onClick={() =>
                    void run(async () => {
                      await sharingCall('resendParentInvitation', {
                        ...scope,
                        email: invite.email,
                        inviteId: invite.id,
                        requestId: crypto.randomUUID(),
                      })
                      await refresh()
                    })
                  }
                >
                  Resend
                </button>
                {invite.state === 'pending' && (
                  <button
                    disabled={busy}
                    className="underline"
                    onClick={() =>
                      void run(async () => {
                        await sharingCall('revokeParentInvitation', {
                          ...scope,
                          inviteId: invite.id,
                        })
                        await refresh()
                      })
                    }
                  >
                    Cancel invitation
                  </button>
                )}
              </div>
            ))}
          <button
            disabled={busy}
            className="self-start underline"
            onClick={() => void run(refresh)}
          >
            Refresh status
          </button>
          {(busy || message) && (
            <p role="status">{busy ? 'Saving…' : message}</p>
          )}
        </div>
      )}
    </section>
  )
}
