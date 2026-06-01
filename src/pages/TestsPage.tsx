import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import TopIconButton from '../components/ui/TopIconButton'
import StandardActionList from '../components/ui/StandardActionList'
import { toStandardActionListDescriptor } from '../ui/listDescriptorTypes'
import { createUnifiedChoreDescriptor } from '../ui/unifiedChoreDescriptors'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import { useTests } from '../data/useTests'
import { BITE_COOLDOWN_SECONDS, isTestWithEphemeral } from '../data/types'
import { useTaskActivityState } from '../hooks/useTaskActivityState'
import {
  princessChildrenIcon,
  princessExitIcon,
} from '../assets/themes/princess/assets'

const TestsPage = () => {
  const { logout } = useAuth()
  const { activeChildId } = useActiveChild()
  const { theme } = useTheme()

  const { tests, todayInfo, completeTest, failTest, resetTest } = useTests()

  const activity = useTaskActivityState()
  const clearActivityIds = activity.clearActiveActivities
  const [mathCheckTriggers, setMathCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [pvCheckTriggers, setPVCheckTriggers] = useState<
    Record<string, number>
  >({})
  const [alphabetCheckTriggers, setAlphabetCheckTriggers] = useState<
    Record<string, number>
  >({})

  useEffect(() => {
    clearActivityIds()
    setMathCheckTriggers({})
    setPVCheckTriggers({})
    setAlphabetCheckTriggers({})
  }, [activeChildId, clearActivityIds, todayInfo.dateKey])

  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mode: 'today',
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
    activeMathId: activity.activeMathId,
    activePVId: activity.activePVId,
    activeAlphabetId: activity.activeAlphabetId,
    activeDinnerId: null,
    activeWaterToiletId: null,
    mathCheckTriggers,
    pvCheckTriggers,
    alphabetCheckTriggers,
    setMathCheckTriggers,
    setPVCheckTriggers,
    setAlphabetCheckTriggers,
    biteCooldownSeconds: BITE_COOLDOWN_SECONDS,
    hideDeleteUtility: true,
  })

  const visibleTests = useMemo(
    () =>
      tests.filter(
        (test) => test.childId === activeChildId && test.title.trim().length > 0
      ),
    [tests, activeChildId]
  )

  return (
    <TabContent
      theme={theme}
      title="Tests"
      headerRight={
        <>
          <TopIconButton
            theme={theme}
            to="/settings/manage-children"
            ariaLabel="Children"
            icon={
              theme.id === 'princess' ? (
                <img
                  src={princessChildrenIcon}
                  alt="Children"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span className="text-sm font-bold">Kids</span>
              )
            }
          />
          <TopIconButton
            theme={theme}
            onClick={logout}
            ariaLabel="Exit"
            icon={
              theme.id === 'princess' ? (
                <img
                  src={princessExitIcon}
                  alt="Exit"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <span className="text-sm font-bold">Exit</span>
              )
            }
          />
        </>
      }
    >
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
