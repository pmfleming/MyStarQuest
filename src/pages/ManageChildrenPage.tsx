import { Navigate } from 'react-router-dom'
import { useDataScope } from '../sharing/ChildAccessContext'
import ParentAccessPanel from '../sharing/ParentAccessPanel'
import { themeOptions } from '../ui/themeOptions'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import StandardActionList from '../components/ui/StandardActionList'
import { getSurfaceWidthConstraints } from '../tokens'
import { createChildDefinitionListRowDescriptor } from '../ui/definitionRowDescriptors'
import { useChildren } from '../data/useChildren'

const ManageChildrenPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const { canAdmin } = useDataScope()

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

  const childListDescriptor = createChildDefinitionListRowDescriptor({
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

  if (!canAdmin) return <Navigate to="/tabs/chores" replace />
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
          renderItem={(child) => (
            <>
              {childListDescriptor.renderItem?.(child)}
              <ParentAccessPanel child={child} />
            </>
          )}
          hideEdit
          onDelete={(child) => deleteChild(child.id)}
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
