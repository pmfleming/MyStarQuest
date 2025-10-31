import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { awardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'

type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
}

type RewardRecord = {
  id: string
  title: string
  costStars: number
}

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [rewards, setRewards] = useState<RewardRecord[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [pendingDeltas, setPendingDeltas] = useState<Record<string, number>>({})
  const [isAwarding, setIsAwarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setChildren([])
      setSelectedChildId('')
      return
    }

    const childrenQuery = query(
      collection(db, 'users', user.uid, 'children'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(childrenQuery, (snapshot) => {
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
      setPendingDeltas((prev) => {
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
    ? selectedChild.totalStars + (pendingDeltas[selectedChild.id] ?? 0)
    : 0

  const nearestReward = useMemo(() => {
    if (!selectedChild || rewards.length === 0) {
      return null
    }

    const sorted = [...rewards].sort((a, b) => a.costStars - b.costStars)
    const upcoming = sorted.find((reward) => reward.costStars > displayedStars)

    if (upcoming) {
      return {
        reward: upcoming,
        shortfall: Math.max(upcoming.costStars - displayedStars, 0),
      }
    }

    const bestAffordable = sorted
      .filter((reward) => reward.costStars <= displayedStars)
      .pop()

    if (bestAffordable) {
      return {
        reward: bestAffordable,
        shortfall: 0,
      }
    }

    return {
      reward: sorted[0],
      shortfall: Math.max(sorted[0].costStars - displayedStars, 0),
    }
  }, [rewards, selectedChild, displayedStars])

  const handleAward = async (delta: number) => {
    if (!user || !selectedChildId || delta <= 0) return

    setError(null)
    setIsAwarding(true)

    setPendingDeltas((prev) => ({
      ...prev,
      [selectedChildId]: (prev[selectedChildId] ?? 0) + delta,
    }))

    const start = performance.now()

    try {
      await awardStars({ userId: user.uid, childId: selectedChildId, delta })
      const elapsed = performance.now() - start
      if (elapsed < 150) {
        await new Promise((resolve) => setTimeout(resolve, 150 - elapsed))
      }
      celebrateSuccess()
    } catch (err) {
      setPendingDeltas((prev) => ({
        ...prev,
        [selectedChildId]: Math.max((prev[selectedChildId] ?? 0) - delta, 0),
      }))
      setError(
        (err as Error)?.message ?? 'Unable to award stars. Please try again.'
      )
    } finally {
      setIsAwarding(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">Home</p>
          <h1 className="text-3xl font-semibold">
            {selectedChild
              ? `Mission control for ${selectedChild.displayName}`
              : 'Mission control'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Award stars, monitor progress, and celebrate milestones across every
            explorer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tasks"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            View tasks
          </Link>
          <Link
            to="/rewards"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            View rewards
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/settings/manage-children"
              className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 uppercase transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Manage children
            </Link>
            <Link
              to="/settings/manage-tasks"
              className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 uppercase transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Manage tasks
            </Link>
            <Link
              to="/settings/manage-rewards"
              className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs font-semibold tracking-wide text-slate-300 uppercase transition hover:border-emerald-400 hover:text-emerald-200"
            >
              Manage rewards
            </Link>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-300"
          >
            Sign out
          </button>
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

      <section className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <article className="space-y-4 rounded-xl bg-slate-900/70 p-6 shadow-lg shadow-slate-950/30">
          <h2 className="text-xl font-semibold">Star balance</h2>
          {selectedChild ? (
            <>
              <p className="text-5xl font-bold text-emerald-300">
                {displayedStars.toLocaleString()}{' '}
                <span className="text-base font-medium text-slate-400">
                  stars
                </span>
              </p>
              <button
                type="button"
                onClick={() => handleAward(1)}
                disabled={isAwarding || !selectedChild}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-lg font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAwarding ? 'Awarding…' : 'Award star'}
              </button>
              <p className="text-xs text-slate-500">
                Rewards update instantly thanks to optimistic feedback.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Add a child profile to start awarding stars.
            </p>
          )}
        </article>

        <article className="space-y-4 rounded-xl bg-slate-900/50 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Nearest reward</h2>
            <Link
              to="/rewards"
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              Browse rewards
            </Link>
          </div>
          {selectedChild ? (
            nearestReward ? (
              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-lg font-semibold text-slate-100">
                  {nearestReward.reward.title}
                </p>
                <p className="text-sm text-slate-400">
                  Cost: {nearestReward.reward.costStars} star(s)
                </p>
                {nearestReward.shortfall > 0 ? (
                  <p className="text-sm text-amber-300">
                    {nearestReward.shortfall} more star(s) to unlock this
                    reward.
                  </p>
                ) : (
                  <p className="text-sm text-emerald-300">Ready to redeem!</p>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
                No rewards yet. Add one to give your explorer something to aim
                for.
              </p>
            )
          ) : (
            <p className="text-sm text-slate-400">
              Select a child to see upcoming rewards.
            </p>
          )}
        </article>
      </section>
    </main>
  )
}

export default DashboardPage
