import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
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
  createdAt?: Date
}

const ManageChildrenPage = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [formValues, setFormValues] = useState({
    displayName: '',
    avatarToken: '',
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
          createdAt: data.createdAt?.toDate?.(),
        }
      })

      setChildren(nextChildren)
    })

    return unsubscribe
  }, [user])

  const heading = editingId ? 'Update Child Profile' : 'Add Child Profile'

  const resetForm = () => {
    setFormValues({ displayName: '', avatarToken: '' })
    setFormErrors([])
    setEditingId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const parsed = childSchema.safeParse(formValues)

    if (!parsed.success) {
      setFormErrors(parsed.error.issues.map((issue) => issue.message))
      return
    }

    setIsSubmitting(true)
    setFormErrors([])

    const childCollection = collection(db, 'users', user.uid, 'children')

    try {
      if (editingId) {
        await updateDoc(doc(childCollection, editingId), {
          displayName: parsed.data.displayName,
          avatarToken: parsed.data.avatarToken,
        })
      } else {
        await addDoc(childCollection, {
          displayName: parsed.data.displayName,
          avatarToken: parsed.data.avatarToken,
          totalStars: 0,
          createdAt: serverTimestamp(),
        })
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save child profile', error)
      setFormErrors(['Unable to save child profile. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (child: ChildProfile) => {
    setEditingId(child.id)
    setFormValues({
      displayName: child.displayName,
      avatarToken: child.avatarToken,
    })
    setFormErrors([])
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this child profile?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'children'), id))
    } catch (error) {
      console.error('Failed to delete child profile', error)
      setFormErrors(['Unable to delete child profile. Please try again.'])
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

      <section className="grid gap-6 md:grid-cols-[minmax(0,360px)_1fr]">
        <article className="space-y-4 rounded-xl bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="text-sm text-slate-400">
            Store only a display name and fun avatar token (emoji or colour).
            Photos or other identifying details are not collected.
          </p>

          {formErrors.length > 0 && (
            <ul className="space-y-2 rounded-lg border border-red-700 bg-red-900/30 p-4 text-sm text-red-200">
              {formErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium">
              Display name
              <input
                type="text"
                value={formValues.displayName}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    displayName: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                placeholder="e.g. Star Captain"
                autoComplete="off"
                maxLength={40}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Avatar token
              <input
                type="text"
                value={formValues.avatarToken}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    avatarToken: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                placeholder="e.g. 🚀 or Lavender"
                autoComplete="off"
                maxLength={12}
                required
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                >
                  Cancel
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  Total stars start at 0.
                </span>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? 'Saving…'
                  : editingId
                    ? 'Update profile'
                    : 'Create profile'}
              </button>
            </div>
          </form>
        </article>

        <article className="space-y-4 rounded-xl bg-slate-900/50 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Child profiles</h2>
            <span className="text-xs tracking-wide text-slate-500 uppercase">
              {childCountLabel}
            </span>
          </div>

          {children.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              No child profiles yet. Add one using the form to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {children.map((child) => (
                <li
                  key={child.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-100">
                      {child.displayName}{' '}
                      <span className="ml-1 text-sm text-emerald-300">
                        {child.avatarToken}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Total stars: {child.totalStars ?? 0}
                    </p>
                  </div>

                  <div className="flex gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => startEdit(child)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(child.id)}
                      className="rounded-lg border border-red-600 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-400 hover:text-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  )
}

export default ManageChildrenPage
