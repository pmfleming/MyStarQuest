import { useEffect, useState } from 'react'
import { z } from 'zod'
import { THEME_ID_LOOKUP, type ThemeId } from '../constants/themeOptions'
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
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import Carousel from '../components/Carousel'
import ActionTextInput from '../components/ActionTextInput'
import ActionButton from '../components/ActionButton'
import { uiTokens } from '../ui/tokens'
import {
  princessActiveIcon,
  princessChildrenIcon,
  princessHomeIcon,
  princessSaveIcon,
  princessSelectIcon,
  princessThemeIcon,
} from '../assets/themes/princess/assets'
import spaceThemeIcon from '../assets/themes/space/space.svg'
import natureThemeIcon from '../assets/themes/nature/nature.svg'
import cartoonThemeIcon from '../assets/themes/cartoon/cartoon.svg'

const childSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(40, 'Display name must be under 40 characters'),
  avatarToken: z
    .string()
    .trim()
    .min(1, 'Avatar token is required')
    .max(12, 'Avatar token must be under 12 characters'),
})

type ChildProfile = {
  id: string
  displayName: string
  avatarToken: string
  totalStars: number
  themeId?: ThemeId
  createdAt?: Date
}

const ManageChildrenPage = () => {
  const { user } = useAuth()
  const { activeChildId, setActiveChild, clearActiveChild } = useActiveChild()
  const { theme } = useTheme()
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    displayName: '',
    themeId: 'princess' as ThemeId,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const startEdit = (child: ChildProfile) => {
    setEditingId(child.id)
    setEditForm({
      displayName: child.displayName,
      themeId: child.themeId || 'princess',
    })
    setFormErrors({})
  }

  useEffect(() => {
    if (!user) {
      setChildren([])
      return
    }

    const childQuery = query(
      collection(db, 'users', user.uid, 'children'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(childQuery, (snapshot) => {
      const nextChildren: ChildProfile[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          displayName: data.displayName,
          avatarToken: data.avatarToken,
          totalStars: data.totalStars ?? 0,
          themeId: data.themeId,
          createdAt: data.createdAt?.toDate?.(),
        }
      })

      setChildren(nextChildren)
    })

    return unsubscribe
  }, [user])

  const startCreate = () => {
    if (!user) return
    setEditingId('new')
    setEditForm({
      displayName: '',
      themeId: 'princess',
    })
    setFormErrors({})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ displayName: '', themeId: 'princess' })
    setFormErrors({})
  }

  const saveProfile = async (id: string) => {
    if (!user) return

    const parsed = childSchema.safeParse({
      displayName: editForm.displayName,
      avatarToken: THEME_ID_LOOKUP.get(editForm.themeId)?.emoji || '👤',
    })

    if (!parsed.success) {
      setFormErrors({
        [id]: parsed.error.issues.map((issue) => issue.message),
      })
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    const childCollection = collection(db, 'users', user.uid, 'children')

    try {
      if (id === 'new') {
        await addDoc(childCollection, {
          displayName: parsed.data.displayName,
          avatarToken: parsed.data.avatarToken,
          themeId: editForm.themeId,
          totalStars: 0,
          createdAt: serverTimestamp(),
        })
      } else {
        await updateDoc(doc(childCollection, id), {
          displayName: parsed.data.displayName,
          avatarToken: parsed.data.avatarToken,
          themeId: editForm.themeId,
        })

        if (id === activeChildId) {
          setActiveChild({ id, themeId: editForm.themeId })
        }
      }

      cancelEdit()
    } catch (error) {
      console.error('Failed to save child profile', error)
      setFormErrors({
        [id]: ['Unable to save child profile. Please try again.'],
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this child profile?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'children'), id))
      // Clear selection if deleting the selected explorer
      if (id === activeChildId) {
        clearActiveChild()
      }
    } catch (error) {
      console.error('Failed to delete child profile', error)
    }
  }

  const handleSelectExplorer = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    if (child) {
      setActiveChild({ id: child.id, themeId: child.themeId || 'princess' })
    }
  }

  const themeOptions = [
    {
      id: 'princess' as ThemeId,
      label: 'Princess',
      image: princessThemeIcon,
      enabled: true,
    },
    {
      id: 'space' as ThemeId,
      label: 'Space',
      image: spaceThemeIcon,
      enabled: true,
    },
    {
      id: 'nature' as ThemeId,
      label: 'Nature',
      image: natureThemeIcon,
      enabled: true,
    },
    {
      id: 'cartoon' as ThemeId,
      label: 'Cartoon',
      image: cartoonThemeIcon,
      enabled: true,
    },
  ]

  const enabledThemeOptions = themeOptions.filter((option) => option.enabled)
  const carouselItems = enabledThemeOptions.map((option) => ({
    id: option.id,
    label: option.label,
    icon: option.image ? (
      <img
        src={option.image}
        alt={option.label}
        style={{ width: '70px', height: '70px', objectFit: 'contain' }}
      />
    ) : (
      <span className="text-sm font-bold opacity-70">Coming soon</span>
    ),
  }))
  const selectedThemeIndex = Math.max(
    0,
    enabledThemeOptions.findIndex((option) => option.id === editForm.themeId)
  )

  return (
    <PageShell theme={theme}>
      <PageHeader
        title={
          editingId
            ? editingId === 'new'
              ? 'New Child'
              : editForm.displayName || 'Child'
            : 'Children'
        }
        fontFamily={theme.fonts.heading}
        right={
          editingId ? (
            <TopIconButton
              theme={theme}
              onClick={cancelEdit}
              ariaLabel="Children"
              icon={
                <img
                  src={princessChildrenIcon}
                  alt="Children"
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

      <main className="flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto flex w-full flex-col"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          {editingId ? (
            <div
              className="flex flex-col"
              style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
            >
              {(formErrors[editingId]?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-red-500/20 p-4 text-center text-sm font-bold text-red-200">
                  {formErrors[editingId]?.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div
                className="flex flex-col"
                style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
              >
                <ActionTextInput
                  theme={theme}
                  label="Name"
                  value={editForm.displayName}
                  onChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      displayName: value,
                    }))
                  }
                  placeholder="e.g. Star Captain"
                  maxLength={40}
                  baseColor={theme.colors.primary}
                  inputAriaLabel="Child name"
                />
              </div>

              <div
                className="flex flex-col"
                style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
              >
                <Carousel
                  key={`${editingId}-${editForm.themeId}`}
                  items={carouselItems}
                  title="Select Theme"
                  initialIndex={selectedThemeIndex}
                  onChange={(index) => {
                    const selected = enabledThemeOptions[index]
                    if (!selected) return
                    setEditForm((prev) => ({
                      ...prev,
                      themeId: selected.id,
                    }))
                  }}
                />
              </div>

              <ActionButton
                theme={theme}
                color={theme.colors.primary}
                label={isSubmitting ? 'Saving...' : 'Save'}
                icon={
                  <img
                    src={princessSaveIcon}
                    alt="Save"
                    className="h-12 w-12 object-contain"
                  />
                }
                onClick={() => saveProfile(editingId)}
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <StandardActionList
              theme={theme}
              items={children}
              getKey={(child) => child.id}
              getStarCount={(child) => child.totalStars}
              renderItem={(child) => (
                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: `${uiTokens.actionButtonFontSize}px`,
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {child.displayName}
                </div>
              )}
              primaryAction={{
                label: (child) =>
                  activeChildId === child.id ? 'Active' : 'Select',
                ariaLabel: (child) =>
                  activeChildId === child.id ? 'Active child' : 'Select child',
                icon: (child) =>
                  theme.id === 'princess' ? (
                    <img
                      src={
                        activeChildId === child.id
                          ? princessActiveIcon
                          : princessSelectIcon
                      }
                      alt={activeChildId === child.id ? 'Active' : 'Select'}
                      className="h-6 w-6 object-contain"
                    />
                  ) : activeChildId === child.id ? (
                    '✅'
                  ) : (
                    '⭐'
                  ),
                showLabel: false,
                onClick: (child) => handleSelectExplorer(child.id),
                disabled: (child) => activeChildId === child.id,
                variant: theme.id === 'princess' ? 'neutral' : 'primary',
              }}
              onEdit={(child) => startEdit(child)}
              onDelete={(child) => handleDelete(child.id)}
              addLabel="Add Child"
              onAdd={startCreate}
              addDisabled={false}
              isHighlighted={(child) => activeChildId === child.id}
              emptyState={
                <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                  No explorers yet.
                </div>
              }
            />
          )}
        </div>
      </main>
    </PageShell>
  )
}

export default ManageChildrenPage
