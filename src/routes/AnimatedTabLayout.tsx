import { useEffect, useRef, type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { getTabIdForPath, getTabIndex } from '../lib/tabNavigation'
import { uiTokens } from '../tokens'
import BottomNav from '../components/ui/BottomNav'
import { AppDeviceFrame } from '../components/AppDeviceFrame'
import { useDeviceFrame } from '../hooks/useDeviceFrame'

const TAB_TRANSITION_MS = uiTokens.tabTransitionMs

type TabTransitionStyle = CSSProperties & {
  '--msq-tab-enter-transform': string
}

const AnimatedTabLayout = () => {
  const { theme } = useTheme()
  const location = useLocation()
  const { isNativePlatform, browserFrameHeight } = useDeviceFrame()
  const previousPathRef = useRef(location.pathname)

  const activeTabId = getTabIdForPath(location.pathname)
  const incomingDirection = getTabTransitionDirection(
    previousPathRef.current,
    location.pathname
  )

  useEffect(() => {
    previousPathRef.current = location.pathname
  }, [location.pathname])

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
          <Outlet />
        </div>
      </div>

      {activeTabId && <BottomNav theme={theme} activeTabId={activeTabId} />}
    </AppDeviceFrame>
  )
}

export default AnimatedTabLayout

const getTabTransitionDirection = (
  previousPath: string,
  nextPath: string
): 1 | -1 => {
  if (previousPath === nextPath) return 1

  const previousTabId = getTabIdForPath(previousPath)
  const nextTabId = getTabIdForPath(nextPath)
  const previousIndex = previousTabId ? getTabIndex(previousTabId) : -1
  const nextIndex = nextTabId ? getTabIndex(nextTabId) : -1

  return previousIndex !== -1 && nextIndex !== -1 && nextIndex < previousIndex
    ? -1
    : 1
}
