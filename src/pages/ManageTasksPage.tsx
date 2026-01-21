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
import StarCost from '../components/StarCost'
import ActionTextInput from '../components/ActionTextInput'
import ActionButton from '../components/ActionButton'
import RepeatControl from '../components/RepeatControl'
import { uiTokens } from '../ui/tokens'
import {
  princessGiveStarIcon,
  princessChoresIcon,
  princessHomeIcon,
  princessSaveIcon,
} from '../assets/themes/princess/assets'

// --- Types & Schema ---
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
      setTasks([])
      return
    }

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
      unsubscribeTasks()
    }
  }, [user])

  // --- Actions ---
  const startEdit = (task: TaskRecord) => {
    setEditingId(task.id)
    setEditForm({ ...task, childId: activeChildId || task.childId })
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
      childId: activeChildId || '',
      category: '',
      starValue: 1,
      isRepeating: false,
    })
    setFormErrors({})
  }

  const saveTask = async (id: string) => {
    if (!user) return

    const parsed = taskSchema.safeParse({
      ...editForm,
      childId: activeChildId || editForm.childId,
    })

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
        title={
          editingId
            ? editingId === 'new'
              ? 'New Chore'
              : editForm.title || 'Chore'
            : 'Chores'
        }
        fontFamily={theme.fonts.heading}
        right={
          editingId ? (
            <TopIconButton
              theme={theme}
              onClick={cancelEdit}
              ariaLabel="Chores"
              icon={
                <img
                  src={princessChoresIcon}
                  alt="Chores"
                  className="h-10 w-10 object-contain"
                />
              }
            />
          ) : (
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
          )
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {editingId ? (
            <div
              className="flex flex-col"
              style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
            >
              {editingId !== 'new' && editingTask && (
                <div
                  className="flex flex-col"
                  style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                >
                  {formErrors[editingTask.id] && (
                    <div className="rounded-xl bg-red-100 p-3 text-center text-lg font-bold text-red-600">
                      {formErrors[editingTask.id][0]}
                    </div>
                  )}

                  <ActionTextInput
                    theme={theme}
                    label="Chore"
                    value={editForm.title}
                    onChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: value,
                      }))
                    }
                    placeholder="Chore Name"
                    maxLength={80}
                    baseColor={theme.colors.primary}
                    inputAriaLabel="Chore name"
                  />

                  {!activeChildId && (
                    <div className="rounded-xl bg-black/10 p-3 text-center text-lg font-bold">
                      Select a child on the dashboard to assign chores.
                    </div>
                  )}

                  <StarCost
                    theme={theme}
                    value={editForm.starValue}
                    onChange={(nextValue) =>
                      setEditForm((prev) => ({
                        ...prev,
                        starValue: (nextValue || 1) as 1 | 2 | 3,
                      }))
                    }
                    maxStars={3}
                    showLabel={false}
                    showFeedback={false}
                  />

                  <RepeatControl
                    theme={theme}
                    value={editForm.isRepeating}
                    onChange={(nextValue) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isRepeating: nextValue,
                      }))
                    }
                    showLabel={false}
                    showFeedback={false}
                  />

                  <ActionButton
                    theme={theme}
                    color={theme.colors.primary}
                    label="Save"
                    icon={
                      <img
                        src={princessSaveIcon}
                        alt="Save"
                        className="h-10 w-10 object-contain"
                      />
                    }
                    onClick={() => saveTask(editingTask.id)}
                    disabled={isSubmitting || !activeChildId}
                  />
                </div>
              )}

              {editingId === 'new' && (
                <div
                  className="animate-in slide-in-from-bottom-5 fade-in flex flex-col duration-300"
                  style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                >
                  <h2
                    className={`text-center uppercase opacity-80 ${unifiedFontStyle}`}
                  >
                    New Chore
                  </h2>

                  <ActionTextInput
                    theme={theme}
                    label="Name"
                    value={editForm.title}
                    onChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: value,
                      }))
                    }
                    placeholder="Chore Name"
                    maxLength={80}
                    baseColor={theme.colors.primary}
                    inputAriaLabel="Chore name"
                  />

                  {!activeChildId && (
                    <div className="rounded-xl bg-black/10 p-3 text-center text-lg font-bold">
                      Select a child on the dashboard to assign chores.
                    </div>
                  )}

                  <StarCost
                    theme={theme}
                    value={editForm.starValue}
                    onChange={(nextValue) =>
                      setEditForm((prev) => ({
                        ...prev,
                        starValue: (nextValue || 1) as 1 | 2 | 3,
                      }))
                    }
                    maxStars={3}
                    showLabel={false}
                    showFeedback={false}
                  />

                  <RepeatControl
                    theme={theme}
                    value={editForm.isRepeating}
                    onChange={(nextValue) =>
                      setEditForm((prev) => ({
                        ...prev,
                        isRepeating: nextValue,
                      }))
                    }
                    showLabel={false}
                    showFeedback={false}
                  />

                  <ActionButton
                    theme={theme}
                    color={theme.colors.primary}
                    label="Save"
                    icon={
                      <img
                        src={princessSaveIcon}
                        alt="Save"
                        className="h-10 w-10 object-contain"
                      />
                    }
                    onClick={() => saveTask('new')}
                    disabled={isSubmitting || !activeChildId}
                  />
                </div>
              )}
            </div>
          ) : !activeChildId ? (
            <div className="mt-10 flex flex-col items-center text-center opacity-70">
              <span className="mb-4 text-6xl">👶</span>
              <p className="text-2xl font-bold">No explorers yet!</p>
            </div>
          ) : (
            <div
              className="flex flex-col"
              style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
            >
              <StandardActionList
                theme={theme}
                items={tasks}
                getKey={(task) => task.id}
                renderItem={(task) => (
                  <div className="flex items-center justify-between gap-4">
                    <div
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: `${uiTokens.actionButtonFontSize}px`,
                        fontWeight: 700,
                        lineHeight: 1.1,
                      }}
                    >
                      {task.title}
                    </div>
                    <div
                      className="flex items-center gap-2"
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: `${uiTokens.actionButtonFontSize}px`,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      <span style={{ fontSize: '24px', lineHeight: 1 }}>
                        ⭐
                      </span>
                      <span>{task.starValue}</span>
                    </div>
                  </div>
                )}
                primaryAction={{
                  label: 'Give',
                  icon: (
                    <img
                      src={princessGiveStarIcon}
                      alt="Give star"
                      className="h-6 w-6 object-contain"
                    />
                  ),
                  onClick: (task) => handleAwardTask(task),
                  disabled: () => isAwarding || !activeChildId,
                  variant: 'primary',
                  showLabel: false,
                }}
                onEdit={(task) => startEdit(task)}
                onDelete={(task) => handleDelete(task.id)}
                addLabel="New Chore"
                onAdd={startCreate}
                addDisabled={false}
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
