import { useState } from 'react'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import StandardActionList from '../components/ui/StandardActionList'
import ScheduleDayTypeControl from '../components/ui/ScheduleDayTypeControl'
import { InlineChoiceList } from '../components/ui/InlineChoiceList'
import { getSurfaceWidthConstraints } from '../tokens'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { useTests } from '../data/useTests'
import { useChildren } from '../data/useChildren'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import { useTestCheckTriggers } from '../hooks/useTestCheckTriggers'
import { createTestActivityBindings } from '../ui/testActivityBindings'
import { getPrincessTaskTypeIcon } from '../ui/taskTypeIcons'

type TestChoiceKey =
  | 'math'
  | 'largeNumbers'
  | 'pv'
  | 'alphabet'
  | 'spelling'
  | 'animals'

const testChoices: Array<[TestChoiceKey, string, string]> = [
  ['math', 'Arithmetic', getPrincessTaskTypeIcon('math')],
  ['largeNumbers', 'Large Numbers', getPrincessTaskTypeIcon('large-numbers')],
  ['pv', 'Positional Notation', getPrincessTaskTypeIcon('positional-notation')],
  ['alphabet', 'Alphabet Match', getPrincessTaskTypeIcon('alphabet')],
  ['spelling', 'Spelling', getPrincessTaskTypeIcon('spelling')],
  ['animals', 'Animals', getPrincessTaskTypeIcon('animals')],
]

const ManageTestsPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()
  const { children } = useChildren()

  const {
    tests,
    testTitleDrafts,
    setTestTitleDraft,
    commitTestTitle,
    updateTestField,
    updateEphemeral,
    createMathTest,
    createLargeNumbersTest,
    createPVTest,
    createAlphabetTest,
    createSpellingTest,
    createAnimalsTest,
    completeTest,
    failTest,
    resetTest,
    deleteTest,
  } = useTests()

  const activity = useTaskActivityState()
  const activeChild = children.find((child) => child.id === activeChildId)
  const testFailureModeEnabled = activeChild?.testFailureModeEnabled ?? true
  const triggers = useTestCheckTriggers()
  const [showAddChooser, setShowAddChooser] = useState(false)

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'manage',
    onUpdateTaskField: updateTestField,
    onUpdateEphemeral: updateEphemeral,
    onSetTitleDraft: setTestTitleDraft,
    onCommitTitle: commitTestTitle,
    onDeleteTask: deleteTest,
    ...createTestActivityBindings({
      activity,
      triggers,
      completeTest,
      failTest,
      resetTest,
    }),
    titleDrafts: testTitleDrafts,
    testFailureModeEnabled,
    renderDayTypeControl: (task) => (
      <ScheduleDayTypeControl
        theme={theme}
        task={task}
        onUpdate={updateTestField}
      />
    ),
  })

  return (
    <PageShell theme={theme} activeTabId="tests" title="Manage Tests">
      <div
        className="mx-auto w-full"
        style={{
          ...getSurfaceWidthConstraints(),
          paddingBottom: '128px',
        }}
      >
        {!activeChildId ? (
          <div className="mt-10 flex flex-col items-center text-center opacity-70">
            <span className="mb-4 text-6xl">👶</span>
            <p className="text-2xl font-bold">No explorers yet!</p>
          </div>
        ) : (
          <StandardActionList
            theme={theme}
            items={tests}
            getKey={(test) => test.id}
            {...toStandardActionListDescriptor(descriptor)}
            hideEdit
            onDelete={(test) => deleteTest(test.id)}
            addLabel="New Test"
            onAdd={() => setShowAddChooser(true)}
            inlineNewRow={
              showAddChooser ? (
                <InlineChoiceList
                  theme={theme}
                  choices={testChoices.map(([key, label, icon]) => ({
                    key,
                    label,
                    icon,
                    onSelect: () => {
                      const createByKey = {
                        math: createMathTest,
                        largeNumbers: createLargeNumbersTest,
                        pv: createPVTest,
                        alphabet: createAlphabetTest,
                        spelling: createSpellingTest,
                        animals: createAnimalsTest,
                      }
                      createByKey[key]()
                      setShowAddChooser(false)
                    },
                  }))}
                  onCancel={() => setShowAddChooser(false)}
                />
              ) : undefined
            }
            emptyState={
              <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
                No tests yet.
              </div>
            }
          />
        )}
      </div>
    </PageShell>
  )
}

export default ManageTestsPage
