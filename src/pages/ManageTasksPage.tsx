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
import { awardStars } from '../services/starActions'
import { celebrateSuccess } from '../utils/celebrate'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import { uiTokens } from '../ui/tokens'

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
            title: data.title ?? 'Untitled chore',
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
      console.error('Failed to save chore', error)
      setFormErrors({
        [id]: ['Unable to save chore. Please try again.'],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    const confirmDelete = window.confirm('Delete this chore?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
    } catch (error) {
      console.error('Failed to delete chore', error)
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
  const actionBtnStyle = {
    fontFamily: '"Fredoka", sans-serif',
    height: `${uiTokens.actionButtonHeight}px`,
    fontSize: `${uiTokens.actionButtonFontSize}px`,
    fontWeight: 700,
    borderRadius: `${uiTokens.actionButtonRadius}px`,
    borderWidth: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease',
  }

  // Large Prototype Font Style
  const unifiedFontStyle =
    "font-['Fredoka'] text-[28px] font-bold leading-tight"

  const editingTask =
    editingId && editingId !== 'new'
      ? (tasks.find((task) => task.id === editingId) ?? null)
      : null

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Chores"
        fontFamily={theme.fonts.heading}
        left={
          <TopIconButton
            theme={theme}
            to="/"
            ariaLabel="Home"
            icon={<span className="text-2xl">🏠</span>}
          />
        }
        right={<div style={{ width: `${uiTokens.topIconSize}px` }} />}
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {children.length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-center opacity-70">
              <span className="mb-4 text-6xl">👶</span>
              <p className="text-2xl font-bold">No explorers yet!</p>
            </div>
          ) : (
            // MAIN CONTENT CONTAINER
            <div className="flex flex-col gap-8">
              {editingTask && (
                <div
                  className="flex flex-col gap-4 rounded-3xl p-6"
                  style={{
                    backgroundColor: theme.colors.surface,
                    border: `4px solid ${theme.colors.primary}`,
                    boxShadow: `0 0 18px ${theme.colors.primary}66`,
                    color: theme.colors.text,
                  }}
                >
                  {formErrors[editingTask.id] && (
                    <div className="rounded-xl bg-red-100 p-3 text-center text-lg font-bold text-red-600">
                      {formErrors[editingTask.id][0]}
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
                    placeholder="Chore Name"
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
                      onClick={() => saveTask(editingTask.id)}
                      disabled={isSubmitting}
                      style={{
                        ...actionBtnStyle,
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.accent,
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
                        borderColor: theme.colors.accent,
                        color: theme.colors.text,
                        flex: 1,
                      }}
                      className="active:translate-y-1 active:shadow-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* CREATE NEW TASK FORM */}
              {editingId === 'new' && (
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
                    New Chore
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
                    placeholder="Chore Name"
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
              )}

              {/* Task List */}
              <StandardActionList
                theme={theme}
                items={tasks.filter((task) => editingId !== task.id)}
                getKey={(task) => task.id}
                renderItem={(task) => (
                  <div>
                    <div className="text-lg font-bold">{task.title}</div>
                    <div className="text-sm opacity-80">
                      {getChildName(task.childId)}
                    </div>
                    {task.isRepeating && (
                      <div className="text-sm font-bold opacity-80">
                        Repeating 🔄
                      </div>
                    )}
                  </div>
                )}
                primaryAction={{
                  label: 'Give',
                  icon: '⭐',
                  onClick: (task) => handleAwardTask(task),
                  disabled: () =>
                    isAwarding || editingId !== null || !activeChildId,
                  variant: 'primary',
                }}
                onEdit={(task) => startEdit(task)}
                onDelete={(task) => handleDelete(task.id)}
                addLabel="New Chore"
                onAdd={startCreate}
                addDisabled={editingId !== null}
                emptyState={
                  <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                    No chores yet.
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default ManageTasksPage
