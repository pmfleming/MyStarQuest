// ── Real-time children subscription + all child mutations ──

import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { THEME_ID_LOOKUP, type ThemeId } from '../ui/themeOptions'
import {
  parseChildProfile,
  type ChildProfile,
  type ChildUpdatableFields,
} from './types'
import {
  commitBoundedDraft,
  mergeMissingTitleDrafts,
  setDraftValue,
} from './dailyTaskState'
import { useUserCollection } from './useUserCollection'
import { useOptimisticItems } from '../hooks/useCoalescedDocumentUpdates'
import {
  createUserDocument,
  deleteUserDocument,
  useUserDocumentUpdates,
} from './useUserDocumentUpdates'
import { useRequiredContext } from '../hooks/useRequiredContext'
import { storageKeyForChild, useDataScope } from '../sharing/ChildAccessContext'
import { sharingCall } from '../sharing/api'
import { parseChildScope } from '../sharing/scope'

const useChildrenState = () => {
  const { user } = useAuth()
  const { storageKey, access, canAdmin } = useDataScope()
  const resolveChildUserId = useCallback(
    (id: string) => {
      const child = access?.choices.find(
        (child) => child.id === id && child.ownerUid === user?.uid
      )
      return child && user ? storageKeyForChild(user.uid, child) : user?.uid
    },
    [access?.choices, user]
  )
  const { activeChildId, activeThemeId, setActiveChild, clearActiveChild } =
    useActiveChild()
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})

  const handleChildren = useCallback((nextChildren: ChildProfile[]) => {
    setNameDrafts((prev) =>
      mergeMissingTitleDrafts(
        prev,
        nextChildren.map((child) => ({
          id: child.id,
          title: child.displayName,
        }))
      )
    )
  }, [])

  const clearChildren = useCallback(() => setNameDrafts({}), [])

  const {
    overrides: optimisticFields,
    queueUpdate: queueChildField,
    cancelUpdate: cancelChildFieldUpdate,
    reconcile: reconcileChildFields,
  } = useUserDocumentUpdates<ChildUpdatableFields>({
    userId: user?.uid,
    collectionName: 'children',
    errorMessage: 'Failed to update child profile',
    resolveUserId: resolveChildUserId,
  })

  const rawChildren = useUserCollection({
    userId: storageKey,
    collectionName: 'children',
    orderByField: 'createdAt',
    errorMessage: 'Failed to subscribe to children',
    mapDocument: parseChildProfile,
    onItems: handleChildren,
    onClear: clearChildren,
  })

  const children = useOptimisticItems(
    access && canAdmin
      ? access.choices
          .filter((child) => child.ownerUid === user?.uid)
          .map(
            (child) => rawChildren.find((raw) => raw.id === child.id) ?? child
          )
      : rawChildren,
    optimisticFields,
    reconcileChildFields
  )

  // ── Generic field update ──
  const updateChildField: typeof queueChildField = (id, patch) => {
    if (!canAdmin) throw new Error('Only the admin can change child settings.')
    return queueChildField(id, patch)
  }

  // ── Name draft helpers ──
  const setNameDraft = (childId: string, value: string) =>
    setDraftValue(setNameDrafts, childId, value)

  const commitDisplayName = (childId: string, value: string) =>
    commitBoundedDraft(
      value,
      40,
      children.find((child) => child.id === childId)?.displayName,
      (displayName) => updateChildField(childId, { displayName }),
      (displayName) => setNameDraft(childId, displayName)
    )

  // ── Theme change ──
  const changeTheme = (child: ChildProfile, nextThemeId: ThemeId) => {
    if ((child.themeId || 'princess') === nextThemeId) return

    const avatarToken = THEME_ID_LOOKUP.get(nextThemeId)?.emoji || '👤'
    updateChildField(child.id, { themeId: nextThemeId, avatarToken })
  }

  // ── Create ──
  const createChild = async () => {
    if (!user || !canAdmin) return
    return createUserDocument(user.uid, 'children', {
      displayName: '',
      avatarToken: THEME_ID_LOOKUP.get('princess')?.emoji || '👤',
      themeId: 'princess',
      totalStars: 0,
      testFailureModeEnabled: true,
    })
  }

  // ── Delete ──
  const deleteChild = async (id: string) => {
    if (!user || !canAdmin) return
    cancelChildFieldUpdate(id)
    const scope = parseChildScope(resolveChildUserId(id))
    if (scope)
      await sharingCall('deleteSharedChild', {
        ownerUid: scope.ownerUid,
        childId: id,
      })
    else await deleteUserDocument(user.uid, 'children', id)
    if (id === activeChildId) clearActiveChild()
  }

  // ── Select ──
  const selectChild = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    if (child) {
      setActiveChild({
        id: child.id,
        themeId: child.themeId || 'princess',
        ...(access ? { ownerUid: user?.uid } : {}),
      })
    }
  }

  // Follow the subscribed profile, including theme edits from another device.
  useEffect(() => {
    if (access) return // The access provider selects across owner namespaces.
    const selectedChild =
      children.find((child) => child.id === activeChildId) ?? children[0]
    if (!selectedChild) return
    const themeId = selectedChild.themeId || 'princess'
    if (selectedChild.id !== activeChildId || themeId !== activeThemeId) {
      setActiveChild({ id: selectedChild.id, themeId })
    }
  }, [children, activeChildId, activeThemeId, setActiveChild, access])

  return {
    children,
    nameDrafts,
    setNameDraft,
    commitDisplayName,
    updateChildField,
    changeTheme,
    createChild,
    deleteChild,
    selectChild,
  }
}

type ChildrenContextValue = ReturnType<typeof useChildrenState>

const ChildrenContext = createContext<ChildrenContextValue | undefined>(
  undefined
)

export const ChildrenProvider = ({ children }: { children: ReactNode }) => {
  const value = useChildrenState()

  return createElement(ChildrenContext.Provider, { value }, children)
}

export function useChildren() {
  return useRequiredContext(ChildrenContext, 'useChildren', 'ChildrenProvider')
}
