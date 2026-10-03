import { createContext, useContext } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { childStorageKey } from './scope'
import type { ChildProfile } from '../data/types'

export type AccessibleChild = ChildProfile & {
  ownerUid: string
  membershipVersion: number
  sharedDataVersion?: number
  timeZone?: string
}
export type ChildAccess = {
  choices: AccessibleChild[]
  actorUid: string
  selected?: AccessibleChild
  loading: boolean
  error: string | null
  select: (child: AccessibleChild) => void
}
export const ChildAccessContext = createContext<ChildAccess | null>(null)
export const useChildAccess = () => useContext(ChildAccessContext)
export function storageKeyForChild(actorUid: string, child: AccessibleChild) {
  return child.sharedDataVersion === 1 || child.ownerUid !== actorUid
    ? childStorageKey({
        actorUid,
        ownerUid: child.ownerUid,
        childId: child.id,
        membershipVersion: child.membershipVersion,
      })
    : actorUid
}
export function useDataScope() {
  const access = useChildAccess()
  const { user } = useAuth()
  const active = useActiveChild()
  const canAdmin = access
    ? !access.loading &&
      (access.selected
        ? access.selected.ownerUid === access.actorUid
        : access.choices.length === 0)
    : true
  const storageKey = access
    ? access.loading
      ? undefined
      : access.selected
        ? storageKeyForChild(access.actorUid, access.selected)
        : access.actorUid
    : user?.uid
  return {
    storageKey,
    canAdmin,
    access,
    actorUid: user?.uid,
    childId: active.activeChildId,
    timeZone: access?.selected?.timeZone ?? 'Europe/London',
  }
}
