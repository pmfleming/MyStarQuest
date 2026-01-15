import { useEffect, useState } from 'react'
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
import { useTheme } from '../contexts/ThemeContext'
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
  const { theme } = useTheme()
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
            Rewards
          </h1>
          <div
            className="flex h-[60px] items-center gap-2 rounded-full px-6 font-bold"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.primary,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <span className="text-2xl">⭐</span>
            <span className="text-2xl">{activeChildStars}</span>
          </div>
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
              <span>➕</span> New Reward
            </button>
          )}

          {/* Edit/Create Form */}
          {(editingId === 'new' || editingId !== null) &&
            rewards.find((r) => r.id === editingId) && (
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
                  {editingId === 'new' ? 'New Reward' : 'Edit Reward'}
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
                      What is the reward?
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border-none px-4 py-3 text-lg font-bold text-slate-900 focus:ring-4"
                      style={{
                        backgroundColor: '#FFF',
                        minHeight: '60px',
                      }}
                      placeholder="e.g. Ice Cream"
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold opacity-80">
                      Cost (Stars)
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            costStars: Math.max(1, prev.costStars - 1),
                          }))
                        }
                        className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-3xl font-bold transition active:scale-90"
                        style={{
                          backgroundColor: theme.colors.secondary,
                          color: '#FFF',
                        }}
                      >
                        -
                      </button>
                      <div className="flex h-[60px] flex-1 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-900">
                        {editForm.costStars} ⭐
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            costStars: Math.min(99, prev.costStars + 1),
                          }))
                        }
                        className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-3xl font-bold transition active:scale-90"
                        style={{
                          backgroundColor: theme.colors.secondary,
                          color: '#FFF',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-4 rounded-2xl bg-black/20 p-4">
                    <input
                      type="checkbox"
                      checked={editForm.isRepeating}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isRepeating: e.target.checked,
                        }))
                      }
                      className="h-8 w-8 rounded-lg border-2"
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <span className="text-lg font-bold">
                      Keep after buying?
                    </span>
                  </label>
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
                    onClick={() => saveReward(editingId || 'new')}
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

          {/* Create Form for New Item (if editingId is 'new') */}
          {editingId === 'new' && !rewards.find((r) => r.id === editingId) && (
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
                New Reward
              </h3>

              {/* Error Display */}
              {(formErrors['new']?.length ?? 0) > 0 && (
                <div className="rounded-xl bg-red-500/20 p-4 text-center text-sm font-bold text-red-200">
                  {formErrors['new']?.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold opacity-80">
                    What is the reward?
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border-none px-4 py-3 text-lg font-bold text-slate-900 focus:ring-4"
                    style={{
                      backgroundColor: '#FFF',
                      minHeight: '60px',
                    }}
                    placeholder="e.g. Ice Cream"
                    maxLength={80}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold opacity-80">
                    Cost (Stars)
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          costStars: Math.max(1, prev.costStars - 1),
                        }))
                      }
                      className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-3xl font-bold transition active:scale-90"
                      style={{
                        backgroundColor: theme.colors.secondary,
                        color: '#FFF',
                      }}
                    >
                      -
                    </button>
                    <div className="flex h-[60px] flex-1 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-900">
                      {editForm.costStars} ⭐
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          costStars: Math.min(99, prev.costStars + 1),
                        }))
                      }
                      className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-3xl font-bold transition active:scale-90"
                      style={{
                        backgroundColor: theme.colors.secondary,
                        color: '#FFF',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-4 rounded-2xl bg-black/20 p-4">
                  <input
                    type="checkbox"
                    checked={editForm.isRepeating}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isRepeating: e.target.checked,
                      }))
                    }
                    className="h-8 w-8 rounded-lg border-2"
                    style={{ accentColor: theme.colors.primary }}
                  />
                  <span className="text-lg font-bold">Keep after buying?</span>
                </label>
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
                  onClick={() => saveReward('new')}
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

          {/* Rewards List */}
          <div className="space-y-6">
            {rewards.map((reward) => {
              if (editingId === reward.id) return null // Handled above

              const canAfford = activeChildStars >= reward.costStars
              return (
                <div
                  key={reward.id}
                  className="relative flex flex-col gap-4 p-6 transition-all"
                  style={{
                    borderRadius: '50px',
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    boxShadow: `0 0 20px ${theme.colors.primary}`,
                    color: theme.id === 'space' ? '#000' : '#FFF',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl leading-tight font-bold">
                        {reward.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-lg font-bold opacity-90">
                          {reward.costStars} Star{reward.costStars !== 1 && 's'}
                        </span>
                        {reward.isRepeating && (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-sm"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.3)',
                              color: 'inherit',
                            }}
                          >
                            ∞ Forever
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => startEdit(reward)}
                        className="flex h-[60px] items-center justify-center gap-2 rounded-full bg-black/10 px-6 font-bold transition hover:bg-black/20"
                        aria-label="Edit Reward"
                      >
                        <span>✏️</span> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
                        className="flex h-[60px] items-center justify-center gap-2 rounded-full bg-red-500/20 px-6 font-bold text-red-700 transition hover:bg-red-500/30"
                        style={{ color: '#900' }}
                        aria-label="Delete Reward"
                      >
                        <span>🗑️</span> Delete
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGiveReward(reward)}
                    disabled={!canAfford}
                    className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-xl font-bold shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: canAfford
                        ? theme.colors.surface
                        : 'rgba(0,0,0,0.2)',
                      color: canAfford ? theme.colors.text : 'inherit',
                      minHeight: '72px',
                    }}
                  >
                    {canAfford ? '🎁 Buy Reward' : '🔒 Need more stars'}
                  </button>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ManageRewardsPage
