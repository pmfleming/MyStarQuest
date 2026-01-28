import { useEffect, useState } from 'react'
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
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import ActionTextInput from '../components/ActionTextInput'
import StarCost from '../components/StarCost'
import RepeatControl from '../components/RepeatControl'
import ActionButton from '../components/ActionButton'
import { uiTokens } from '../ui/tokens'
import {
  princessBuyRewardIcon,
  princessSaveIcon,
  princessRewardsIcon,
  princessHomeIcon,
} from '../assets/themes/princess/assets'

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
    .min(0, 'Cost must be at least 0 stars')
    .max(10, 'Cost must be at most 10 stars'),
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
    costStars: 0,
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
      costStars: 0,
      isRepeating: true,
    })
    setFormErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ title: '', costStars: 0, isRepeating: true })
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
    <PageShell theme={theme}>
      <PageHeader
        title={
          editingId
            ? editingId === 'new'
              ? 'New Reward'
              : editForm.title || 'Reward'
            : 'Rewards'
        }
        fontFamily={theme.fonts.heading}
        right={
          editingId ? (
            <TopIconButton
              theme={theme}
              onClick={cancelEdit}
              ariaLabel="Rewards"
              icon={
                <img
                  src={princessRewardsIcon}
                  alt="Rewards"
                  className="h-10 w-10 object-contain"
                />
              }
            />
          ) : (
            <TopIconButton
              theme={theme}
              to="/"
              ariaLabel="Home"
              icon={
                <img
                  src={princessHomeIcon}
                  alt="Home"
                  className="h-10 w-10 object-contain"
                />
              }
            />
          )
        }
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto flex w-full flex-col"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {editingId ? (
            <div
              className="mb-6 flex flex-col"
              style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
            >
              {(formErrors[editingId]?.length ?? 0) > 0 && (
                <div className="rounded-xl bg-red-500/20 p-4 text-center text-sm font-bold text-red-200">
                  {formErrors[editingId]?.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div
                className="flex flex-col"
                style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
              >
                <ActionTextInput
                  theme={theme}
                  label="Reward"
                  value={editForm.title}
                  onChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      title: value,
                    }))
                  }
                  placeholder="e.g. Ice Cream"
                  maxLength={80}
                  baseColor={theme.colors.secondary}
                  inputAriaLabel="Reward name"
                />

                <StarCost
                  theme={theme}
                  value={editForm.costStars}
                  onChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      costStars: Math.max(0, Math.min(10, value)),
                    }))
                  }
                  maxStars={10}
                  label="Reward Cost"
                  showLabel={false}
                />

                <RepeatControl
                  theme={theme}
                  value={editForm.isRepeating}
                  onChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      isRepeating: value,
                    }))
                  }
                  label="Keep available after buying"
                  showLabel={false}
                  showFeedback={false}
                />
              </div>

              <ActionButton
                theme={theme}
                color={theme.colors.primary}
                label={isSubmitting ? 'Saving...' : 'Save'}
                icon={
                  <img
                    src={princessSaveIcon}
                    alt="Save"
                    className="h-10 w-10 object-contain"
                  />
                }
                onClick={() => saveReward(editingId)}
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <StandardActionList
              theme={theme}
              items={rewards}
              getKey={(reward) => reward.id}
              getStarCount={(reward) => reward.costStars}
              renderItem={(reward) => (
                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: `${uiTokens.actionButtonFontSize}px`,
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {reward.title}
                </div>
              )}
              primaryAction={{
                label: (reward) =>
                  activeChildStars >= reward.costStars
                    ? 'Buy Reward'
                    : 'Need Stars',
                icon: (reward) =>
                  activeChildStars >= reward.costStars ? (
                    <img
                      src={princessBuyRewardIcon}
                      alt="Buy Reward"
                      className="h-6 w-6 object-contain"
                    />
                  ) : (
                    '🔒'
                  ),
                onClick: (reward) => handleGiveReward(reward),
                disabled: (reward) => activeChildStars < reward.costStars,
                variant: 'primary',
                showLabel: false,
              }}
              onEdit={(reward) => startEdit(reward)}
              onDelete={(reward) => handleDelete(reward.id)}
              addLabel="New Reward"
              onAdd={startCreate}
              addDisabled={false}
              emptyState={
                <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                  No rewards yet.
                </div>
              }
            />
          )}
        </div>
      </main>
    </PageShell>
  )
}

export default ManageRewardsPage
