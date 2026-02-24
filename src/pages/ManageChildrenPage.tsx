import { useEffect, useState } from 'react'
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
import { uiTokens } from '../ui/tokens'
import {
  princessActiveIcon,
  princessHomeIcon,
  princessSelectIcon,
  princessThemeIcon,
} from '../assets/themes/princess/assets'
import spaceThemeIcon from '../assets/themes/space/space.svg'
import natureThemeIcon from '../assets/themes/nature/nature.svg'
import cartoonThemeIcon from '../assets/themes/cartoon/cartoon.svg'

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
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({})

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

      setNameDrafts((prev) => {
        const next = { ...prev }
        for (const child of nextChildren) {
          if (!(child.id in next)) {
            next[child.id] = child.displayName
          }
        }
        return next
      })
    })

    return unsubscribe
  }, [user])

  const updateChildField = async (
    id: string,
    field: Partial<
      Pick<ChildProfile, 'displayName' | 'avatarToken' | 'themeId'>
    >
  ) => {
    if (!user) return
    try {
      const childCollection = collection(db, 'users', user.uid, 'children')
      await updateDoc(doc(childCollection, id), field)
    } catch (error) {
      console.error('Failed to update child profile', error)
    }
  }

  const commitDisplayName = (childId: string, value: string) => {
    const trimmed = value.trim()
    if (trimmed.length > 0 && trimmed.length <= 40) {
      updateChildField(childId, { displayName: trimmed })
      return
    }

    const saved = children.find((child) => child.id === childId)
    if (saved) {
      setNameDrafts((prev) => ({ ...prev, [childId]: saved.displayName }))
    }
  }

  const handleThemeChange = (child: ChildProfile, nextThemeId: ThemeId) => {
    if ((child.themeId || 'princess') === nextThemeId) return

    const avatarToken = THEME_ID_LOOKUP.get(nextThemeId)?.emoji || '👤'
    updateChildField(child.id, {
      themeId: nextThemeId,
      avatarToken,
    })

    if (child.id === activeChildId) {
      setActiveChild({ id: child.id, themeId: nextThemeId })
    }
  }

  const handleCreate = async () => {
    if (!user) return
    try {
      await addDoc(collection(db, 'users', user.uid, 'children'), {
        displayName: '',
        avatarToken: THEME_ID_LOOKUP.get('princess')?.emoji || '👤',
        themeId: 'princess',
        totalStars: 0,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error('Failed to create child profile', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return

    const confirmDelete = window.confirm('Delete this child profile?')
    if (!confirmDelete) return

    try {
      await deleteDoc(doc(collection(db, 'users', user.uid, 'children'), id))
      setNameDrafts((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
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
    },
    {
      id: 'space' as ThemeId,
      label: 'Space',
      image: spaceThemeIcon,
    },
    {
      id: 'nature' as ThemeId,
      label: 'Nature',
      image: natureThemeIcon,
    },
    {
      id: 'cartoon' as ThemeId,
      label: 'Cartoon',
      image: cartoonThemeIcon,
    },
  ]

  const carouselItems = themeOptions.map((option) => ({
    id: option.id,
    label: option.label,
    icon: (
      <img
        src={option.image}
        alt={option.label}
        style={{ width: '70px', height: '70px', objectFit: 'contain' }}
      />
    ),
  }))
  return (
    <PageShell theme={theme}>
      <PageHeader
        title="Children"
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

      <main className="flex-1 overflow-y-auto pb-24">
        <div
          className="mx-auto flex w-full flex-col"
          style={{ maxWidth: `${uiTokens.contentMaxWidth}px` }}
        >
          <StandardActionList
            theme={theme}
            items={children}
            getKey={(child) => child.id}
            getStarCount={(child) => child.totalStars}
            renderItem={(child) => {
              const currentThemeId = child.themeId || 'princess'
              const currentThemeIndex = Math.max(
                0,
                themeOptions.findIndex((option) => option.id === currentThemeId)
              )

              return (
                <div
                  className="flex flex-col"
                  style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
                >
                  <ActionTextInput
                    theme={theme}
                    label="Name"
                    value={nameDrafts[child.id] ?? child.displayName}
                    onChange={(value) =>
                      setNameDrafts((prev) => ({
                        ...prev,
                        [child.id]: value,
                      }))
                    }
                    onCommit={(value) => commitDisplayName(child.id, value)}
                    maxLength={40}
                    baseColor={theme.colors.primary}
                    inputAriaLabel="Child name"
                    transparent
                  />

                  <Carousel
                    key={`${child.id}-${currentThemeId}`}
                    items={carouselItems}
                    title="Select Theme"
                    initialIndex={currentThemeIndex}
                    onChange={(index) => {
                      const selected = themeOptions[index]
                      if (!selected) return
                      handleThemeChange(child, selected.id)
                    }}
                  />
                </div>
              )
            }}
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
            hideEdit
            onDelete={(child) => handleDelete(child.id)}
            addLabel="Add Child"
            onAdd={handleCreate}
            addDisabled={false}
            isHighlighted={(child) => activeChildId === child.id}
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                No explorers yet.
              </div>
            }
          />
        </div>
      </main>
    </PageShell>
  )
}

export default ManageChildrenPage
