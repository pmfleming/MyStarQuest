import { useAsyncFeedback } from '../hooks/useAsyncFeedback'
import { TEST_TEMPLATES } from '../../functions/src/sharing/defaultTests'
import { TEST_TYPES, type TestType } from '../data/types'
import { useDataScope } from '../sharing/ChildAccessContext'
import { useEffect, useMemo, useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import StandardActionList from '../components/ui/StandardActionList'
import ResourceLoadingIcon from '../components/ui/ResourceLoadingIcon'
import { getTabIcon } from '../lib/tabNavigation'
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
  const { canAdmin } = useDataScope()
  const { children } = useChildren()

  const {
    tests,
    canManageTests,
    createTest,
    deleteTest,
    todayInfo,
    updateTestField,
    updateEphemeral,
    completeTest,
    failTest,
    resetTest,
  } = useTests()

  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState<TestType>('math')
  const {
    busy: saving,
    message: error,
    run,
  } = useAsyncFeedback('Could not add test.')
  const activityScope = `${activeChildId}:${todayInfo.dateKey}`
  const activity = useTaskActivityState(activityScope)
  const activeChild = children.find((child) => child.id === activeChildId)
  const celebration = useTaskCelebration({
    items: tests,
    activeChildId,
    dateKey: todayInfo.dateKey,
    totalStars: activeChild?.totalStars ?? 0,
  })
  const testFailureModeEnabled = activeChild?.testFailureModeEnabled ?? true
  const triggers = useTestCheckTriggers()
  const clearCheckTriggers = triggers.clearCheckTriggers

  useEffect(() => {
    clearCheckTriggers()
  }, [activeChildId, clearCheckTriggers, todayInfo.dateKey])

  const descriptor = celebration.decorate(
    createUnifiedChoreDescriptor({
      canReset: canAdmin,
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
      hideDeleteUtility: !canManageTests,
      onDeleteTask: deleteTest,
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
            key={activityScope}
            theme={theme}
            items={celebration.retainItems(visibleTests)}
            getKey={(test) => test.id}
            getItemLabel={(test) => test.title}
            {...descriptor}
            getStarCount={() => undefined}
            hideEdit
            onDelete={(test) => deleteTest(test.id)}
            addLabel="Add Test"
            onAdd={() => setAdding(true)}
            hideAdd={!canManageTests}
            addDisabled={saving}
            inlineNewRow={
              adding ? (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void run(async () => {
                      await createTest(newType)
                      setAdding(false)
                    })
                  }}
                >
                  <label>
                    Test type
                    <select
                      className="ml-3 rounded-lg border bg-white p-2 text-black"
                      value={newType}
                      onChange={(event) =>
                        setNewType(
                          TEST_TYPES.find(
                            (type) => type === event.target.value
                          ) ?? newType
                        )
                      }
                    >
                      {TEST_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {TEST_TEMPLATES[type].title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button disabled={saving} className="font-bold underline">
                    Save test
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </button>
                  {error && <p role="alert">{error}</p>}
                </form>
              ) : undefined
            }
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                {canManageTests ? (
                  <p>No tests yet. Add a test to get started.</p>
                ) : (
                  <ResourceLoadingIcon
                    src={getTabIcon('tests', theme.id)}
                    loading
                    label="Loading tests"
                  />
                )}
              </div>
            }
          />
        )}
      </div>
    </TabContent>
  )
}

export default TestsPage
