import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthContext'
import { awardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'

type ChildSummary = {
  id: string
  displayName: string
}

type TaskRecord = {
  id: string
  title: string
  childId: string
  starValue: 1 | 2 | 3
  category?: string
}

const TasksPage = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [awardErrors, setAwardErrors] = useState<Record<string, string>>({})
  const [recentlyAwarded, setRecentlyAwarded] = useState<
    Record<string, boolean>
  >({})

  useEffect(() => {
    if (!user) {
      setChildren([])
      setTasks([])
      return
    }

    const childQuery = query(
      collection(db, 'users', user.uid, 'children'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribeChildren = onSnapshot(childQuery, (snapshot) => {
      setChildren(
        snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            displayName: data.displayName ?? 'Explorer',
          }
        })
      )
    })

    const taskQuery = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
      setTasks(
        snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            title: data.title ?? 'Task',
            childId: data.childId ?? '',
            starValue: (data.starValue ?? 1) as 1 | 2 | 3,
            category: data.category ?? undefined,
          }
        })
      )
    })

    return () => {
      unsubscribeChildren()
      unsubscribeTasks()
    }
  }, [user])

  const childLookup = useMemo(() => {
    const map = new Map<string, string>()
    children.forEach((child) => map.set(child.id, child.displayName))
    return map
  }, [children])

  const handleAward = async (task: TaskRecord) => {
    if (!user || !task.childId) return

    setAwardErrors((prev) => ({ ...prev, [task.id]: '' }))
    setRecentlyAwarded((prev) => ({ ...prev, [task.id]: true }))

    try {
      await awardStars({
        userId: user.uid,
        childId: task.childId,
        delta: task.starValue,
      })
      celebrateSuccess()
    } catch (err) {
      setAwardErrors((prev) => ({
        ...prev,
        [task.id]:
          (err as Error)?.message ?? 'Unable to award stars for this task.',
      }))
      setRecentlyAwarded((prev) => ({ ...prev, [task.id]: false }))
      return
    }

    window.setTimeout(() => {
      setRecentlyAwarded((prev) => ({ ...prev, [task.id]: false }))
    }, 600)
  }

  const onCheckboxChange =
    (task: TaskRecord) => (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault()
      event.target.checked = false
      void handleAward(task)
    }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">
            Tasks
          </p>
          <h1 className="text-3xl font-semibold">
            Award stars with checklists
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tap a task to award its star value instantly with haptic and
            confetti feedback.
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
            to="/settings/manage-tasks"
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
          >
            Manage tasks
          </Link>
        </div>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
          No tasks yet. Create one in Settings to start your star-awarding
          checklist.
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const childName = childLookup.get(task.childId) ?? 'Unassigned'
            const recent = recentlyAwarded[task.id]

            return (
              <li
                key={task.id}
                className={`rounded-xl border p-4 transition ${
                  recent
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-400"
                    onChange={onCheckboxChange(task)}
                  />
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-100">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400">Child: {childName}</p>
                    {task.category && (
                      <p className="text-xs text-slate-500">
                        Category: {task.category}
                      </p>
                    )}
                    <p className="text-xs text-emerald-300">
                      Worth {task.starValue} star(s)
                    </p>
                    {awardErrors[task.id] && (
                      <p className="mt-2 text-xs text-red-300">
                        {awardErrors[task.id]}
                      </p>
                    )}
                  </div>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

export default TasksPage
