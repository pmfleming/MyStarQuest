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
import { getActionButtonStyle, uiTokens } from '../ui/tokens'
import {
  princessActiveIcon,
  princessChildrenIcon,
  princessHomeIcon,
  princessSaveIcon,
  princessSelectIcon,
  princessThemeIcon,
} from '../assets/themes/princess/assets'

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
    { id: 'space' as ThemeId, label: 'Space', image: '', enabled: false },
    { id: 'nature' as ThemeId, label: 'Nature', image: '', enabled: false },
    { id: 'cartoon' as ThemeId, label: 'Cartoon', image: '', enabled: false },
  ]

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
            <div className="flex flex-col gap-6">
              {(formErrors[editingId]?.length ?? 0) > 0 && (
                <div className="rounded-2xl bg-red-500/20 p-4 text-center text-sm font-bold text-red-200">
                  {formErrors[editingId]?.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-bold opacity-80">
                  Child Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border-none px-4 py-3 text-lg font-bold text-slate-900 focus:ring-4"
                  style={{
                    backgroundColor: '#FFF',
                    minHeight: '60px',
                  }}
                  placeholder="e.g. Star Captain"
                  maxLength={40}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold opacity-80">Theme</label>
                <div className="grid grid-cols-2 gap-4">
                  {themeOptions.map((option) => {
                    const isSelected = editForm.themeId === option.id
                    const isDisabled = !option.enabled
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            themeId: option.id,
                          }))
                        }
                        className={`flex flex-col items-center justify-center gap-2 rounded-3xl p-4 transition-all ${
                          isSelected
                            ? 'ring-4 ring-offset-2 ring-offset-slate-900'
                            : 'opacity-70 hover:opacity-100'
                        } ${isDisabled ? 'opacity-40' : ''}`}
                        style={{
                          minHeight: '140px',
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : 'rgba(0,0,0,0.1)',
                          border: `2px solid ${theme.colors.primary}`,
                          color:
                            isSelected && theme.id !== 'space'
                              ? '#FFF'
                              : 'inherit',
                        }}
                      >
                        {option.image ? (
                          <img
                            src={option.image}
                            alt={option.label}
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <span className="text-sm font-bold opacity-70">
                            Coming soon
                          </span>
                        )}
                        <span className="text-sm font-bold">
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => saveProfile(editingId)}
                disabled={isSubmitting}
                className="active:scale-95 disabled:opacity-70"
                style={getActionButtonStyle(theme, theme.colors.primary)}
              >
                <span className="flex items-center gap-4">
                  <span
                    className="flex items-center justify-center"
                    style={{
                      fontSize: `${uiTokens.actionButtonIconSize}px`,
                      width: `${uiTokens.actionButtonIconSize}px`,
                      height: `${uiTokens.actionButtonIconSize}px`,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={princessSaveIcon}
                      alt="Save"
                      className="h-12 w-12 object-contain"
                    />
                  </span>
                  <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
                </span>
              </button>
            </div>
          ) : (
            <StandardActionList
              theme={theme}
              items={children}
              getKey={(child) => child.id}
              renderItem={(child) => (
                <div className="flex items-center justify-between gap-4">
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
                  <div
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: `${uiTokens.actionButtonFontSize}px`,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>⭐</span>
                    <span>{child.totalStars}</span>
                  </div>
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
