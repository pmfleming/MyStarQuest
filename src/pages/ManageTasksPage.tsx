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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    childId: '',
    category: '',
    starValue: 1 as 1 | 2 | 3,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
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

  const startEdit = (task: TaskRecord) => {
    setEditingId(task.id)
    setEditForm({
      title: task.title,
      childId: task.childId,
      category: task.category,
      starValue: task.starValue,
    })
    setFormErrors({})
  }

  const startCreate = () => {
    if (!user) return
    setEditingId('new')
    setEditForm({
      title: '',
      childId: children[0]?.id || '',
      category: '',
      starValue: 1,
    })
    setFormErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ title: '', childId: '', category: '', starValue: 1 })
    setFormErrors({})
  }

  const saveTask = async (id: string) => {
    if (!user) return

    const parsed = taskSchema.safeParse(editForm)

    if (!parsed.success) {
      setFormErrors({
        [id]: parsed.error.issues.map((issue) => issue.message),
      })
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    const taskCollection = collection(db, 'users', user.uid, 'tasks')

    try {
      if (id === 'new') {
        await addDoc(taskCollection, {
          ...parsed.data,
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(taskCollection, id), parsed.data)
      }

      cancelEdit()
    } catch (error) {
      console.error('Failed to save task', error)
      setFormErrors({
        [id]: ['Unable to save task. Please try again.'],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this task?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
    } catch (error) {
      console.error('Failed to delete task', error)
    }
  }

  const taskCountLabel = useMemo(() => {
    return tasks.length === 1 ? '1 task' : `${tasks.length} tasks`
  }, [tasks.length])

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    return child?.displayName || 'Unknown'
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm tracking-wide text-slate-400 uppercase">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">Manage Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">
            Create and manage tasks that children can complete to earn stars.
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
            <h2 className="text-xl font-semibold">Tasks</h2>
            <span className="text-xs tracking-wide text-slate-500 uppercase">
              {taskCountLabel}
            </span>
          </div>

          {children.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              <p className="mb-2">No children yet.</p>
              <p className="text-xs text-slate-500">
                Add a child profile first before creating tasks.
              </p>
            </div>
          ) : tasks.length === 0 && editingId !== 'new' ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                No tasks yet. Click "Create Task" to add one.
              </p>
              <button
                type="button"
                onClick={startCreate}
                className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                Create Task
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => {
                const isEditing = editingId === task.id
                const errors = formErrors[task.id]

                if (isEditing) {
                  return (
                    <li
                      key={task.id}
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
                            Task title
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
                            placeholder="e.g. Make bed"
                            maxLength={80}
                          />
                        </label>

                        <label className="block text-sm">
                          <span className="font-medium text-slate-300">
                            Assigned to
                          </span>
                          <select
                            value={editForm.childId}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                childId: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                          >
                            <option value="">Select child</option>
                            {children.map((child) => (
                              <option key={child.id} value={child.id}>
                                {child.displayName}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block text-sm">
                          <span className="font-medium text-slate-300">
                            Category (optional)
                          </span>
                          <input
                            type="text"
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                category: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                            placeholder="e.g. Chores"
                            maxLength={40}
                          />
                        </label>

                        <fieldset className="space-y-2">
                          <legend className="text-sm font-medium text-slate-300">
                            Star value
                          </legend>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    starValue: val as 1 | 2 | 3,
                                  }))
                                }
                                className={`flex-1 rounded-lg border-2 px-4 py-3 text-lg font-semibold transition-all ${
                                  editForm.starValue === val
                                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                    : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                {'⭐'.repeat(val)}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveTask(task.id)}
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
                    key={task.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-base font-semibold text-slate-100">
                          {task.title}
                        </p>
                        <span className="text-lg">
                          {'⭐'.repeat(task.starValue)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        <span className="text-emerald-300">
                          {getChildName(task.childId)}
                        </span>
                        {task.category && (
                          <span className="ml-2">• {task.category}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        disabled={editingId !== null}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
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
                        Task title
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
                        placeholder="e.g. Make bed"
                        maxLength={80}
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="font-medium text-slate-300">
                        Assigned to
                      </span>
                      <select
                        value={editForm.childId}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            childId: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                      >
                        <option value="">Select child</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.displayName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="font-medium text-slate-300">
                        Category (optional)
                      </span>
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:ring focus:ring-emerald-400/40 focus:outline-none"
                        placeholder="e.g. Chores"
                        maxLength={40}
                      />
                    </label>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-slate-300">
                        Star value
                      </legend>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                starValue: val as 1 | 2 | 3,
                              }))
                            }
                            className={`flex-1 rounded-lg border-2 px-4 py-3 text-lg font-semibold transition-all ${
                              editForm.starValue === val
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            {'⭐'.repeat(val)}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveTask('new')}
                      disabled={isSubmitting}
                      className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? 'Creating…' : 'Create Task'}
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
                    + Create Task
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

export default ManageTasksPage
