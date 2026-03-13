// ── Real-time children subscription + all child mutations ──

import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { THEME_ID_LOOKUP, type ThemeId } from '../ui/themeOptions'
import type { ChildProfile, ChildUpdatableFields } from './types'

export function useChildren() {
  const { user } = useAuth()
  const { activeChildId, setActiveChild, clearActiveChild } = useActiveChild()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})

  // ── Subscription ──
  useEffect(() => {
    if (!user) {
      setChildren([])
      return
    }

    const childQuery = query(
      collection(db, 'users', user.uid, 'children'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(childQuery, (snapshot) => {
      const nextChildren: ChildProfile[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          displayName: data.displayName ?? '',
          avatarToken: data.avatarToken ?? '⭐',
          totalStars: Number(data.totalStars ?? 0),
          themeId: data.themeId,
          createdAt: data.createdAt?.toDate?.(),
        }
      })

      setChildren(nextChildren)

      setNameDrafts((prev) => {
        const next = { ...prev }
        for (const child of nextChildren) {
          if (!(child.id in next)) {
            next[child.id] = child.displayName
          }
        }
        return next
      })
    })

    return unsubscribe
  }, [user])

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
          themeId: children[0].themeId || 'space',
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
