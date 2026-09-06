import { type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { getTabIcon, getTabIdForPath } from '../lib/tabNavigation'
import { uiTokens } from '../tokens'
import BottomNav from '../components/ui/BottomNav'
import { AppDeviceFrame } from '../components/AppDeviceFrame'
import { useDeviceFrame } from '../hooks/useDeviceFrame'
import TabPageBoundary from './TabPageBoundary'

const TAB_TRANSITION_MS = uiTokens.tabTransitionMs

type TabTransitionStyle = CSSProperties & {
  '--msq-tab-enter-transform': string
}

const AnimatedTabLayout = () => {
  const { theme } = useTheme()
  const location = useLocation()
  const { isNativePlatform, browserFrameHeight } = useDeviceFrame()
  const activeTabId = getTabIdForPath(location.pathname)
  const incomingDirection = getTabTransitionDirection(location.state)

  const incomingTransform = `translate3d(${incomingDirection * 18}px, 0, 0)`
  const tabTransitionStyle: TabTransitionStyle = {
    animation: `msq-tab-enter ${TAB_TRANSITION_MS}ms ease forwards`,
    '--msq-tab-enter-transform': incomingTransform,
    willChange: 'opacity, transform',
  }

  return (
    <AppDeviceFrame
      theme={theme}
      isNativePlatform={isNativePlatform}
      browserFrameHeight={browserFrameHeight}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          key={location.pathname}
          className="h-full w-full min-w-0"
          style={tabTransitionStyle}
        >
          <TabPageBoundary loadingIcon={getTabIcon(activeTabId ?? 'chores')}>
            <Outlet />
          </TabPageBoundary>
        </div>
      </div>

      {activeTabId && <BottomNav theme={theme} activeTabId={activeTabId} />}
    </AppDeviceFrame>
  )
}

export default AnimatedTabLayout

const getTabTransitionDirection = (state: unknown): 1 | -1 => {
  if (!state || typeof state !== 'object') return 1
  if (!('tabTransitionDirection' in state)) return 1
  return state.tabTransitionDirection === -1 ? -1 : 1
}
