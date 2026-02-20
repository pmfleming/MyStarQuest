import { useEffect, useState } from 'react'
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
import EditableStarDisplay from '../components/EditableStarDisplay'
import ActionTextInput from '../components/ActionTextInput'
import RepeatControl from '../components/RepeatControl'
import { uiTokens } from '../ui/tokens'
import {
  princessGiveStarIcon,
  princessHomeIcon,
} from '../assets/themes/princess/assets'

// --- Types ---
type TaskRecord = {
  id: string
  title: string
  childId: string
  category: string
  starValue: 1 | 2 | 3
  isRepeating: boolean
  createdAt?: Date
}

const ManageTasksPage = () => {
  const { user } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [isAwarding, setIsAwarding] = useState(false)

  // Local title state keyed by task id, used for controlled inputs
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({})

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
      const newTasks = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          title: data.title ?? '',
          childId: data.childId ?? '',
          category: data.category ?? '',
          starValue: (data.starValue ?? 1) as 1 | 2 | 3,
          isRepeating: data.isRepeating ?? false,
          createdAt: data.createdAt?.toDate?.(),
        }
      })
      setTasks(newTasks)

      // Initialise title drafts for any new tasks we haven't seen yet
      setTitleDrafts((prev) => {
        const next = { ...prev }
        for (const t of newTasks) {
          if (!(t.id in next)) {
            next[t.id] = t.title
          }
        }
        return next
      })
    })

    return () => {
      unsubscribeTasks()
    }
  }, [user])

  // --- Auto-save helpers ---
  const updateTaskField = async (
    taskId: string,
    field: Partial<Pick<TaskRecord, 'title' | 'starValue' | 'isRepeating'>>
  ) => {
    if (!user) return
    try {
      await updateDoc(
        doc(collection(db, 'users', user.uid, 'tasks'), taskId),
        field
      )
    } catch (error) {
      console.error('Failed to update chore', error)
    }
  }

  const commitTitle = (taskId: string, title: string) => {
    const trimmed = title.trim()
    if (trimmed.length > 0 && trimmed.length <= 80) {
      updateTaskField(taskId, { title: trimmed })
    }
    // If empty, revert draft to last saved value
    const saved = tasks.find((t) => t.id === taskId)
    if (trimmed.length === 0 && saved) {
      setTitleDrafts((prev) => ({ ...prev, [taskId]: saved.title }))
    }
  }

  // --- Actions ---
  const handleCreate = async () => {
    if (!user || !activeChildId) return
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        title: '',
        childId: activeChildId,
        category: '',
        starValue: 1,
        isRepeating: true,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Failed to create chore', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    const confirmDelete = window.confirm('Delete this chore?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'tasks'), id))
      setTitleDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
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

  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Chores"
        fontFamily={theme.fonts.heading}
        right={
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
        }
      />

      <div className="flex flex-1 flex-col overflow-y-auto pb-32">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {!activeChildId ? (
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
                  <div
                    className="flex flex-col"
                    style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                  >
                    <ActionTextInput
                      theme={theme}
                      label="Chore Name"
                      value={titleDrafts[task.id] ?? task.title}
                      onChange={(value) =>
                        setTitleDrafts((prev) => ({
                          ...prev,
                          [task.id]: value,
                        }))
                      }
                      onCommit={(value) => commitTitle(task.id, value)}
                      maxLength={80}
                      baseColor={theme.colors.primary}
                      inputAriaLabel="Chore name"
                      transparent
                    />

                    <EditableStarDisplay
                      theme={theme}
                      count={task.starValue}
                      editable
                      onChange={(nextValue) =>
                        updateTaskField(task.id, {
                          starValue: (nextValue || 1) as 1 | 2 | 3,
                        })
                      }
                      min={1}
                      max={3}
                    />

                    <RepeatControl
                      theme={theme}
                      value={task.isRepeating}
                      onChange={(nextValue) =>
                        updateTaskField(task.id, { isRepeating: nextValue })
                      }
                      showLabel={false}
                      showFeedback={false}
                    />
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
                hideEdit
                onDelete={(task) => handleDelete(task.id)}
                addLabel="New Chore"
                onAdd={handleCreate}
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
