import { themeOptions } from '../ui/themeOptions'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import StandardActionList from '../components/ui/StandardActionList'
import { getSurfaceWidthConstraints } from '../tokens'
import { createChildDefinitionListRowDescriptor } from '../ui/definitionRowDescriptors'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { useChildren } from '../data/useChildren'

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

  const carouselItems = themeOptions.map((option) => ({
    id: option.id,
    label: option.label,
    icon: (
      <img
        src={option.image}
        alt={option.label}
        loading="lazy"
        decoding="async"
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
    <PageShell theme={theme} activeTabId="chores" title="Children">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          paddingBottom: '96px',
        }}
      >
        <StandardActionList
          theme={theme}
          items={children}
          getKey={(child) => child.id}
          getItemLabel={(child) => child.displayName}
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
