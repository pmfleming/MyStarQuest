import { useEffect, useMemo } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { useTests } from '../data/useTests'
import { useChildren } from '../data/useChildren'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../hooks/useTestCheckTriggers'
import { createTestActivityBindings } from '../ui/testActivityBindings'

const TestsPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const { children } = useChildren()

  const {
    tests,
    todayInfo,
    updateTestField,
    updateEphemeral,
    completeTest,
    failTest,
    resetTest,
  } = useTests()

  const activity = useTaskActivityState()
  const activeChild = children.find((child) => child.id === activeChildId)
  const testFailureModeEnabled = activeChild?.testFailureModeEnabled ?? true
  const clearActivityIds = activity.clearActiveActivities
  const triggers = useTestCheckTriggers()
  const clearCheckTriggers = triggers.clearCheckTriggers

  useEffect(() => {
    clearActivityIds()
    clearCheckTriggers()
  }, [activeChildId, clearActivityIds, clearCheckTriggers, todayInfo.dateKey])

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'today',
    onUpdateTaskField: updateTestField,
    onUpdateEphemeral: updateEphemeral,
    ...createTestActivityBindings({
      activity,
      triggers,
      completeTest,
      failTest,
      resetTest,
    }),
    hideDeleteUtility: true,
    testFailureModeEnabled,
  })

  const visibleTests = useMemo(
    () =>
      tests.filter(
        (test) => test.childId === activeChildId && test.title.trim().length > 0
      ),
    [tests, activeChildId]
  )

  return (
    <TabContent theme={theme} title="Tests">
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        {!activeChildId ? (
          <div className="mt-10 flex flex-col items-center text-center opacity-70">
            <span className="mb-4 text-4xl font-black" aria-label="Child">
              Child
            </span>
            <p className="text-2xl font-bold">
              Pick a child before planning tests.
            </p>
          </div>
        ) : (
          <StandardActionList
            theme={theme}
            items={visibleTests}
            getKey={(test) => test.id}
            {...toStandardActionListDescriptor(descriptor)}
            getStarCount={() => undefined}
            hideEdit
            onDelete={() => undefined}
            addLabel="Add Test"
            onAdd={() => undefined}
            hideAdd
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                Tests are loading.
              </div>
            }
          />
        )}
      </div>
    </TabContent>
  )
}

export default TestsPage
