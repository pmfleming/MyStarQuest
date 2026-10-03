import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { childSnapshotDataSchema } from '../data/types'
import { isThemeId } from '../ui/themeOptions'
import { offlineRuntime } from '../offline/runtime'
import { isOfflineEnabled } from '../offline/platform'
import { childStorageKey } from './scope'
import { ChildAccessContext, type AccessibleChild } from './ChildAccessContext'

function profile(
  ownerUid: string,
  childId: string,
  data: unknown,
  membershipVersion = 0
): AccessibleChild | null {
  const parsed = childSnapshotDataSchema.safeParse(data)
  if (!parsed.success) return null
  const item = parsed.data
  return {
    id: childId,
    ownerUid,
    membershipVersion,
    displayName: item.displayName,
    avatarToken: item.avatarToken,
    totalStars: item.totalStars,
    testFailureModeEnabled: item.testFailureModeEnabled,
    themeId: isThemeId(item.themeId ?? '')
      ? (item.themeId as AccessibleChild['themeId'])
      : 'princess',
    createdAt: item.createdAt?.toDate?.(),
    sharedDataVersion: Number(item.sharedDataVersion ?? 0),
    timeZone:
      typeof item.timeZone === 'string' ? item.timeZone : 'Europe/London',
  }
}
export default function ChildAccessProvider({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  return user ? (
    <AccountChildAccess key={user.uid} actorUid={user.uid}>
      {children}
    </AccountChildAccess>
  ) : (
    children
  )
}
function AccountChildAccess({
  actorUid,
  children,
}: {
  actorUid: string
  children: ReactNode
}) {
  const { activeChildId, activeOwnerUid, setActiveChild, clearActiveChild } =
    useActiveChild()
  const [owned, setOwned] = useState<AccessibleChild[]>([])
  const [invited, setInvited] = useState<Record<string, AccessibleChild>>({})
  const [ready, setReady] = useState({ owned: false, grants: false })
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isOfflineEnabled()) return offlineRuntime(actorUid).connect()
  }, [actorUid])
  useEffect(() => {
    const stop = onSnapshot(
      collection(db, 'users', actorUid, 'children'),
      (snapshot) => {
        setOwned(
          snapshot.docs.flatMap((doc) => {
            const child = profile(actorUid, doc.id, doc.data())
            return child ? [child] : []
          })
        )
        setReady((state) => ({ ...state, owned: true }))
      },
      () => {
        setOwned([])
        setError('Could not load your children. Reconnect and try again.')
        setReady((state) => ({ ...state, owned: true }))
      }
    )
    return stop
  }, [actorUid])
  useEffect(() => {
    const subscriptions = new Map<
      string,
      { stop: () => void; scope: string; version: number }
    >()
    const pending = new Set<string>()
    let disposed = false
    const settled = () => {
      if (!disposed)
        setReady((state) => ({ ...state, grants: pending.size === 0 }))
    }
    const remove = (key: string) =>
      setInvited((previous) => {
        const next = { ...previous }
        delete next[key]
        return next
      })
    const stop = onSnapshot(
      collection(db, 'users', actorUid, 'childAccess'),
      (snapshot) => {
        const grants = snapshot.docs.filter(
          (doc) => doc.data().status === 'active'
        )
        const keys = new Set(grants.map((doc) => doc.id))
        for (const [key, entry] of subscriptions)
          if (!keys.has(key)) {
            entry.stop()
            subscriptions.delete(key)
            pending.delete(key)
            remove(key)
            void offlineRuntime(entry.scope).revoke()
          }
        for (const grant of grants) {
          const data = grant.data()
          if (
            typeof data.ownerUid !== 'string' ||
            typeof data.childId !== 'string' ||
            !Number.isInteger(data.membershipVersion)
          )
            continue
          const previous = subscriptions.get(grant.id)
          if (previous?.version === data.membershipVersion) continue
          if (previous) {
            previous.stop()
            void offlineRuntime(previous.scope).revoke()
            remove(grant.id)
          }
          const scope = childStorageKey({
            actorUid,
            ownerUid: data.ownerUid,
            childId: data.childId,
            membershipVersion: data.membershipVersion,
          })
          pending.add(grant.id)
          const unsubscribe = onSnapshot(
            doc(db, 'users', data.ownerUid, 'children', data.childId),
            (snapshot) => {
              if (disposed) return
              const child = snapshot.exists()
                ? profile(
                    data.ownerUid,
                    data.childId,
                    snapshot.data(),
                    data.membershipVersion
                  )
                : null
              if (child)
                setInvited((previous) => ({ ...previous, [grant.id]: child }))
              else {
                remove(grant.id)
                if (!snapshot.metadata.fromCache)
                  void offlineRuntime(scope).revoke()
              }
              pending.delete(grant.id)
              settled()
            },
            () => {
              remove(grant.id)
              pending.delete(grant.id)
              void offlineRuntime(scope).revoke()
              settled()
              setError(
                'Access to a shared child has ended or could not be verified.'
              )
            }
          )
          subscriptions.set(grant.id, {
            stop: unsubscribe,
            scope,
            version: data.membershipVersion,
          })
        }
        settled()
      },
      () => {
        for (const entry of subscriptions.values()) {
          entry.stop()
          void offlineRuntime(entry.scope).revoke()
        }
        pending.clear()
        setInvited({})
        settled()
        setError('Could not verify shared child access.')
      }
    )
    return () => {
      disposed = true
      stop()
      for (const entry of subscriptions.values()) entry.stop()
    }
  }, [actorUid])
  const choices = useMemo(
    () => [...owned, ...Object.values(invited)],
    [owned, invited]
  )
  const selected = choices.find(
    (child) =>
      child.id === activeChildId &&
      child.ownerUid === (activeOwnerUid ?? actorUid)
  )
  const loading = !ready.owned || !ready.grants
  useEffect(() => {
    if (loading) return
    if (selected) {
      setActiveChild({
        id: selected.id,
        themeId: selected.themeId ?? 'princess',
        ownerUid: selected.ownerUid,
      })
      return
    }
    const first = choices[0]
    if (first)
      setActiveChild({
        id: first.id,
        themeId: first.themeId ?? 'princess',
        ownerUid: first.ownerUid,
      })
    else if (activeChildId) clearActiveChild()
  }, [
    loading,
    selected,
    choices,
    actorUid,
    activeChildId,
    activeOwnerUid,
    invited,
    setActiveChild,
    clearActiveChild,
  ])
  const value = useMemo(
    () => ({
      actorUid,
      choices,
      selected,
      loading:
        loading ||
        Boolean(activeChildId && !selected) ||
        (!selected && choices.length > 0),
      error,
      select: (child: AccessibleChild) =>
        setActiveChild({
          id: child.id,
          themeId: child.themeId ?? 'princess',
          ownerUid: child.ownerUid,
        }),
    }),
    [actorUid, choices, selected, loading, error, setActiveChild, activeChildId]
  )
  return <ChildAccessContext value={value}>{children}</ChildAccessContext>
}
