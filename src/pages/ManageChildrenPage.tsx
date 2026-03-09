import type { ThemeId } from '../constants/themeOptions'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import TopIconButton from '../components/TopIconButton'
import StandardActionList from '../components/StandardActionList'
import Carousel from '../components/Carousel'
import ActionTextInput from '../components/ActionTextInput'
import StarDisplay from '../components/StarDisplay'
import { uiTokens } from '../ui/tokens'
import { useChildren } from '../data/useChildren'
import {
  princessActiveIcon,
  princessHomeIcon,
  princessSelectIcon,
  princessThemeIcon,
} from '../assets/themes/princess/assets'
import spaceThemeIcon from '../assets/themes/space/space.svg'
import natureThemeIcon from '../assets/themes/nature/nature.svg'
import cartoonThemeIcon from '../assets/themes/cartoon/cartoon.svg'

const ManageChildrenPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()

  const {
    children,
    nameDrafts,
    setNameDraft,
    commitDisplayName,
    updateChildField,
    changeTheme,
    createChild,
    deleteChild,
    selectChild,
  } = useChildren()

  const handleDelete = async (id: string) => {
    try {
      await deleteChild(id)
    } catch (error) {
      console.error('Failed to delete child profile', error)
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
                    onChange={(value) => setNameDraft(child.id, value)}
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
                      changeTheme(child, selected.id)
                    }}
                  />

                  <StarDisplay
                    theme={theme}
                    count={child.totalStars}
                    editable
                    min={0}
                    max={999}
                    onChange={(value) =>
                      updateChildField(child.id, { totalStars: value })
                    }
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
              onClick: (child) => selectChild(child.id),
              disabled: (child) => activeChildId === child.id,
              variant: theme.id === 'princess' ? 'neutral' : 'primary',
            }}
            hideEdit
            onDelete={(child) => handleDelete(child.id)}
            addLabel="Add Child"
            onAdd={createChild}
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
