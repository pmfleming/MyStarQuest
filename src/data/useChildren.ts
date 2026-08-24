// ── Real-time children subscription + all child mutations ──

import { useCallback, useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
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
import { mergeMissingTitleDrafts } from './dailyTaskState'
import { useUserCollection } from './useUserCollection'

export function useChildren() {
  const { user } = useAuth()
  const { activeChildId, setActiveChild, clearActiveChild } = useActiveChild()
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

  const children = useUserCollection({
    userId: user?.uid,
    collectionName: 'children',
    orderByField: 'createdAt',
    errorMessage: 'Failed to subscribe to children',
    mapDocument: mapChildDocument,
    onItems: handleChildren,
    onClear: clearChildren,
  })

  // ── Generic field update ──
  const updateChildField = async (id: string, field: ChildUpdatableFields) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'children'), id),
        field
      )
    } catch (error) {
      console.error('Failed to update child profile', error)
    }
  }

  // ── Name draft helpers ──
  const setNameDraft = (childId: string, value: string) =>
    setNameDrafts((prev) => ({ ...prev, [childId]: value }))

  const commitDisplayName = (childId: string, value: string) => {
    const trimmed = value.trim()
    if (trimmed.length > 0 && trimmed.length <= 40) {
      updateChildField(childId, { displayName: trimmed })
      return
    }
    const saved = children.find((child) => child.id === childId)
    if (saved) {
      setNameDrafts((prev) => ({ ...prev, [childId]: saved.displayName }))
    }
  }

  // ── Theme change ──
  const changeTheme = (child: ChildProfile, nextThemeId: ThemeId) => {
    if ((child.themeId || 'princess') === nextThemeId) return

    const avatarToken = THEME_ID_LOOKUP.get(nextThemeId)?.emoji || '👤'
    updateChildField(child.id, { themeId: nextThemeId, avatarToken })

    if (child.id === activeChildId) {
      setActiveChild({ id: child.id, themeId: nextThemeId })
    }
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

  // ── Auto-select first child if none active ──
  useEffect(() => {
    if (children.length > 0) {
      const isCurrentActive =
        activeChildId && children.some((c) => c.id === activeChildId)
      if (!isCurrentActive) {
        setActiveChild({
          id: children[0].id,
          themeId: children[0].themeId || 'princess',
        })
      }
    }
  }, [children, activeChildId, setActiveChild])

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
