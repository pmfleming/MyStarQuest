import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { offlineRuntime } from './runtime'
import { isAndroidOffline } from './platform'

function AccountOfflineBoundary({
  userId,
  children,
}: {
  userId: string
  children: ReactNode
}) {
  const runtime = offlineRuntime(userId)
  const state = useSyncExternalStore(
    runtime.store.subscribe,
    runtime.store.getSnapshot
  )
  const status = useSyncExternalStore(
    runtime.sync.subscribe,
    runtime.sync.getSnapshot
  )
  const error = useSyncExternalStore(runtime.subscribeErrors, runtime.getError)
  useEffect(() => runtime.connect(), [runtime])
  if (!state)
    return (
      <div role="status" className="p-6">
        {error ?? 'Opening saved data…'}
      </div>
    )
  const pending = state.pending.length
  const message =
    error ??
    status.message ??
    (pending
      ? `${pending} ${pending === 1 ? 'change' : 'changes'} saved on this phone${status.state === 'syncing' ? ' · syncing' : ' · waiting to sync'}`
      : null)
  return (
    <>
      {children}
      {message && (
        <div
          role="status"
          className="fixed left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-2xl bg-white px-3 py-2 text-center text-xs text-purple-950 shadow-md"
          style={{ bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }}
        >
          <span>{message}</span>
          {(status.state === 'attention' || status.state === 'waiting') && (
            <button
              type="button"
              className="font-bold underline"
              onClick={runtime.sync.retry}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default function OfflineBoundary({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return isAndroidOffline() && user ? (
    <AccountOfflineBoundary key={user.uid} userId={user.uid}>
      {children}
    </AccountOfflineBoundary>
  ) : (
    children
  )
}
