import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { themes } from '../../src/contexts/ThemeContext'
import { buildDefaultTests } from '../../src/data/taskDocuments'
import { manageTestOutcomePatch } from '../../src/data/dailyTaskState'
import type { TestWithEphemeral } from '../../src/data/types'
import { useTaskActivityState } from '../../src/hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../../src/hooks/useTestCheckTriggers'
import { toStandardActionListDescriptor } from '../../src/ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../../src/ui/unifiedChoreDescriptors'
import '../../src/index.css'

export default function Fixture() {
  const theme =
    new URLSearchParams(location.search).get('theme') === 'teenie'
      ? themes.teenie
      : themes.princess
  const [test, setTest] = useState<TestWithEphemeral>(() =>
    buildDefaultTests('child').find((item) => item.taskType === 'fractions')!
  )
  const [awards, setAwards] = useState(0)
  const activity = useTaskActivityState()
  const triggers = useTestCheckTriggers()
  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'today',
    activeIds: activity.activeIds,
    checkTriggers: triggers.checkTriggers,
    onCheck: triggers.onCheck,
    onEnterChore: (item) => activity.enterActivity(item.taskType, item.id),
    onUpdateTaskField: (_id, fields) =>
      setTest((current) => ({ ...current, ...fields })),
    onComplete: () => {
      setAwards((value) => value + 1)
      setTest((current) => ({
        ...current,
        ...manageTestOutcomePatch('fractions', Date.now(), 'success'),
      }))
    },
    onReset: () => {
      activity.clearActiveActivities()
      setTest((current) => ({
        ...current,
        ...manageTestOutcomePatch('fractions', null, null),
      }))
    },
    hideDeleteUtility: true,
    biteCooldownSeconds: 15,
  })
  return (
    <main
      style={{
        maxWidth: 380,
        margin: '16px auto',
        padding: 8,
        background: theme.colors.bg,
      }}
    >
      <StandardActionList
        theme={theme}
        items={[test]}
        getKey={(item) => item.id}
        getItemLabel={(item) => item.title}
        {...toStandardActionListDescriptor(descriptor)}
        hideEdit
        hideAdd
        onDelete={() => undefined}
        onAdd={() => undefined}
        addLabel="Add test"
      />
      <output aria-label="Completion count" style={{ display: 'none' }}>
        {awards}
      </output>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
