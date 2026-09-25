import { useEffect, useMemo } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import ResourceLoadingIcon from '../components/ui/ResourceLoadingIcon'
import { getTabIcon } from '../lib/tabNavigation'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { useTests } from '../data/useTests'
import { useChildren } from '../data/useChildren'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../hooks/useTestCheckTriggers'
import { createTestActivityBindings } from '../ui/testActivityBindings'
import { filterActiveChildItems } from '../data/dailyTaskState'
import { useTaskCelebration } from '../hooks/useTaskCelebration'

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
  const celebration = useTaskCelebration({
    items: tests,
    activeChildId,
    dateKey: todayInfo.dateKey,
    totalStars: activeChild?.totalStars ?? 0,
  })
  const testFailureModeEnabled = activeChild?.testFailureModeEnabled ?? true
  const clearActivityIds = activity.clearActiveActivities
  const triggers = useTestCheckTriggers()
  const clearCheckTriggers = triggers.clearCheckTriggers

  useEffect(() => {
    clearActivityIds()
    clearCheckTriggers()
  }, [activeChildId, clearActivityIds, clearCheckTriggers, todayInfo.dateKey])

  const descriptor = celebration.decorate(
    createUnifiedChoreDescriptor({
      theme,
      onUpdateTaskField: updateTestField,
      onUpdateEphemeral: updateEphemeral,
      ...createTestActivityBindings({
        activity,
        triggers,
        completeTest: (test) =>
          celebration.run(test, tests, (onAward) =>
            completeTest(test, onAward)
          ),
        failTest,
        resetTest,
      }),
      hideDeleteUtility: true,
      testFailureModeEnabled,
    }),
    theme
  )

  const visibleTests = useMemo(
    () => filterActiveChildItems(tests, activeChildId),
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
            items={celebration.retainItems(visibleTests)}
            getKey={(test) => test.id}
            getItemLabel={(test) => test.title}
            {...toStandardActionListDescriptor(descriptor)}
            getStarCount={() => undefined}
            hideEdit
            onDelete={() => undefined}
            addLabel="Add Test"
            onAdd={() => undefined}
            hideAdd
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                <ResourceLoadingIcon
                  src={getTabIcon('tests', theme.id)}
                  loading
                  label="Loading tests"
                />
              </div>
            }
          />
        )}
      </div>
    </TabContent>
  )
}

export default TestsPage
