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
import { useActiveChild } from '../contexts/ActiveChildContext'
import { redeemReward } from '../services/starActions'

type RewardRecord = {
  id: string
  title: string
  costStars: number
  isRepeating: boolean
  createdAt?: Date
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
  isRepeating: z.boolean().default(false),
})

const ManageRewardsPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [activeChildStars, setActiveChildStars] = useState<number>(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    costStars: 1,
    isRepeating: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
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
            isRepeating: data.isRepeating ?? false,
            createdAt: data.createdAt?.toDate?.(),
          }
        })
      )
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user || !activeChildId) {
      setActiveChildStars(0)
      return
    }

    const childRef = doc(db, 'users', user.uid, 'children', activeChildId)
    const unsubscribe = onSnapshot(childRef, (snapshot) => {
      const data = snapshot.data()
      setActiveChildStars(data?.totalStars ?? 0)
    })

    return unsubscribe
  }, [user, activeChildId])

  const startEdit = (reward: RewardRecord) => {
    setEditingId(reward.id)
    setEditForm({
      title: reward.title,
      costStars: reward.costStars,
      isRepeating: reward.isRepeating,
    })
    setFormErrors({})
  }

  const startCreate = () => {
    if (!user) return
    setEditingId('new')
    setEditForm({
      title: '',
      costStars: 1,
      isRepeating: true,
    })
    setFormErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ title: '', costStars: 1, isRepeating: true })
    setFormErrors({})
  }

  const saveReward = async (id: string) => {
    if (!user) return

    const parsed = rewardSchema.safeParse({
      title: editForm.title,
      costStars: Number(editForm.costStars),
      isRepeating: editForm.isRepeating,
    })

    if (!parsed.success) {
      setFormErrors({
        [id]: parsed.error.issues.map((issue) => issue.message),
      })
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    const rewardsCollection = collection(db, 'users', user.uid, 'rewards')

    try {
      if (id === 'new') {
        await addDoc(rewardsCollection, {
          ...parsed.data,
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(rewardsCollection, id), parsed.data)
      }

      cancelEdit()
    } catch (error) {
      console.error('Failed to save reward', error)
      setFormErrors({
        [id]: ['Unable to save reward. Please try again.'],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGiveReward = async (reward: RewardRecord) => {
    if (!user || !activeChildId) {
      alert('Please select a child from the dashboard first.')
      return
    }

    const confirmGive = window.confirm(
      `Give "${reward.title}" to the active child for ${reward.costStars} stars?`
    )
    if (!confirmGive) return

    try {
      await redeemReward({
        userId: user.uid,
        childId: activeChildId,
        reward,
      })

      if (!reward.isRepeating) {
        await deleteDoc(
          doc(collection(db, 'users', user.uid, 'rewards'), reward.id)
        )
      }

      alert('Reward given successfully!')
    } catch (error) {
      console.error('Failed to give reward', error)
      const message =
        error instanceof Error ? error.message : 'Failed to give reward'
      alert(message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this reward?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'rewards'), id))
    } catch (error) {
      console.error('Failed to delete reward', error)
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
            Create rewards that children can exchange stars for.
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
            <h2 className="text-xl font-semibold">Rewards</h2>
            <span className="text-xs tracking-wide text-slate-500 uppercase">
              {rewardCountLabel}
            </span>
          </div>

          {rewards.length === 0 && editingId !== 'new' ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                No rewards yet. Click "Create Reward" to add one.
              </p>
              <button
                type="button"
                onClick={startCreate}
                className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Create Reward
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {rewards.map((reward) => {
                const isEditing = editingId === reward.id
                const errors = formErrors[reward.id]
                const canAfford = activeChildStars >= reward.costStars

                if (isEditing) {
                  return (
                    <li
                      key={reward.id}
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
                            Reward title
                          </span>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                            placeholder="e.g. Movie night coupon"
                            maxLength={80}
                          />
                        </label>

                        <label className="block text-sm">
                          <span className="font-medium text-slate-300">
                            Cost (stars)
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={editForm.costStars}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                costStars: Number(e.target.value) || 1,
                              }))
                            }
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                          />
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.isRepeating}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                isRepeating: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                          />
                          <span className="text-sm font-medium text-slate-300">
                            Repeating Reward
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveReward(reward.id)}
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
                    key={reward.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-slate-100">
                          {reward.title}
                        </p>
                        {reward.isRepeating && (
                          <span className="rounded-full bg-blue-900/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-200 uppercase">
                            Repeating
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-300">
                        Costs {reward.costStars} star
                        {reward.costStars !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => handleGiveReward(reward)}
                        disabled={editingId !== null || !canAfford}
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          canAfford
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {canAfford ? 'Give Reward' : 'Not enough stars'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(reward)}
                        disabled={editingId !== null}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(reward.id)}
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
                        Reward title
                      </span>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                        placeholder="e.g. Movie night coupon"
                        maxLength={80}
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="font-medium text-slate-300">
                        Cost (stars)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={editForm.costStars}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            costStars: Number(e.target.value) || 1,
                          }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                      />
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.isRepeating}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            isRepeating: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-sm font-medium text-slate-300">
                        Repeating Reward
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveReward('new')}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? 'Creating…' : 'Create Reward'}
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
                    + Create Reward
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

export default ManageRewardsPage
