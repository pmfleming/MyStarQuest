// ── Real-time children subscription + all child mutations ──

import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { THEME_ID_LOOKUP, isThemeId, type ThemeId } from '../ui/themeOptions'
import {
  childSnapshotDataSchema,
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
import { useUserDocumentUpdates } from './useUserDocumentUpdates'
import { useRequiredContext } from '../hooks/useRequiredContext'

const useChildrenState = () => {
  const { user } = useAuth()
  const { activeChildId, activeThemeId, setActiveChild, clearActiveChild } =
    useActiveChild()
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})

  const mapChildDocument = useCallback((id: string, data: unknown) => {
    const parsed = childSnapshotDataSchema.safeParse(data)
    if (!parsed.success) {
      console.warn('Skipping invalid child snapshot', {
        id,
        issues: parsed.error.issues,
      })
      return null
    }

    const childData = parsed.data
    const themeId = childData.themeId
    const normalizedThemeId =
      themeId && isThemeId(themeId) ? themeId : undefined

    return {
      id,
      displayName: childData.displayName,
      avatarToken: childData.avatarToken,
      totalStars: childData.totalStars,
      themeId: normalizedThemeId,
      testFailureModeEnabled: childData.testFailureModeEnabled,
      createdAt: childData.createdAt?.toDate?.(),
    }
  }, [])

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
  })

  const rawChildren = useUserCollection({
    userId: user?.uid,
    collectionName: 'children',
    orderByField: 'createdAt',
    errorMessage: 'Failed to subscribe to children',
    mapDocument: mapChildDocument,
    onItems: handleChildren,
    onClear: clearChildren,
  })

  const children = useOptimisticItems(
    rawChildren,
    optimisticFields,
    reconcileChildFields
  )

  // ── Generic field update ──
  const updateChildField = (id: string, field: ChildUpdatableFields) =>
    queueChildField(id, field)

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
    if (!user) return
    await addDoc(collection(db, 'users', user.uid, 'children'), {
      displayName: '',
      avatarToken: THEME_ID_LOOKUP.get('princess')?.emoji || '👤',
      themeId: 'princess',
      totalStars: 0,
      testFailureModeEnabled: true,
      createdAt: serverTimestamp(),
    })
  }

  // ── Delete ──
  const deleteChild = async (id: string) => {
    if (!user) return
    cancelChildFieldUpdate(id)
    await deleteDoc(doc(collection(db, 'users', user.uid, 'children'), id))
    if (id === activeChildId) clearActiveChild()
  }

  // ── Select ──
  const selectChild = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    if (child) {
      setActiveChild({ id: child.id, themeId: child.themeId || 'princess' })
    }
  }

  // Follow the subscribed profile, including theme edits from another device.
  useEffect(() => {
    const selectedChild =
      children.find((child) => child.id === activeChildId) ?? children[0]
    if (!selectedChild) return
    const themeId = selectedChild.themeId || 'princess'
    if (selectedChild.id !== activeChildId || themeId !== activeThemeId) {
      setActiveChild({ id: selectedChild.id, themeId })
    }
  }, [children, activeChildId, activeThemeId, setActiveChild])

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
