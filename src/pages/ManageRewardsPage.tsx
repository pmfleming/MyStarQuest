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
import { useTheme } from '../contexts/ThemeContext'
import { redeemReward } from '../services/starActions'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import EditableStarDisplay from '../components/EditableStarDisplay'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import { uiTokens } from '../ui/tokens'
import {
  princessBuyRewardIcon,
  princessHomeIcon,
} from '../assets/themes/princess/assets'

type RewardRecord = {
  id: string
  title: string
  costStars: number
  isRepeating: boolean
  createdAt?: Date
}

const ManageRewardsPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [activeChildStars, setActiveChildStars] = useState<number>(0)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!user) {
      setRewards([])
      return
    }

    const rewardsQuery = query(
      collection(db, 'users', user.uid, 'rewards'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
      const newRewards = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          title: data.title ?? '',
          costStars: data.costStars ?? 0,
          isRepeating: data.isRepeating ?? false,
          createdAt: data.createdAt?.toDate?.(),
        }
      })

      setRewards(newRewards)

      setTitleDrafts((prev) => {
        const next = { ...prev }
        for (const reward of newRewards) {
          if (!(reward.id in next)) {
            next[reward.id] = reward.title
          }
        }
        return next
      })
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

  const updateRewardField = async (
    rewardId: string,
    field: Partial<Pick<RewardRecord, 'title' | 'costStars' | 'isRepeating'>>
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'rewards'), rewardId),
        field
      )
    } catch (error) {
      console.error('Failed to update reward', error)
    }
  }

  const commitTitle = (rewardId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateRewardField(rewardId, { title: trimmed })
      return
    }

    const saved = rewards.find((reward) => reward.id === rewardId)
    if (saved) {
      setTitleDrafts((prev) => ({ ...prev, [rewardId]: saved.title }))
    }
  }

  const handleCreate = async () => {
    if (!user) return
    try {
      await addDoc(collection(db, 'users', user.uid, 'rewards'), {
        title: '',
        costStars: 0,
        isRepeating: true,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Failed to create reward', error)
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

    setIsRedeeming(true)
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
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this reward?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'rewards'), id))
      setTitleDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (error) {
      console.error('Failed to delete reward', error)
    }
  }

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Rewards"
        fontFamily={theme.fonts.heading}
        right={
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
        }
      />

      <main className="flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto flex w-full flex-col"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          <StandardActionList
            theme={theme}
            items={rewards}
            getKey={(reward) => reward.id}
            renderItem={(reward) => (
              <div
                className="flex flex-col"
                style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
              >
                <ActionTextInput
                  theme={theme}
                  label="Reward"
                  value={titleDrafts[reward.id] ?? reward.title}
                  onChange={(value) =>
                    setTitleDrafts((prev) => ({
                      ...prev,
                      [reward.id]: value,
                    }))
                  }
                  onCommit={(value) => commitTitle(reward.id, value)}
                  maxLength={80}
                  baseColor={theme.colors.secondary}
                  inputAriaLabel="Reward name"
                  transparent
                />

                <EditableStarDisplay
                  theme={theme}
                  count={reward.costStars}
                  editable
                  onChange={(value) =>
                    updateRewardField(reward.id, {
                      costStars: Math.max(0, Math.min(10, value)),
                    })
                  }
                  min={0}
                  max={10}
                />

                <RepeatControl
                  theme={theme}
                  value={reward.isRepeating}
                  onChange={(value) =>
                    updateRewardField(reward.id, { isRepeating: value })
                  }
                  label="Keep available after buying"
                  showLabel={false}
                  showFeedback={false}
                />
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
              disabled: (reward) =>
                isRedeeming ||
                !activeChildId ||
                activeChildStars < reward.costStars,
              variant: 'primary',
              showLabel: false,
            }}
            hideEdit
            onDelete={(reward) => handleDelete(reward.id)}
            addLabel="New Reward"
            onAdd={handleCreate}
            addDisabled={false}
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                No rewards yet.
              </div>
            }
          />
        </div>
      </main>
    </PageShell>
  )
}

export default ManageRewardsPage
