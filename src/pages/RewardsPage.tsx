import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { redeemReward } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'

type ChildProfile = {
  id: string
  displayName: string
  totalStars: number
  avatarToken: string
}

type RewardRecord = {
  id: string
  title: string
  costStars: number
}

type Celebration = {
  rewardTitle: string
  costStars: number
}

const RewardsPage = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [pendingAdjustments, setPendingAdjustments] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  useEffect(() => {
    if (!user) {
      setChildren([])
      setSelectedChildId('')
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
          displayName: data.displayName ?? 'Explorer',
          avatarToken: data.avatarToken ?? '⭐',
          totalStars: Number(data.totalStars ?? 0),
        }
      })

      setChildren(nextChildren)
      setPendingAdjustments((prev) => {
        if (Object.keys(prev).length === 0) return prev
        const next = { ...prev }
        nextChildren.forEach((child) => {
          next[child.id] = 0
        })
        return next
      })
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user) {
      setRewards([])
      return
    }

    const rewardsQuery = query(
      collection(db, 'users', user.uid, 'rewards'),
      orderBy('costStars', 'asc')
    )

    const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
      const nextRewards: RewardRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          title: data.title ?? 'Reward',
          costStars: Number(data.costStars ?? 0),
        }
      })

      setRewards(nextRewards)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (children.length === 0) {
      setSelectedChildId('')
      return
    }

    if (!children.some((child) => child.id === selectedChildId)) {
      setSelectedChildId(children[0].id)
    }
  }, [children, selectedChildId])

  const selectedChild = useMemo(
    () => children.find((child) => child.id === selectedChildId) ?? null,
    [children, selectedChildId]
  )

  const displayedStars = selectedChild
    ? selectedChild.totalStars + (pendingAdjustments[selectedChild.id] ?? 0)
    : 0

  const handleRedeem = async (reward: RewardRecord) => {
    if (!user || !selectedChild) return

    if (displayedStars < reward.costStars) {
      setError('Not enough stars to redeem this reward yet.')
      return
    }

    setError(null)
    setIsRedeeming(true)

    setPendingAdjustments((prev) => ({
      ...prev,
      [selectedChild.id]: (prev[selectedChild.id] ?? 0) - reward.costStars,
    }))

    try {
      await redeemReward({
        userId: user.uid,
        childId: selectedChild.id,
        reward,
      })
      celebrateSuccess()
      setCelebration({ rewardTitle: reward.title, costStars: reward.costStars })
    } catch (err) {
      setPendingAdjustments((prev) => ({
        ...prev,
        [selectedChild.id]: (prev[selectedChild.id] ?? 0) + reward.costStars,
      }))
      setError((err as Error)?.message ?? 'Unable to redeem reward right now.')
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">
            Rewards
          </p>
          <h1 className="text-3xl font-semibold">
            Redeem stars for celebrations
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Choose an explorer and exchange their hard-earned stars for exciting
            rewards.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            Back to home
          </Link>
          <Link
            to="/settings/manage-rewards"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            Manage rewards
          </Link>
        </div>
      </header>

      {children.length > 1 && (
        <section className="mb-6 space-y-2">
          <h2 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
            Select explorer
          </h2>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  selectedChildId === child.id
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                    : 'border-slate-700 text-slate-200 hover:border-emerald-400'
                }`}
              >
                <span className="mr-2" aria-hidden>
                  {child.avatarToken}
                </span>
                {child.displayName}
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {selectedChild ? (
          <p className="text-sm text-slate-400">
            {selectedChild.displayName} currently has{' '}
            <span className="font-semibold text-emerald-300">
              {displayedStars}
            </span>{' '}
            star(s).
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Add or select a child profile to start redeeming rewards.
          </p>
        )}

        {rewards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
            No rewards yet. Create some in Settings to motivate your explorers.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rewards.map((reward) => {
              const canRedeem = selectedChild
                ? displayedStars >= reward.costStars
                : false

              return (
                <article
                  key={reward.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm shadow-slate-950/20"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-100">
                      {reward.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Cost: {reward.costStars} star(s)
                    </p>
                    {!canRedeem && (
                      <p className="text-xs text-slate-500">
                        Earn {Math.max(reward.costStars - displayedStars, 0)}{' '}
                        more star(s) to redeem.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!selectedChild || !canRedeem || isRedeeming}
                    onClick={() => handleRedeem(reward)}
                    className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRedeeming ? 'Processing…' : 'Redeem'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {celebration && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center">
          <div className="space-y-4 rounded-2xl bg-slate-900/90 p-8 shadow-emerald-500/30">
            <span className="text-5xl" role="img" aria-label="Celebration">
              🎉
            </span>
            <h2 className="text-3xl font-semibold text-emerald-200">
              Reward redeemed!
            </h2>
            <p className="text-slate-300">
              {selectedChild?.displayName ?? 'Explorer'} traded{' '}
              {celebration.costStars} star(s) for{' '}
              <span className="font-semibold">{celebration.rewardTitle}</span>.
            </p>
            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="rounded-lg border border-emerald-400 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/10"
            >
              Back to rewards
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default RewardsPage
