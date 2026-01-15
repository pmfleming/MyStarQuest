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

// --- Types & Schema ---
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

  // --- Data Fetching ---
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
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          displayName: docSnapshot.data().displayName ?? 'Unnamed child',
        }))
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

  // --- Actions ---
  const startEdit = (task: TaskRecord) => {
    setEditingId(task.id)
    setEditForm({ ...task })
    setFormErrors({})
  }

  const startCreate = () => {
    if (!user) return
    setEditingId('new')
    setEditForm({
      title: '',
      childId: activeChildId || '',
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

  // --- Styles ---
  const containerStyle = {
    background: theme.colors.bg,
    color: theme.colors.text,
    fontFamily: '"Fredoka", sans-serif',
  }

  const actionBtnStyle = {
    fontFamily: '"Fredoka", sans-serif',
    height: '72px',
    fontSize: '24px',
    fontWeight: 700,
    borderRadius: '20px',
    borderWidth: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  }

  // Large Prototype Font Style
  const unifiedFontStyle =
    "font-['Fredoka'] text-[28px] font-bold leading-tight"

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4 transition-colors duration-500"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}
    >
      {/* Device Frame */}
      <div
        className="relative flex min-h-[896px] w-full max-w-[414px] flex-col overflow-hidden"
        style={{
          borderRadius: '40px',
          boxShadow:
            '0 0 0 12px #1a1a2e, 0 0 0 14px #333, 0 25px 50px rgba(0, 0, 0, 0.5)',
          ...containerStyle,
        }}
      >
        {/* Header */}
        <div
          className="bg-opacity-90 sticky top-0 z-50 flex items-center justify-between p-6 backdrop-blur-md"
          style={{
            backgroundColor: isDarkTheme
              ? 'rgba(11, 16, 38, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <Link
            to="/"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 text-4xl transition hover:opacity-80"
            style={{
              borderColor: theme.colors.text,
              color: theme.colors.text,
            }}
          >
            ←
          </Link>
          <h1 className="text-3xl font-bold tracking-wide">My Tasks</h1>
          <div className="w-[72px]" />
        </div>

        {/* Scrollable Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2 pb-32">
          {children.length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-center opacity-70">
              <span className="mb-4 text-6xl">👶</span>
              <p className="text-2xl font-bold">No explorers yet!</p>
            </div>
          ) : (
            // MAIN CONTENT CONTAINER
            <div className="flex flex-col gap-8">
              {/* Empty State Message */}
              {tasks.length === 0 && editingId !== 'new' && (
                <div className="mt-10 flex flex-col items-center text-center opacity-70">
                  <span className="mb-4 text-6xl">✨</span>
                  <p className="text-2xl font-bold">No tasks yet!</p>
                  <p className="text-xl">Create one below!</p>
                </div>
              )}

              {/* Task List */}
              {tasks.map((task, index) => {
                const isEditing = editingId === task.id

                // Alternating Colors
                const isPrimary = index % 2 === 0
                const activeColor = isPrimary
                  ? theme.colors.primary
                  : theme.colors.secondary
                const activeShadow = isPrimary
                  ? theme.colors.accent
                  : theme.colors.primary

                const cardStyle = {
                  background: `linear-gradient(135deg, ${activeColor}, ${theme.colors.secondary})`,
                  borderRadius: '50px',
                  boxShadow: `0 0 20px ${activeColor}`,
                  border: 'none',
                  color: theme.id === 'space' ? '#000' : '#FFF',
                  marginBottom: '24px',
                }

                if (isEditing) {
                  return (
                    <div
                      key={task.id}
                      style={{
                        ...cardStyle,
                        background: theme.colors.surface,
                        border: `4px solid ${activeColor}`,
                        color: theme.colors.text,
                      }}
                      className="flex flex-col gap-4 p-6"
                    >
                      {formErrors[task.id] && (
                        <div className="rounded-xl bg-red-100 p-3 text-center text-lg font-bold text-red-600">
                          {formErrors[task.id][0]}
                        </div>
                      )}

                      {/* Title Input */}
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Task Name"
                        className={`w-full border-b-4 bg-transparent outline-none ${unifiedFontStyle}`}
                        style={{
                          borderColor: activeColor,
                          color: theme.colors.text,
                        }}
                      />

                      {/* Child Select */}
                      <select
                        value={editForm.childId}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            childId: e.target.value,
                          }))
                        }
                        className={`w-full border-b-4 bg-transparent outline-none ${unifiedFontStyle}`}
                        style={{
                          borderColor: activeColor,
                          color: theme.colors.text,
                        }}
                      >
                        <option value="">Select Child</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.displayName}
                          </option>
                        ))}
                      </select>

                      {/* Star Value */}
                      <div className="flex gap-2 py-2">
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
                            className={`flex flex-1 items-center justify-center rounded-xl border-4 py-2 text-xl font-bold transition-transform active:scale-95 ${
                              editForm.starValue === val
                                ? 'scale-105 opacity-100'
                                : 'opacity-50'
                            }`}
                            style={{
                              borderColor: activeColor,
                              backgroundColor:
                                editForm.starValue === val
                                  ? activeColor
                                  : 'transparent',
                              color: theme.colors.text,
                              minHeight: '60px',
                            }}
                          >
                            {'⭐'.repeat(val)}
                          </button>
                        ))}
                      </div>

                      {/* Checkbox */}
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editForm.isRepeating}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              isRepeating: e.target.checked,
                            }))
                          }
                          className="h-8 w-8 accent-current"
                          style={{ color: activeColor }}
                        />
                        <span className={unifiedFontStyle}>Repeating 🔄</span>
                      </label>

                      {/* Action Buttons */}
                      <div className="mt-2 flex gap-3">
                        <button
                          onClick={() => saveTask(task.id)}
                          disabled={isSubmitting}
                          style={{
                            ...actionBtnStyle,
                            backgroundColor: activeColor,
                            borderColor: activeShadow,
                            color: isDarkTheme ? '#000' : '#FFF',
                            flex: 1,
                          }}
                          className="active:translate-y-1 active:shadow-none"
                        >
                          <span className="mr-2 text-2xl">✅</span> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{
                            ...actionBtnStyle,
                            backgroundColor: theme.colors.bg,
                            borderColor: activeShadow,
                            color: theme.colors.text,
                            flex: 1,
                          }}
                          className="active:translate-y-1 active:shadow-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                }

                // --- VIEW MODE CARD ---
                return (
                  <div
                    key={task.id}
                    style={cardStyle}
                    className="group relative overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="flex flex-1 flex-col gap-2">
                          {/* Title */}
                          <h3 className={unifiedFontStyle}>{task.title}</h3>

                          {/* Child Name */}
                          <div className={unifiedFontStyle}>
                            {getChildName(task.childId)}
                          </div>

                          {/* Repeating Text */}
                          {task.isRepeating && (
                            <div className={unifiedFontStyle}>Repeating 🔄</div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleAwardTask(task)}
                          disabled={
                            isAwarding || editingId !== null || !activeChildId
                          }
                          className="col-span-2 flex items-center justify-center gap-2 transition-transform active:scale-95"
                          style={{
                            ...actionBtnStyle,
                            backgroundColor: activeColor,
                            borderColor: activeShadow,
                            color: isDarkTheme ? '#000' : '#FFF',
                            boxShadow: '0 4px 0 rgba(0,0,0,0.2)',
                          }}
                        >
                          <span className="text-2xl font-bold">Give</span>
                          <span className="text-3xl font-black">
                            {task.starValue}
                          </span>
                          <span className="text-2xl">⭐</span>
                        </button>

                        <button
                          onClick={() => startEdit(task)}
                          className="col-span-1 flex items-center justify-center gap-2 transition-transform active:scale-95"
                          style={{
                            ...actionBtnStyle,
                            backgroundColor: theme.colors.bg,
                            borderColor: activeColor,
                          }}
                          aria-label="Edit Task"
                        >
                          <span>✏️</span> Edit
                        </button>

                        <button
                          onClick={() => handleDelete(task.id)}
                          className="col-span-1 flex items-center justify-center gap-2 text-red-500 transition-transform active:scale-95"
                          style={{
                            ...actionBtnStyle,
                            backgroundColor: theme.colors.bg,
                            borderColor: activeColor,
                          }}
                          aria-label="Delete Task"
                        >
                          <span>🗑️</span> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* CREATE NEW TASK FORM */}
              {editingId === 'new' ? (
                <div
                  className="animate-in slide-in-from-bottom-5 fade-in flex flex-col gap-4 p-5 duration-300"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `5px solid ${theme.colors.primary}`,
                    borderRadius: '24px',
                    boxShadow: `0 8px 0 ${theme.colors.accent}`,
                  }}
                >
                  <h2
                    className={`text-center uppercase opacity-80 ${unifiedFontStyle}`}
                  >
                    New Mission
                  </h2>

                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Task Name"
                    className={`w-full border-b-4 bg-transparent outline-none ${unifiedFontStyle}`}
                    style={{
                      borderColor: theme.colors.primary,
                      color: theme.colors.text,
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
                    className={`w-full border-b-4 bg-transparent outline-none ${unifiedFontStyle}`}
                    style={{
                      borderColor: theme.colors.primary,
                      color: theme.colors.text,
                    }}
                  >
                    <option value="">Select Child</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.displayName}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 py-2">
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
                        className={`flex flex-1 items-center justify-center rounded-xl border-4 py-2 text-xl font-bold transition-transform active:scale-95 ${
                          editForm.starValue === val
                            ? 'scale-105 opacity-100'
                            : 'opacity-50'
                        }`}
                        style={{
                          borderColor: theme.colors.primary,
                          backgroundColor:
                            editForm.starValue === val
                              ? theme.colors.primary
                              : 'transparent',
                          color: theme.colors.text,
                          minHeight: '60px',
                        }}
                      >
                        {'⭐'.repeat(val)}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editForm.isRepeating}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isRepeating: e.target.checked,
                        }))
                      }
                      className="h-8 w-8 accent-current"
                      style={{ color: theme.colors.primary }}
                    />
                    <span className={unifiedFontStyle}>Repeating 🔄</span>
                  </label>

                  <div className="mt-2 flex gap-3">
                    <button
                      onClick={() => saveTask('new')}
                      disabled={isSubmitting}
                      style={{
                        ...actionBtnStyle,
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.accent,
                        color: isDarkTheme ? '#000' : '#FFF',
                        flex: 1,
                      }}
                      className="shadow-md active:translate-y-1 active:shadow-none"
                    >
                      <span className="mr-2 text-2xl">✅</span> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        ...actionBtnStyle,
                        backgroundColor: theme.colors.bg,
                        borderColor: theme.colors.accent,
                        color: theme.colors.text,
                        flex: 1,
                      }}
                      className="shadow-md active:translate-y-1 active:shadow-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // NEW TASK BUTTON - LIST ITEM, NOT FLOATING
                <div className="flex justify-center pb-6">
                  <button
                    onClick={startCreate}
                    className="flex items-center justify-center rounded-full shadow-2xl transition-transform active:scale-95"
                    style={{
                      width: '80px',
                      height: '80px',
                      backgroundColor: theme.colors.primary,
                      border: `4px solid ${theme.colors.accent}`,
                      color: isDarkTheme ? '#000' : '#FFF',
                      boxShadow: `0 10px 20px -5px ${theme.colors.primary}90`,
                    }}
                  >
                    <span className="text-5xl">➕</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageTasksPage
