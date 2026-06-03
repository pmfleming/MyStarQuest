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
import { BITE_COOLDOWN_SECONDS, isTestWithEphemeral } from '../data/types'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import { getPrincessTaskTypeIcon } from '../ui/taskTypeIcons'

type TestChoiceKey = 'math' | 'pv' | 'alphabet' | 'spelling'

const testChoices: Array<[TestChoiceKey, string, string]> = [
  ['math', 'Arithmetic', getPrincessTaskTypeIcon('math')],
  ['pv', 'Positional Notation', getPrincessTaskTypeIcon('positional-notation')],
  ['alphabet', 'Alphabet Match', getPrincessTaskTypeIcon('alphabet')],
  ['spelling', 'Spelling', getPrincessTaskTypeIcon('spelling')],
]

const ManageTestsPage = () => {
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()

  const {
    tests,
    testTitleDrafts,
    setTestTitleDraft,
    commitTestTitle,
    updateTestField,
    updateEphemeral,
    createMathTest,
    createPVTest,
    createAlphabetTest,
    createSpellingTest,
    completeTest,
    failTest,
    resetTest,
    deleteTest,
  } = useTests()

  const activity = useTaskActivityState()
  const [mathCheckTriggers, setMathCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggers, setPVCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [alphabetCheckTriggers, setAlphabetCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [spellingCheckTriggers, setSpellingCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [showAddChooser, setShowAddChooser] = useState(false)

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'manage',
    onUpdateTaskField: updateTestField,
    onUpdateEphemeral: updateEphemeral,
    onSetTitleDraft: setTestTitleDraft,
    onCommitTitle: commitTestTitle,
    onDeleteTask: deleteTest,
    onEnterChore: (item) => {
      if (isTestWithEphemeral(item)) {
        activity.enterActivity(item.taskType, item.id)
      }
    },
    onComplete: (item) => {
      if (isTestWithEphemeral(item)) completeTest(item)
    },
    onFail: (item) => {
      if (isTestWithEphemeral(item)) failTest(item)
    },
    onReset: (item) => {
      if (!isTestWithEphemeral(item)) return
      resetTest(item)
      activity.clearActiveActivities()
    },
    titleDrafts: testTitleDrafts,
    activeMathId: activity.activeMathId,
    activePVId: activity.activePVId,
    activeAlphabetId: activity.activeAlphabetId,
    activeSpellingId: activity.activeSpellingId,
    activeDinnerId: null,
    activeWaterToiletId: null,
    mathCheckTriggers,
    pvCheckTriggers,
    alphabetCheckTriggers,
    spellingCheckTriggers,
    setMathCheckTriggers,
    setPVCheckTriggers,
    setAlphabetCheckTriggers,
    setSpellingCheckTriggers,
    biteCooldownSeconds: BITE_COOLDOWN_SECONDS,
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
                        pv: createPVTest,
                        alphabet: createAlphabetTest,
                        spelling: createSpellingTest,
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
