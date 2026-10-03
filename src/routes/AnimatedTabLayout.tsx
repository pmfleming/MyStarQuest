import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useOutlet, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { getTabIcon, getTabIdForPath } from '../lib/tabNavigation'
import { uiTokens } from '../tokens'
import BottomNav from '../components/ui/BottomNav'
import { AppDeviceFrame } from '../components/AppDeviceFrame'
import { useDeviceFrame } from '../hooks/useDeviceFrame'
import TabPageBoundary from './TabPageBoundary'
import RouteReady from './RouteReady'
import {
  ActivityTabVisibleContext,
  ResetChoresContext,
} from '../contexts/ActivityTabContext'

const TAB_TRANSITION_MS = uiTokens.tabTransitionMs

type TabTransitionStyle = CSSProperties & {
  '--msq-tab-enter-transform': string
}

const AnimatedTabLayout = () => {
  const { theme } = useTheme()
  const location = useLocation()
  const { isNativePlatform, browserFrameHeight } = useDeviceFrame()
  const activeTabId = getTabIdForPath(location.pathname)
  const outlet = useOutlet()
  const resetChores = useRef<(() => Promise<void>) | null>(null)
  const [activityPages, setActivityPages] = useState<
    Partial<Record<'chores' | 'tests', ReactNode>>
  >({})
  const isActivityTab = activeTabId === 'chores' || activeTabId === 'tests'
  // Retain the route element (including its route context), so local activity
  // state and timers survive navigation. Load each page only on its first visit.
  if (isActivityTab && !activityPages[activeTabId]) {
    setActivityPages((previous) => ({ ...previous, [activeTabId]: outlet }))
  }
  const incomingDirection = getTabTransitionDirection(location.state)

  const incomingTransform = `translate3d(${incomingDirection * 18}px, 0, 0)`
  const tabTransitionStyle: TabTransitionStyle = {
    animation: `msq-tab-enter ${TAB_TRANSITION_MS}ms ease forwards`,
    '--msq-tab-enter-transform': incomingTransform,
    willChange: 'opacity, transform',
  }

  return (
    <ResetChoresContext value={resetChores}>
      <AppDeviceFrame
        theme={theme}
        isNativePlatform={isNativePlatform}
        browserFrameHeight={browserFrameHeight}
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {(['chores', 'tests'] as const).map(
            (tabId) =>
              activityPages[tabId] && (
                <div
                  key={tabId}
                  hidden={activeTabId !== tabId}
                  inert={activeTabId !== tabId}
                  className="h-full w-full min-w-0"
                  style={activeTabId === tabId ? tabTransitionStyle : undefined}
                >
                  <ActivityTabVisibleContext value={activeTabId === tabId}>
                    <TabPageBoundary loadingIcon={getTabIcon(tabId, theme.id)}>
                      <RouteReady>{activityPages[tabId]}</RouteReady>
                    </TabPageBoundary>
                  </ActivityTabVisibleContext>
                </div>
              )
          )}
          {!isActivityTab && (
            <div
              key={location.pathname}
              className="h-full w-full min-w-0"
              style={tabTransitionStyle}
            >
              <TabPageBoundary
                loadingIcon={getTabIcon(activeTabId ?? 'chores', theme.id)}
              >
                <RouteReady>{outlet}</RouteReady>
              </TabPageBoundary>
            </div>
          )}
        </div>

        {activeTabId && <BottomNav theme={theme} activeTabId={activeTabId} />}
      </AppDeviceFrame>
    </ResetChoresContext>
  )
}

export default AnimatedTabLayout

const getTabTransitionDirection = (state: unknown): 1 | -1 => {
  if (!state || typeof state !== 'object') return 1
  if (!('tabTransitionDirection' in state)) return 1
  return state.tabTransitionDirection === -1 ? -1 : 1
}
