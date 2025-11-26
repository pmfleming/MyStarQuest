import { useEffect, useMemo, useState } from 'react'
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

  const childCountLabel = useMemo(() => {
    return children.length === 1
      ? '1 child profile'
      : `${children.length} child profiles`
  }, [children.length])

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">Manage Children</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage child profiles without sharing personal details.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          Back to dashboard
        </Link>
      </header>

      <section className="max-w-4xl">
        <article className="space-y-4 rounded-xl bg-slate-900/50 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Child profiles</h2>
            <span className="text-xs tracking-wide text-slate-500 uppercase">
              {childCountLabel}
            </span>
          </div>

          {children.length === 0 && editingId !== 'new' ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                No child profiles yet. Click "Create Profile" to add one.
              </p>
              <button
                type="button"
                onClick={startCreate}
                className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Create Profile
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {children.map((child) => {
                const theme = child.themeId
                  ? THEME_ID_LOOKUP.get(child.themeId)
                  : null
                const isEditing = editingId === child.id
                const errors = formErrors[child.id]

                if (isEditing) {
                  return (
                    <li
                      key={child.id}
                      className="space-y-3 rounded-lg border-2 border-emerald-500 bg-slate-900/80 p-4"
                    >
                      {errors && errors.length > 0 && (
                        <div className="rounded border border-red-700 bg-red-900/30 p-2 text-xs text-red-200">
                          {errors.map((err) => (
                            <p key={err}>{err}</p>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="font-medium text-slate-300">
                            Display name
                          </span>
                          <input
                            type="text"
                            value={editForm.displayName}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                displayName: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                            placeholder="e.g. Star Captain"
                            maxLength={40}
                          />
                        </label>

                        <fieldset className="space-y-2">
                          <legend className="text-sm font-medium text-slate-300">
                            Choose Theme
                          </legend>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                                  editForm.themeId === option.id
                                    ? 'border-emerald-500 bg-emerald-500/20'
                                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                                }`}
                              >
                                <span
                                  className="text-3xl"
                                  role="img"
                                  aria-label={option.label}
                                >
                                  {option.emoji}
                                </span>
                                <span className="text-xs font-medium text-slate-300">
                                  {option.label}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {option.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveProfile(child.id)}
                          disabled={isSubmitting}
                          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSubmitting ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSubmitting}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      </div>
                    </li>
                  )
                }

                return (
                  <li
                    key={child.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl" role="img">
                        {theme ? theme.emoji : child.avatarToken}
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-100">
                          {child.displayName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {theme && (
                            <span className="mr-2 text-emerald-300">
                              {theme.label}
                            </span>
                          )}
                          Total stars: {child.totalStars ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 self-end md:self-auto">
                      {activeChildId !== child.id && (
                        <button
                          type="button"
                          onClick={() => handleSelectExplorer(child.id)}
                          disabled={editingId !== null}
                          className="rounded-lg border border-emerald-600 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Select Explorer
                        </button>
                      )}
                      {activeChildId === child.id && (
                        <span className="flex items-center gap-1 rounded-lg border border-emerald-500 bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-300">
                          <svg
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Selected
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(child)}
                        disabled={editingId !== null}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(child.id)}
                        disabled={editingId !== null}
                        className="rounded-lg border border-red-600 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-400 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}

              {editingId === 'new' && (
                <li className="space-y-3 rounded-lg border-2 border-emerald-500 bg-slate-900/80 p-4">
                  {formErrors['new'] && formErrors['new'].length > 0 && (
                    <div className="rounded border border-red-700 bg-red-900/30 p-2 text-xs text-red-200">
                      {formErrors['new'].map((err) => (
                        <p key={err}>{err}</p>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm">
                      <span className="font-medium text-slate-300">
                        Display name
                      </span>
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            displayName: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                        placeholder="e.g. Star Captain"
                        maxLength={40}
                      />
                    </label>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-slate-300">
                        Choose Theme
                      </legend>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                            className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
                              editForm.themeId === option.id
                                ? 'border-emerald-500 bg-emerald-500/20'
                                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                            }`}
                          >
                            <span
                              className="text-3xl"
                              role="img"
                              aria-label={option.label}
                            >
                              {option.emoji}
                            </span>
                            <span className="text-xs font-medium text-slate-300">
                              {option.label}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {option.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveProfile('new')}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? 'Creating…' : 'Create Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              )}

              {editingId === null && (
                <li>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="w-full rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/40 px-4 py-4 text-sm font-medium text-slate-300 transition hover:border-emerald-500 hover:bg-slate-900/60 hover:text-emerald-300"
                  >
                    + Create Profile
                  </button>
                </li>
              )}
            </ul>
          )}
        </article>
      </section>
    </main>
  )
}

export default ManageChildrenPage
