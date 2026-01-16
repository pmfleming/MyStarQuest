import { useEffect, useState } from 'react'
import { z } from 'zod'
import {
  THEME_OPTIONS,
  THEME_ID_LOOKUP,
  type ThemeId,
} from '../constants/themeOptions'
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
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import { uiTokens } from '../ui/tokens'

const childSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(40, 'Display name must be under 40 characters'),
  avatarToken: z
    .string()
    .trim()
    .min(1, 'Avatar token is required')
    .max(12, 'Avatar token must be under 12 characters'),
})

type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
  themeId?: ThemeId
  createdAt?: Date
}

const ManageChildrenPage = () => {
  const { user } = useAuth()
  const { activeChildId, setActiveChild, clearActiveChild } = useActiveChild()
  const { theme } = useTheme()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    displayName: '',
    themeId: 'princess' as ThemeId,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          displayName: data.displayName,
          avatarToken: data.avatarToken,
          totalStars: data.totalStars ?? 0,
          themeId: data.themeId,
          createdAt: data.createdAt?.toDate?.(),
        }
      })

      setChildren(nextChildren)
    })

    return unsubscribe
  }, [user])

  const startEdit = (child: ChildProfile) => {
    setEditingId(child.id)
    setEditForm({
      displayName: child.displayName,
      themeId: child.themeId || 'princess',
    })
    setFormErrors({})
  }

  const startCreate = () => {
    if (!user) return
    setEditingId('new')
    setEditForm({
      displayName: '',
      themeId: 'princess',
    })
    setFormErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ displayName: '', themeId: 'princess' })
    setFormErrors({})
  }

  const saveProfile = async (id: string) => {
    if (!user) return

    const parsed = childSchema.safeParse({
      displayName: editForm.displayName,
      avatarToken: THEME_ID_LOOKUP.get(editForm.themeId)?.emoji || '👤',
    })

    if (!parsed.success) {
      setFormErrors({
        [id]: parsed.error.issues.map((issue) => issue.message),
      })
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    const childCollection = collection(db, 'users', user.uid, 'children')

    try {
      if (id === 'new') {
        await addDoc(childCollection, {
          displayName: parsed.data.displayName,
          avatarToken: parsed.data.avatarToken,
          themeId: editForm.themeId,
          totalStars: 0,
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(childCollection, id), {
          displayName: parsed.data.displayName,
          avatarToken: parsed.data.avatarToken,
          themeId: editForm.themeId,
        })

        // If this is the active child, update the theme immediately
        if (id === activeChildId) {
          setActiveChild({ id, themeId: editForm.themeId })
        }
      }

      cancelEdit()
    } catch (error) {
      console.error('Failed to save child profile', error)
      setFormErrors({
        [id]: ['Unable to save child profile. Please try again.'],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this child profile?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'children'), id))
      // Clear selection if deleting the selected explorer
      if (id === activeChildId) {
        clearActiveChild()
      }
    } catch (error) {
      console.error('Failed to delete child profile', error)
    }
  }

  const handleSelectExplorer = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    if (child) {
      setActiveChild({ id: child.id, themeId: child.themeId || 'princess' })
    }
  }

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Manage Children"
        fontFamily={theme.fonts.heading}
        left={
          <TopIconButton
            theme={theme}
            to="/"
            ariaLabel="Home"
            icon={<span className="text-2xl">🏠</span>}
          />
        }
        right={<div style={{ width: `${uiTokens.topIconSize}px` }} />}
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto flex w-full flex-col"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {/* Edit/Create Form */}
          {(editingId === 'new' || editingId !== null) &&
            (editingId === 'new' ||
              children.find((c) => c.id === editingId)) && (
              <div
                className="mb-6 space-y-4 rounded-3xl p-6"
                style={{
                  backgroundColor: theme.colors.surface,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  border: `2px solid ${theme.colors.primary}`,
                }}
              >
                <h3
                  className="text-center text-xl font-bold"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {editingId === 'new' ? 'New Profile' : 'Edit Profile'}
                </h3>

                {/* Error Display */}
                {(formErrors[editingId || 'new']?.length ?? 0) > 0 && (
                  <div className="rounded-xl bg-red-500/20 p-4 text-center text-sm font-bold text-red-200">
                    {formErrors[editingId || 'new']?.map((err) => (
                      <p key={err}>{err}</p>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold opacity-80">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border-none px-4 py-3 text-lg font-bold text-slate-900 focus:ring-4"
                      style={{
                        backgroundColor: '#FFF',
                        minHeight: '60px',
                      }}
                      placeholder="e.g. Star Captain"
                      maxLength={40}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold opacity-80">
                      Choose Theme
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {THEME_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              themeId: option.id,
                            }))
                          }
                          className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all ${
                            editForm.themeId === option.id
                              ? 'ring-4 ring-offset-2 ring-offset-slate-900'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor:
                              editForm.themeId === option.id
                                ? theme.colors.primary
                                : 'rgba(0,0,0,0.2)',
                            borderColor: theme.colors.primary,
                            color:
                              editForm.themeId === option.id
                                ? theme.id === 'space'
                                  ? '#000'
                                  : '#FFF'
                                : 'inherit',
                          }}
                        >
                          <span className="text-4xl">{option.emoji}</span>
                          <span className="text-sm font-bold">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-2xl py-4 text-lg font-bold opacity-80 transition active:scale-95"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      minHeight: '60px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveProfile(editingId || 'new')}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl py-4 text-lg font-bold shadow-lg transition active:scale-95"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.id === 'space' ? '#000' : '#FFF',
                      minHeight: '60px',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

          {/* Children List */}
          <StandardActionList
            theme={theme}
            items={children.filter((child) => editingId !== child.id)}
            getKey={(child) => child.id}
            renderItem={(child) => {
              const childTheme = child.themeId
                ? THEME_ID_LOOKUP.get(child.themeId)
                : null
              return (
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-4xl shadow-inner"
                    style={{
                      backgroundColor:
                        activeChildId === child.id
                          ? 'rgba(255,255,255,0.3)'
                          : 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {childTheme ? childTheme.emoji : child.avatarToken}
                  </div>
                  <div>
                    <div className="text-lg font-bold">{child.displayName}</div>
                    <div className="text-sm opacity-80">
                      {child.totalStars} Stars • {childTheme?.label}
                    </div>
                  </div>
                </div>
              )
            }}
            primaryAction={{
              label: (child) =>
                activeChildId === child.id ? 'Active' : 'Select',
              icon: (child) => (activeChildId === child.id ? '✅' : '⭐'),
              onClick: (child) => handleSelectExplorer(child.id),
              disabled: (child) =>
                activeChildId === child.id || editingId !== null,
              variant: 'primary',
            }}
            onEdit={(child) => startEdit(child)}
            onDelete={(child) => handleDelete(child.id)}
            addLabel="Add Child"
            onAdd={startCreate}
            addDisabled={editingId !== null}
            isHighlighted={(child) => activeChildId === child.id}
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                No explorers yet.
              </div>
            }
          />
        </div>
      </main>
    </PageShell>
  )
}

export default ManageChildrenPage
