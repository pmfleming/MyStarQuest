import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <div
      className="flex min-h-screen w-full items-center justify-center transition-colors duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      {/* Device Frame */}
      <div
        className="relative flex min-h-[896px] w-full max-w-[414px] flex-col overflow-hidden"
        style={{
          borderRadius: '40px',
          boxShadow:
            '0 0 0 12px #1a1a2e, 0 0 0 14px #333, 0 25px 50px rgba(0, 0, 0, 0.5)',
          background: theme.colors.bg,
          backgroundImage: theme.bgPattern,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-6 pt-12">
          <Link
            to="/"
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full text-3xl transition active:scale-95"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            🏠
          </Link>
          <h1
            className="text-3xl font-bold tracking-wide"
            style={{
              fontFamily: theme.fonts.heading,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Manage Children
          </h1>
          <div className="w-[60px]" /> {/* Spacer for centering */}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-6 pb-24">
          {/* Create New Button (if not editing) */}
          {editingId === null && (
            <button
              type="button"
              onClick={startCreate}
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-3xl py-4 text-xl font-bold transition active:scale-95"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.primary,
                border: `3px dashed ${theme.colors.primary}`,
                minHeight: '72px',
              }}
            >
              <span>➕</span> Add Child
            </button>
          )}

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
          <div className="space-y-4">
            {children.map((child) => {
              if (editingId === child.id) return null // Handled above

              const isSelected = activeChildId === child.id
              const childTheme = child.themeId
                ? THEME_ID_LOOKUP.get(child.themeId)
                : null

              return (
                <div
                  key={child.id}
                  className="relative mb-6 flex w-full flex-col gap-4 p-5 transition-all md:flex-row md:items-center md:justify-between"
                  style={{
                    borderRadius: '50px',
                    background: isSelected
                      ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                      : theme.colors.surface,
                    boxShadow: `0 0 20px ${theme.colors.primary}`,
                    border: `3px solid ${theme.colors.primary}`,
                    color: isSelected
                      ? theme.id === 'space'
                        ? '#000'
                        : '#FFF'
                      : theme.colors.text,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full text-4xl shadow-inner"
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(255,255,255,0.3)'
                          : 'rgba(0,0,0,0.1)',
                      }}
                    >
                      {childTheme ? childTheme.emoji : child.avatarToken}
                    </div>
                    <div>
                      <h3 className="text-xl leading-tight font-bold">
                        {child.displayName}
                      </h3>
                      <p
                        className="text-sm opacity-80"
                        style={{
                          color: isSelected
                            ? theme.id === 'space'
                              ? '#000'
                              : '#FFF'
                            : theme.colors.text,
                        }}
                      >
                        {child.totalStars} Stars • {childTheme?.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isSelected && (
                      <button
                        onClick={() => handleSelectExplorer(child.id)}
                        className="flex h-[60px] items-center rounded-full px-6 font-bold shadow-lg transition active:scale-95"
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: theme.id === 'space' ? '#000' : '#FFF',
                        }}
                      >
                        Select
                      </button>
                    )}
                    {isSelected && (
                      <div
                        className="flex h-[60px] items-center justify-center gap-2 rounded-full px-6 font-bold"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                        }}
                      >
                        <span>✅</span> Active
                      </div>
                    )}
                    <button
                      onClick={() => startEdit(child)}
                      className="flex h-[60px] items-center gap-2 rounded-full bg-black/10 px-4 font-bold transition hover:bg-black/20"
                      aria-label="Edit Child"
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(child.id)}
                      className="flex h-[60px] items-center gap-2 rounded-full bg-red-500/20 px-4 font-bold text-red-600 transition hover:bg-red-500/30"
                      style={{
                        color: isSelected ? '#900' : undefined,
                      }}
                      aria-label="Delete Child"
                    >
                      <span>🗑️</span> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ManageChildrenPage
