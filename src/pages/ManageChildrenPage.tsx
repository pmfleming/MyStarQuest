import type { ThemeId } from '../ui/themeOptions'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import StandardActionList from '../components/StandardActionList'
import { uiTokens } from '../ui/tokens'
import { createChildDefinitionListRowDescriptor } from '../ui/definitionRowDescriptors'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { useChildren } from '../data/useChildren'
import { princessThemeIcon } from '../assets/themes/princess/assets'
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

  const childListDescriptor = toStandardActionListDescriptor(
    createChildDefinitionListRowDescriptor({
      theme,
      activeChildId,
      themeOptions,
      carouselItems,
      nameDrafts,
      setNameDraft,
      commitDisplayName,
      updateChildField,
      changeTheme,
      selectChild,
    })
  )

  return (
    <PageShell theme={theme} activeTabId="dashboard" title="Children">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          maxWidth: `${uiTokens.contentMaxWidth}px`,
          paddingBottom: '96px',
        }}
      >
        <StandardActionList
          theme={theme}
          items={children}
          getKey={(child) => child.id}
          {...childListDescriptor}
          hideEdit
          onDelete={(child) => handleDelete(child.id)}
          addLabel="Add Child"
          onAdd={createChild}
          addDisabled={false}
          emptyState={
            <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
              No explorers yet.
            </div>
          }
        />
      </div>
    </PageShell>
  )
}

export default ManageChildrenPage
