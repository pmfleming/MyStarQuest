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

type RewardRecord = {
  id: string
  title: string
  costStars: number
}

const rewardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(80, 'Title must be under 80 characters'),
  costStars: z
    .number()
    .int('Cost must be a whole number')
    .min(1, 'Cost must be at least 1 star')
    .max(99, 'Cost must be fewer than 100 stars'),
})

const ManageRewardsPage = () => {
  const { user } = useAuth()
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [formValues, setFormValues] = useState({ title: '', costStars: 1 })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      setRewards([])
      return
    }

    const rewardsQuery = query(
      collection(db, 'users', user.uid, 'rewards'),
      orderBy('title', 'asc')
    )

    const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
      setRewards(
        snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            title: data.title ?? 'Untitled reward',
            costStars: data.costStars ?? 1,
          }
        })
      )
    })

    return unsubscribe
  }, [user])

  const heading = editingId ? 'Update Reward' : 'Add Reward'

  const resetForm = () => {
    setFormValues({ title: '', costStars: 1 })
    setFormErrors([])
    setEditingId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const parsed = rewardSchema.safeParse({
      title: formValues.title,
      costStars: Number(formValues.costStars),
    })

    if (!parsed.success) {
      setFormErrors(parsed.error.issues.map((issue) => issue.message))
      return
    }

    setIsSubmitting(true)
    setFormErrors([])

    const rewardsCollection = collection(db, 'users', user.uid, 'rewards')

    try {
      if (editingId) {
        await updateDoc(doc(rewardsCollection, editingId), parsed.data)
      } else {
        await addDoc(rewardsCollection, {
          ...parsed.data,
          createdAt: serverTimestamp(),
        })
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save reward', error)
      setFormErrors(['Unable to save reward. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (reward: RewardRecord) => {
    setEditingId(reward.id)
    setFormValues({ title: reward.title, costStars: reward.costStars })
    setFormErrors([])
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    const confirmDelete = window.confirm('Delete this reward?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'rewards'), id))
    } catch (error) {
      console.error('Failed to delete reward', error)
      setFormErrors(['Unable to delete reward. Please try again.'])
    }
  }

  const rewardCountLabel = useMemo(() => {
    return rewards.length === 1 ? '1 reward' : `${rewards.length} rewards`
  }, [rewards.length])

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">Manage Rewards</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create rewards that children can exchange stars for. Only store
            titles and star costs.
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
            Keep rewards simple and privacy-safe: a name and how many stars they
            cost.
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
              Title
              <input
                type="text"
                value={formValues.title}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                placeholder="e.g. Movie night coupon"
                autoComplete="off"
                maxLength={80}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Cost (stars)
              <input
                type="number"
                min={1}
                max={99}
                value={formValues.costStars}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    costStars: Number(event.target.value) || 1,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
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
                  Stars required must stay under 100.
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
                    ? 'Update reward'
                    : 'Create reward'}
              </button>
            </div>
          </form>
        </article>

        <article className="space-y-4 rounded-xl bg-slate-900/50 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rewards</h2>
            <span className="text-xs tracking-wide text-slate-500 uppercase">
              {rewardCountLabel}
            </span>
          </div>

          {rewards.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              No rewards yet. Create one to motivate star collection.
            </p>
          ) : (
            <ul className="space-y-3">
              {rewards.map((reward) => (
                <li
                  key={reward.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-100">
                      {reward.title}
                    </p>
                    <p className="text-xs text-emerald-300">
                      Costs {reward.costStars} star(s)
                    </p>
                  </div>

                  <div className="flex gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => startEdit(reward)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reward.id)}
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

export default ManageRewardsPage
