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

type ChildSummary = {
  id: string
  displayName: string
}

type TaskRecord = {
  id: string
  title: string
  childId: string
  category: string
  starValue: 1 | 2 | 3
  createdAt?: Date
}

const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(80, 'Title must be under 80 characters'),
  childId: z.string().trim().min(1, 'Select a child'),
  category: z
    .string()
    .trim()
    .max(40, 'Category must be under 40 characters')
    .optional(),
  starValue: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

const ManageTasksPage = () => {
  const { user } = useAuth()
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [formValues, setFormValues] = useState({
    title: '',
    childId: '',
    category: '',
    starValue: 1 as 1 | 2 | 3,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            displayName: data.displayName ?? 'Unnamed child',
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
            title: data.title ?? 'Untitled task',
            childId: data.childId ?? '',
            category: data.category ?? '',
            starValue: (data.starValue ?? 1) as 1 | 2 | 3,
            createdAt: data.createdAt?.toDate?.(),
          }
        })
      )
    })

    return () => {
      unsubscribeChildren()
      unsubscribeTasks()
    }
  }, [user])

  useEffect(() => {
    if (children.length === 0) {
      setFormValues((prev) => ({ ...prev, childId: '' }))
      return
    }

    if (!editingId && formValues.childId === '') {
      setFormValues((prev) => ({ ...prev, childId: children[0].id }))
    }
  }, [children, editingId, formValues.childId])

  const heading = editingId ? 'Update Task' : 'Add Task'

  const resetForm = () => {
    setFormValues({ title: '', childId: '', category: '', starValue: 1 })
    setFormErrors([])
    setEditingId(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const parsed = taskSchema.safeParse({
      ...formValues,
      category:
        formValues.category.trim() === '' ? undefined : formValues.category,
    })

    if (!parsed.success) {
      setFormErrors(parsed.error.issues.map((issue) => issue.message))
      return
    }

    setIsSubmitting(true)
    setFormErrors([])

    const tasksCollection = collection(db, 'users', user.uid, 'tasks')

    try {
      if (editingId) {
        await updateDoc(doc(tasksCollection, editingId), {
          title: parsed.data.title,
          childId: parsed.data.childId,
          category: parsed.data.category ?? '',
          starValue: parsed.data.starValue,
        })
      } else {
        await addDoc(tasksCollection, {
          title: parsed.data.title,
          childId: parsed.data.childId,
          category: parsed.data.category ?? '',
          starValue: parsed.data.starValue,
          createdAt: serverTimestamp(),
        })
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save task', error)
      setFormErrors(['Unable to save task. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (task: TaskRecord) => {
    setEditingId(task.id)
    setFormValues({
      title: task.title,
      childId: task.childId,
      category: task.category,
      starValue: task.starValue,
    })
    setFormErrors([])
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    const confirmDelete = window.confirm('Delete this task?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
    } catch (error) {
      console.error('Failed to delete task', error)
      setFormErrors(['Unable to delete task. Please try again.'])
    }
  }

  const childOptions = useMemo(() => {
    return children.map((child) => (
      <option key={child.id} value={child.id}>
        {child.displayName}
      </option>
    ))
  }, [children])

  const childLookup = useMemo(() => {
    const map = new Map<string, string>()
    children.forEach((child) => {
      map.set(child.id, child.displayName)
    })
    return map
  }, [children])

  const tasksCountLabel = useMemo(() => {
    return tasks.length === 1 ? '1 task' : `${tasks.length} tasks`
  }, [tasks.length])

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">Manage Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">
            Link tasks to child profiles and set star rewards. No personal
            information is collected.
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
            Define clear, privacy-safe tasks. Choose a child, optional category,
            and star value (1-3).
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
                placeholder="e.g. Complete homework"
                autoComplete="off"
                maxLength={80}
                required
              />
            </label>

            <label className="block text-sm font-medium">
              Assigned child
              <select
                value={formValues.childId}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    childId: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                required
                disabled={children.length === 0}
              >
                <option value="" disabled>
                  {children.length === 0
                    ? 'Add a child profile first'
                    : 'Select a child'}
                </option>
                {childOptions}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Category (optional)
              <input
                type="text"
                value={formValues.category}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                placeholder="e.g. Chores"
                autoComplete="off"
                maxLength={40}
              />
            </label>

            <label className="block text-sm font-medium">
              Star value
              <select
                value={formValues.starValue}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    starValue: Number(event.target.value) as 1 | 2 | 3,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                required
              >
                <option value={1}>1 star</option>
                <option value={2}>2 stars</option>
                <option value={3}>3 stars</option>
              </select>
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
                  Assign tasks to drive consistent habits.
                </span>
              )}

              <button
                type="submit"
                disabled={isSubmitting || children.length === 0}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? 'Saving…'
                  : editingId
                    ? 'Update task'
                    : 'Create task'}
              </button>
            </div>
          </form>
        </article>

        <article className="space-y-4 rounded-xl bg-slate-900/50 p-6 shadow-inner shadow-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <span className="text-xs tracking-wide text-slate-500 uppercase">
              {tasksCountLabel}
            </span>
          </div>

          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              No tasks yet. Create one to start awarding stars.
            </p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-100">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      Child: {childLookup.get(task.childId) ?? 'Unknown'}
                    </p>
                    {task.category && (
                      <p className="text-xs text-slate-500">
                        Category: {task.category}
                      </p>
                    )}
                    <p className="text-xs text-emerald-300">
                      Worth {task.starValue} star(s)
                    </p>
                  </div>

                  <div className="flex gap-2 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
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

export default ManageTasksPage
