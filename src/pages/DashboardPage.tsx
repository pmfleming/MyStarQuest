import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { awardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'

type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
  themeId?: string
}

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const { activeChildId, setActiveChild } = useActiveChild()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [pendingDeltas, setPendingDeltas] = useState<Record<string, number>>({})
  const [isAwarding, setIsAwarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setChildren([])
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
          themeId: data.themeId,
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
    if (children.length === 0) {
      return
    }

    if (
      !activeChildId ||
      !children.some((child) => child.id === activeChildId)
    ) {
      const first = children[0]
      setActiveChild({ id: first.id, themeId: first.themeId || 'princess' })
    }
  }, [children, activeChildId, setActiveChild])

  const selectedChild = useMemo(
    () => children.find((child) => child.id === activeChildId) ?? null,
    [children, activeChildId]
  )

  const displayedStars = selectedChild
    ? selectedChild.totalStars + (pendingDeltas[selectedChild.id] ?? 0)
    : 0

  const handleAward = async (delta: number) => {
    if (!user || !activeChildId || delta <= 0) return

    setError(null)
    setIsAwarding(true)

    setPendingDeltas((prev) => ({
      ...prev,
      [activeChildId]: (prev[activeChildId] ?? 0) + delta,
    }))

    const start = performance.now()

    try {
      await awardStars({ userId: user.uid, childId: activeChildId, delta })
      const elapsed = performance.now() - start
      if (elapsed < 150) {
        await new Promise((resolve) => setTimeout(resolve, 150 - elapsed))
      }
      celebrateSuccess()
    } catch (err) {
      if (activeChildId) {
        setPendingDeltas((prev) => ({
          ...prev,
          [activeChildId]: Math.max((prev[activeChildId] ?? 0) - delta, 0),
        }))
      }
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
            {selectedChild
              ? `Award stars, monitor progress, and celebrate milestones for ${selectedChild.displayName}.`
              : 'Award stars, monitor progress, and celebrate milestones across every explorer.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Removed direct view links for tasks & rewards per request */}
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

      {error && (
        <div className="mb-4 rounded-lg border border-red-700 bg-red-900/30 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="max-w-sm">
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
      </section>
    </main>
  )
}

export default DashboardPage
