import { useUserCollection } from '../data/useUserCollection'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { parseChildProfile } from '../data/types'
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
  const child = parseChildProfile(childId, data)
  return child
    ? {
        ...child,
        ownerUid,
        membershipVersion,
        themeId: child.themeId ?? 'princess',
      }
    : null
}
// The index and its profile listeners share one lifetime. Removing or replacing
// a grant invalidates its callbacks before clearing that grant's local cache.
function subscribeSharedChildren(
  actorUid: string,
  update: (children: AccessibleChild[], ready: boolean) => void,
  report: (message: string) => void
) {
  type Subscription = {
    scope: string
    stop: () => void
    ready: boolean
    child?: AccessibleChild
  }
  const entries = new Map<string, Subscription>()
  let disposed = false
  const updateChoices = () => {
    const current = [...entries.values()]
    update(
      current.flatMap((entry) => (entry.child ? [entry.child] : [])),
      current.every((entry) => entry.ready)
    )
  }
  const remove = (key: string) => {
    const entry = entries.get(key)
    if (!entry) return
    entries.delete(key)
    entry.stop()
    void offlineRuntime(entry.scope).revoke()
  }
  const stop = onSnapshot(
    collection(db, 'users', actorUid, 'childAccess'),
    (snapshot) => {
      if (disposed) return
      const keys = new Set<string>()
      for (const grant of snapshot.docs) {
        const {
          ownerUid,
          childId,
          membershipVersion,
          status,
        }: Record<string, unknown> = grant.data()
        if (
          status !== 'active' ||
          typeof ownerUid !== 'string' ||
          typeof childId !== 'string' ||
          typeof membershipVersion !== 'number' ||
          !Number.isInteger(membershipVersion)
        )
          continue
        keys.add(grant.id)
        const scope = childStorageKey({
          actorUid,
          ownerUid,
          childId,
          membershipVersion,
        })
        if (entries.get(grant.id)?.scope === scope) continue
        remove(grant.id)
        const entry: Subscription = { scope, stop: () => {}, ready: false }
        entries.set(grant.id, entry)
        entry.stop = onSnapshot(
          doc(db, 'users', ownerUid, 'children', childId),
          (snapshot) => {
            if (entries.get(grant.id) !== entry) return
            entry.child = snapshot.exists()
              ? (profile(
                  ownerUid,
                  childId,
                  snapshot.data(),
                  membershipVersion
                ) ?? undefined)
              : undefined
            if (!entry.child && !snapshot.metadata.fromCache)
              void offlineRuntime(scope).revoke()
            entry.ready = true
            updateChoices()
          },
          () => {
            if (entries.get(grant.id) !== entry) return
            remove(grant.id)
            updateChoices()
            report(
              'Access to a shared child has ended or could not be verified.'
            )
          }
        )
      }
      for (const key of entries.keys()) if (!keys.has(key)) remove(key)
      updateChoices()
    },
    () => {
      if (disposed) return
      for (const key of entries.keys()) remove(key)
      updateChoices()
      report('Could not verify shared child access.')
    }
  )
  return () => {
    disposed = true
    stop()
    for (const entry of entries.values()) entry.stop()
    entries.clear()
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
  const [invited, setInvited] = useState<AccessibleChild[]>([])
  const [ready, setReady] = useState({ owned: false, grants: false })
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isOfflineEnabled()) return offlineRuntime(actorUid).connect()
  }, [actorUid])
  const ownedReady = useCallback(
    () => setReady((state) => ({ ...state, owned: true })),
    []
  )
  const ownedFailed = useCallback(() => {
    setError('Could not load your children. Reconnect and try again.')
    ownedReady()
  }, [ownedReady])
  const mapOwned = useCallback(
    (id: string, data: unknown) => profile(actorUid, id, data),
    [actorUid]
  )
  const owned = useUserCollection({
    userId: actorUid,
    collectionName: 'children',
    mapDocument: mapOwned,
    onItems: ownedReady,
    onClear: ownedFailed,
    errorMessage: 'Could not load your children.',
  })

  useEffect(
    () =>
      subscribeSharedChildren(
        actorUid,
        (children, grants) => {
          setInvited(children)
          setReady((state) => ({ ...state, grants }))
        },
        setError
      ),
    [actorUid]
  )
  const choices = useMemo(() => [...owned, ...invited], [owned, invited])
  const selected = choices.find(
    (child) =>
      child.id === activeChildId &&
      child.ownerUid === (activeOwnerUid ?? actorUid)
  )
  const loading = !ready.owned || !ready.grants
  useEffect(() => {
    if (loading) return
    const child = selected ?? choices[0]
    if (child)
      setActiveChild({ ...child, themeId: child.themeId ?? 'princess' })
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
        setActiveChild({ ...child, themeId: child.themeId ?? 'princess' }),
    }),
    [actorUid, choices, selected, loading, error, setActiveChild, activeChildId]
  )
  return <ChildAccessContext value={value}>{children}</ChildAccessContext>
}
