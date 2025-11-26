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
  category: string
  starValue: 1 | 2 | 3
  isRepeating: boolean
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
  isRepeating: z.boolean(),
})

const ManageTasksPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    childId: '',
    category: '',
    starValue: 1 as 1 | 2 | 3,
    isRepeating: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAwarding, setIsAwarding] = useState(false)

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
            isRepeating: data.isRepeating ?? false,
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
      isRepeating: task.isRepeating,
    })
    setFormErrors({})
  }

  const startCreate = () => {
    if (!user) return
    setEditingId('new')
    setEditForm({
      title: '',
      childId: '',
      category: '',
      starValue: 1,
      isRepeating: true,
    })
    setFormErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      title: '',
      childId: '',
      category: '',
      starValue: 1,
      isRepeating: false,
    })
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

  const handleAwardTask = async (task: TaskRecord) => {
    if (!user || !activeChildId) {
      alert('Please select an explorer first.')
      return
    }

    setIsAwarding(true)
    try {
      await awardStars({
        userId: user.uid,
        childId: activeChildId,
        delta: task.starValue,
      })
      celebrateSuccess()

      if (!task.isRepeating) {
        await deleteDoc(
          doc(collection(db, 'users', user.uid, 'tasks'), task.id)
        )
      }
    } catch (error) {
      console.error('Failed to award stars', error)
      alert('Failed to award stars. Please try again.')
    } finally {
      setIsAwarding(false)
    }
  }

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    return child?.displayName || 'Unknown'
  }

  const isDarkTheme = theme.id === 'space'

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center transition-colors duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '20px',
      }}
    >
      {/* Device Frame - simulates mobile device with border */}
      <div
        className="relative flex min-h-[896px] w-full max-w-[414px] flex-col overflow-hidden"
        style={{
          borderRadius: '40px',
          boxShadow:
            '0 0 0 12px #1a1a2e, 0 0 0 14px #333, 0 25px 50px rgba(0, 0, 0, 0.5)',
          background: theme.colors.bg,
          backgroundImage: theme.bgPattern,
        }}
      >
        {/* Top Navigation Bar */}
        <div className="absolute top-0 right-0 left-0 z-50 flex items-center justify-between p-4">
          <Link
            to="/"
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl transition hover:opacity-80"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
          >
            ←
          </Link>
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
            }}
          >
            📋 My Tasks
          </h1>
          <div className="w-12" />
        </div>

        {/* Content Area */}
        <div
          className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 pt-20 pb-24"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.body,
          }}
        >
          {children.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-3xl p-8 text-center"
              style={{
                backgroundColor: theme.colors.surface,
                border: `3px dashed ${theme.colors.accent}`,
              }}
            >
              <span className="mb-4 text-6xl">👶</span>
              <p className="mb-2 text-lg font-semibold">No children yet!</p>
              <p className="text-sm opacity-70">Add a child profile first</p>
            </div>
          ) : tasks.length === 0 && editingId !== 'new' ? (
            <>
              <div
                className="flex flex-col items-center justify-center rounded-3xl p-8 text-center"
                style={{
                  backgroundColor: theme.colors.surface,
                  border: `3px dashed ${theme.colors.accent}`,
                }}
              >
                <span className="mb-4 text-6xl">✨</span>
                <p className="mb-2 text-lg font-semibold">No tasks yet!</p>
                <p className="text-sm opacity-70">
                  Create your first task below
                </p>
              </div>
              <button
                type="button"
                onClick={startCreate}
                className="flex h-[72px] w-full items-center justify-center gap-3 rounded-3xl text-xl font-bold transition-all active:scale-95"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: isDarkTheme ? '#000' : '#FFF',
                  fontFamily: '"Fredoka", "Comic Sans MS", sans-serif',
                  boxShadow: `0 6px 0 ${theme.colors.accent}`,
                  border: `3px solid ${theme.colors.accent}`,
                }}
              >
                <span className="text-4xl">➕</span>
                <span>Create Task</span>
              </button>
            </>
          ) : (
            <>
              {/* Task List */}
              {tasks.map((task) => {
                const isEditing = editingId === task.id

                if (isEditing) {
                  return (
                    <div
                      key={task.id}
                      className="space-y-4 rounded-3xl p-6"
                      style={{
                        backgroundColor: theme.colors.surface,
                        border: `4px solid ${theme.colors.primary}`,
                        boxShadow: `0 8px 0 ${theme.colors.accent}`,
                      }}
                    >
                      {/* Edit Form */}
                      {formErrors[task.id] && (
                        <div
                          className="rounded-2xl p-4 text-center font-semibold"
                          style={{
                            backgroundColor: '#ff000020',
                            color: '#ff6b6b',
                          }}
                        >
                          {formErrors[task.id].map((err) => (
                            <p key={err}>{err}</p>
                          ))}
                        </div>
                      )}

                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Task name"
                        maxLength={80}
                        className="w-full rounded-2xl border-4 px-6 py-4 text-xl font-bold outline-none"
                        style={{
                          borderColor: theme.colors.accent,
                          backgroundColor: theme.colors.bg,
                          color: theme.colors.text,
                          fontFamily: '"Fredoka", sans-serif',
                        }}
                      />

                      <select
                        value={editForm.childId}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            childId: e.target.value,
                          }))
                        }
                        className="w-full rounded-2xl border-4 px-6 py-4 text-lg font-semibold outline-none"
                        style={{
                          borderColor: theme.colors.accent,
                          backgroundColor: theme.colors.bg,
                          color: theme.colors.text,
                          fontFamily: '"Fredoka", sans-serif',
                        }}
                      >
                        <option value="">👤 Select child</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.displayName}
                          </option>
                        ))}
                      </select>

                      <div className="space-y-2">
                        <p className="text-sm font-bold tracking-wider uppercase opacity-70">
                          ⭐ Star Value
                        </p>
                        <div className="grid grid-cols-3 gap-3">
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
                              className="flex h-[72px] flex-col items-center justify-center rounded-2xl text-3xl font-bold transition-all active:scale-95"
                              style={{
                                backgroundColor:
                                  editForm.starValue === val
                                    ? theme.colors.primary
                                    : theme.colors.bg,
                                border: `4px solid ${theme.colors.accent}`,
                                color:
                                  editForm.starValue === val
                                    ? isDarkTheme
                                      ? '#000'
                                      : '#FFF'
                                    : theme.colors.text,
                              }}
                            >
                              {'⭐'.repeat(val)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <label
                        className="flex items-center gap-4 rounded-2xl p-4"
                        style={{
                          backgroundColor: theme.colors.bg,
                          border: `3px solid ${theme.colors.accent}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editForm.isRepeating}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              isRepeating: e.target.checked,
                            }))
                          }
                          className="h-8 w-8 rounded-lg"
                          style={{
                            accentColor: theme.colors.primary,
                          }}
                        />
                        <span className="text-lg font-semibold">
                          🔄 Repeating Task
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => saveTask(task.id)}
                          disabled={isSubmitting}
                          className="flex h-[72px] items-center justify-center gap-2 rounded-2xl text-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: theme.colors.primary,
                            color: isDarkTheme ? '#000' : '#FFF',
                            fontFamily: '"Fredoka", sans-serif',
                            boxShadow: `0 6px 0 ${theme.colors.accent}`,
                          }}
                        >
                          <span className="text-3xl">✅</span>
                          <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSubmitting}
                          className="flex h-[72px] items-center justify-center gap-2 rounded-2xl text-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: theme.colors.bg,
                            color: theme.colors.text,
                            fontFamily: '"Fredoka", sans-serif',
                            border: `4px solid ${theme.colors.accent}`,
                          }}
                        >
                          <span className="text-3xl">✖️</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  )
                }

                // Task Display Card
                return (
                  <div
                    key={task.id}
                    className="rounded-3xl p-6 transition-all"
                    style={{
                      backgroundColor: theme.colors.surface,
                      border: `4px solid ${theme.colors.accent}`,
                      boxShadow: `0 6px 0 ${theme.colors.accent}`,
                    }}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className="text-2xl leading-tight font-bold"
                          style={{
                            fontFamily: '"Fredoka", sans-serif',
                            color: theme.colors.text,
                          }}
                        >
                          {task.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-base">
                          <span className="opacity-70">
                            👤 {getChildName(task.childId)}
                          </span>
                          {task.category && (
                            <span
                              className="rounded-full px-3 py-1 text-sm font-semibold"
                              style={{
                                backgroundColor: theme.colors.bg,
                                color: theme.colors.text,
                              }}
                            >
                              {task.category}
                            </span>
                          )}
                          {task.isRepeating && (
                            <span
                              className="rounded-full px-3 py-1 text-sm font-semibold"
                              style={{
                                backgroundColor: theme.colors.primary + '40',
                                color: theme.colors.text,
                              }}
                            >
                              🔄 Repeating
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-4xl">
                        {'⭐'.repeat(task.starValue)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAwardTask(task)}
                        disabled={
                          isAwarding || editingId !== null || !activeChildId
                        }
                        className="col-span-3 flex h-[72px] items-center justify-center gap-3 rounded-2xl text-xl font-bold transition-all active:scale-95 disabled:opacity-40"
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: isDarkTheme ? '#000' : '#FFF',
                          fontFamily: '"Fredoka", sans-serif',
                          boxShadow: `0 6px 0 ${theme.colors.accent}`,
                        }}
                      >
                        <span className="text-4xl">🎉</span>
                        <span>Award Stars!</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        disabled={editingId !== null}
                        className="flex h-[60px] items-center justify-center rounded-xl text-3xl transition-all active:scale-95 disabled:opacity-40"
                        style={{
                          backgroundColor: theme.colors.bg,
                          border: `3px solid ${theme.colors.accent}`,
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        disabled={editingId !== null}
                        className="flex h-[60px] items-center justify-center rounded-xl text-3xl transition-all active:scale-95 disabled:opacity-40"
                        style={{
                          backgroundColor: theme.colors.bg,
                          border: `3px solid ${theme.colors.accent}`,
                        }}
                      >
                        🗑️
                      </button>
                      <div className="w-full" />
                    </div>
                  </div>
                )
              })}

              {/* Create New Task Form or Button */}
              {editingId === 'new' ? (
                <div
                  className="space-y-4 rounded-3xl p-6"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `4px solid ${theme.colors.primary}`,
                    boxShadow: `0 8px 0 ${theme.colors.accent}`,
                  }}
                >
                  {formErrors['new'] && (
                    <div
                      className="rounded-2xl p-4 text-center font-semibold"
                      style={{
                        backgroundColor: '#ff000020',
                        color: '#ff6b6b',
                      }}
                    >
                      {formErrors['new'].map((err) => (
                        <p key={err}>{err}</p>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Task name"
                    maxLength={80}
                    className="w-full rounded-2xl border-4 px-6 py-4 text-xl font-bold outline-none"
                    style={{
                      borderColor: theme.colors.accent,
                      backgroundColor: theme.colors.bg,
                      color: theme.colors.text,
                      fontFamily: '"Fredoka", sans-serif',
                    }}
                  />

                  <select
                    value={editForm.childId}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        childId: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border-4 px-6 py-4 text-lg font-semibold outline-none"
                    style={{
                      borderColor: theme.colors.accent,
                      backgroundColor: theme.colors.bg,
                      color: theme.colors.text,
                      fontFamily: '"Fredoka", sans-serif',
                    }}
                  >
                    <option value="">👤 Select child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.displayName}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <p className="text-sm font-bold tracking-wider uppercase opacity-70">
                      ⭐ Star Value
                    </p>
                    <div className="grid grid-cols-3 gap-3">
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
                          className="flex h-[72px] flex-col items-center justify-center rounded-2xl text-3xl font-bold transition-all active:scale-95"
                          style={{
                            backgroundColor:
                              editForm.starValue === val
                                ? theme.colors.primary
                                : theme.colors.bg,
                            border: `4px solid ${theme.colors.accent}`,
                            color:
                              editForm.starValue === val
                                ? isDarkTheme
                                  ? '#000'
                                  : '#FFF'
                                : theme.colors.text,
                          }}
                        >
                          {'⭐'.repeat(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label
                    className="flex items-center gap-4 rounded-2xl p-4"
                    style={{
                      backgroundColor: theme.colors.bg,
                      border: `3px solid ${theme.colors.accent}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.isRepeating}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isRepeating: e.target.checked,
                        }))
                      }
                      className="h-8 w-8 rounded-lg"
                      style={{
                        accentColor: theme.colors.primary,
                      }}
                    />
                    <span className="text-lg font-semibold">
                      🔄 Repeating Task
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => saveTask('new')}
                      disabled={isSubmitting}
                      className="flex h-[72px] items-center justify-center gap-2 rounded-2xl text-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: isDarkTheme ? '#000' : '#FFF',
                        fontFamily: '"Fredoka", sans-serif',
                        boxShadow: `0 6px 0 ${theme.colors.accent}`,
                      }}
                    >
                      <span className="text-3xl">✅</span>
                      <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={isSubmitting}
                      className="flex h-[72px] items-center justify-center gap-2 rounded-2xl text-xl font-bold transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: theme.colors.bg,
                        color: theme.colors.text,
                        fontFamily: '"Fredoka", sans-serif',
                        border: `4px solid ${theme.colors.accent}`,
                      }}
                    >
                      <span className="text-3xl">✖️</span>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startCreate}
                  className="flex h-[72px] w-full items-center justify-center gap-3 rounded-3xl text-xl font-bold transition-all active:scale-95"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: isDarkTheme ? '#000' : '#FFF',
                    fontFamily: '"Fredoka", "Comic Sans MS", sans-serif',
                    boxShadow: `0 6px 0 ${theme.colors.accent}`,
                    border: `3px solid ${theme.colors.accent}`,
                  }}
                >
                  <span className="text-4xl">➕</span>
                  <span>Create Task</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageTasksPage
